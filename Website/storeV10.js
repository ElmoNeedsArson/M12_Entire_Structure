function safeParse(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.warn(`Failed to parse ${key}:`, e);
    return null;
  }
}

const studentId = localStorage.getItem("studentId");
const timestamp = localStorage.getItem("timeSpentOnPage");

const runCount      = safeParse("runButtonCount")      ?? 0;
const feedbackCount = safeParse("feedbackButtonCount") ?? 0;

const combined2 = {
  studentId: studentId || "unknown",
  timeSpentOnPage: timestamp || "unknown",
  runButtonCount: runCount,
  feedbackButtonCount: feedbackCount,
  survey1: safeParse("finalSurveyResults") || {},
  survey2: safeParse("finalSurveyResults_closing") || {}
};

// Send to your Express backend instead of directly to external API
fetch('', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(combined2)
})
  .then(response => {
    if (!response.ok) throw new Error("Submission failed");
    return response.json();
  })
  .then(data => {
    console.log("Survey submitted via backend successfully:", data);
  })
  .catch(err => {
    console.error("Survey submission error:", err);
  });
