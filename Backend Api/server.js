import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import Bottleneck from "bottleneck";
import OpenAI from "openai";
import pRetry from "p-retry";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const FRONTEND_ORIGIN = '';
app.use(cors({ origin: FRONTEND_ORIGIN }));

app.use(express.json());

const perMinuteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 7,
    keyGenerator: req => req.body.studentId,
    handler: (req, res) =>
        res.status(429).json({ error: "Only 7 calls per minute allowed." }),
});

const totalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    keyGenerator: req => req.body.studentId,
    handler: (req, res) =>
        res.status(429).json({ error: "You've reached your 100-request total limit." }),
});

const limiter = new Bottleneck({
    maxConcurrent: 1,
    reservoir: 499,
    reservoirRefreshAmount: 499,
    reservoirRefreshInterval: 60 * 1000,
    minTime: 120
});

let totalTokensUsed = 0;
let tokensThisMinute = 0;

setInterval(() => {
    console.log(`Tokens used in the last minute: ${tokensThisMinute}`);
    tokensThisMinute = 0;
}, 60 * 1000);

app.use((req, res, next) => {
    console.log(req.header("X-Internal-Auth"))
    if (req.header("X-Internal-Auth") !== process.env.INTERNAL_AUTH_TOKEN) {
        console.log("No authorization token")
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
});

app.use("/api/feedback", (req, res, next) => {
    if (!req.body.studentId) {
        console.log(`A student made a feedback request without ID`)
        return res
            .status(400)
            .json({ error: "Missing studentId in request body." });
    }
    console.log(`student ${req.body.studentId} made a feedback request`);
    next();
});

function sanitizeCode(code, maxLines = 100, maxChars = 5000) {
    if (!code) return '';
    let sanitized = code.toString().slice(0, maxChars);
    const lines = sanitized.split('\n').slice(0, maxLines);
    return lines.join('\n');
}

function normalizeWhitespace(code) {
    return code.replace(/[^\x20-\x7E\r\n\t]/g, '')
        .replace(/\s+$/gm, '')
        .replace(/\n{3,}/g, '\n\n');
}

function roughTokenEstimate(text) {
    return Math.ceil(text.length / 4);
}

app.post("/api/feedback", perMinuteLimiter, totalLimiter, async (req, res) => {
    const { studentCode, pastCode, feedbackVariant } = req.body;
    if (!studentCode)
        return res.status(400).json({ error: "Missing studentCode." });

    const cleanStudentCode = normalizeWhitespace(sanitizeCode(studentCode));

    if (roughTokenEstimate(cleanStudentCode) > 500) {
        return res.status(400).json({ error: "Code too long." });
    }

    let character;
    let valence;

    if (feedbackVariant) {
        if (feedbackVariant == 1) {
            console.log("Feedback variant 1 selected.");
            //Positive valence
            //Authoritive, Brief, Non emotional or critical
            character = "Authoritive, brief, non-emotional (or even critical)";
            valence = "positive";
        } else if (feedbackVariant == 2) {
            console.log("Feedback variant 2 selected.");
            //Negative valence
            //Authoritive, Brief, Non emotional or critical
            character = "Authoritive, brief, non-emotional (or even critical)";
            valence = "negative";
        } else if (feedbackVariant == 3) {
            console.log("Feedback variant 3 selected.");
            //Positive valence
            //Non-Authoritive, extensive, not brief, emotional or supportive
            character = "Non-Authoritive, extensive, emotional (or supportive)";
            valence = "positive";
        } else if (feedbackVariant == 4) {
            console.log("Feedback variant 4 selected.");
            //Negative valence
            //Non-Authoritive, extensive, not brief, emotional or supportive
            character = "Non-Authoritive, extensive, emotional (or supportive)";
            valence = "negative";
        }
    } else {
        console.log("No feedback variant provided, using default.");
        valence = "default";
    }

    const prompt = `
    System:
    You are one of four different feedback variants. A big variable is the valence of the feedback. You are in this case ${valence} valence.
    The other variable ties into your character. You are in this case a ${character} character who guides first-year students step by step—especially around millis() vs delay().
    These character traits and valence go above all other instructions you are given, you must remain in character. 
    Based on these properties, come up with a character, and play this role convincingly.

    The Student's assignment:
Rewrite the Arduino blink example so LEDs on pins 13, 12, and 11 blink at 700 ms, 900 ms, and 1300 ms intervals using millis(). 
Each LED must have its own control_PIN_NR_led() function called from void loop(). With a bool as such "static bool ledStateNR = LOW;"

The student has currently written the following code:
\`\`\`cpp
${cleanStudentCode}
\`\`\`
${pastCode ? `Previous version:\n\`\`\`cpp\n${pastCode}\n\`\`\`` : ''}

Constraints:
- Favor simplicity over efficiency—no arrays/objects.
- The students are First-year level; use only basic functions.

Identify which of the task's micro-steps (removing delay(), three pin setup, timing logic, state toggle) the student hasn't nailed yet, 
call out any errors you see there, and then offer exactly one next action to get them unstuck.

Feedback style:
- Maximum 1-2 sentences, or 3 brief sentences. (Your character may overrule this if needed)
- Point out exactly what concept to apply (Removing, adding or altering code).
- You must use examples or pseudocode to illustrate your point.
- You must avoid answering the full code in your reply.
- End with “Your next step: …”

Once again make sure your answer is in character. You must adress the user, by saying 'you'. Lastly make it clear when the assignment is roughly passed, and seize giving feedback.`;
    ;
    try {
        const apiRes = await getFeedback(prompt);

        const used = apiRes.usage?.total_tokens ?? 0;
        totalTokensUsed += used;
        tokensThisMinute += used;
        console.log(
            `Tokens this call: ${used} | ` +
            `Total so far: ${totalTokensUsed} | ` +
            `This minute: ${tokensThisMinute}`
        );

        res.json({ feedback: apiRes.choices[0].message.content });
    } catch (err) {
        console.error("All attempts failed:", err);
        res.status(502).json({ error: "Service temporarily unavailable." });
    }
});

async function getFeedback(prompt) {
    return limiter.schedule(() =>
        pRetry(
            () =>
                openai.chat.completions.create({
                    model: "gpt-4.1-nano", //gpt-4.1-mini is also good
                    messages: [{ role: "user", content: prompt }],
                }),
            {
                retries: 3,
                onFailedAttempt: (err) => {
                    console.warn(
                        `OpenAI attempt #${err.attemptNumber} failed; ${err.retriesLeft} retries left.`
                    );
                },
            }
        )
    );
}

app.listen(port, () => {
    console.log(`Arduino Tutor API is running at http://localhost:${port}`);
});