import { PinState } from 'https://esm.sh/avr8js';
import { AVRRunner } from './functions/execute.js';
import { formatTime } from './functions/format-time.js';
import { buildHex } from './functions/compileV5.js';
import { CPUPerformance } from './functions/cpu-performance.js';
import EditorHistoryUtil from './functions/editorHistory.js';

const results = JSON.parse(localStorage.getItem("finalSurveyResults"));
console.log("Loaded survey results:", results);

const avatar_img = document.getElementById('avatar-image');

const feedbackConfig = {
  1: { message: "Seated at the front left.", folder: "images/avatars/avatar1" },
  2: { message: "Seated at the front right.", folder: "images/avatars/avatar2" },
  3: { message: "Seated at the back left.", folder: "images/avatars/avatar3" },
  4: { message: "Seated at the back right.", folder: "images/avatars/avatar4" }
};

// all the states of avatars, if i want to animate them or smth
const avatarStates = ['temp'];

let currentState = 'default1';

const preloaded = {};

function preloadAll() {
  Object.entries(feedbackConfig).forEach(([seat, { folder }]) => {
    avatarStates.forEach(state => {
      const path = `${folder}/${state}.png`;
      const img = new Image();
      img.onload = () => { preloaded[path] = img; };
      img.onerror = () => { console.warn("Failed to preload:", path); };
      img.src = path;
    });
  });
}

function updateAvatar() {
  const path = `${feedbackConfig[feedbackVariant].folder}/${currentState}.png`;
  if (!avatar_img) return;

  console.log(feedbackConfig[feedbackVariant].message, `"${currentState}"`);
  avatar_img.style.opacity = 0;

  setTimeout(() => {
    if (preloaded[path]) {
      avatar_img.src = preloaded[path].src;
    } else {
      console.warn("Using non-preloaded image:", path);
      avatar_img.src = path;
    }
    avatar_img.style.opacity = 1;
  }, 300);
}

function selectVariant(seatNum) {
  if (!feedbackConfig[seatNum]) {
    console.warn("Unknown seat:", seatNum);
    return;
  }
  //set variable for authority ------------------------------------------------------------------------------------------------------------
  //other text variables ---------------------------------------- update getfeedback aswell. 
  feedbackVariant = seatNum;
  updateAvatar();
}

function selectState(state) {
  if (!avatarStates.includes(state)) {
    console.warn("Unknown state:", state);
    return;
  }
  currentState = state;
  updateAvatar();
}

window.addEventListener('DOMContentLoaded', preloadAll);

let feedbackVariant = results.which_feedback_variant
console.log(feedbackVariant)
selectVariant(feedbackVariant)

let studentId = localStorage.getItem("studentId");
if (!studentId) {
  studentId = crypto.randomUUID();
  localStorage.setItem("studentId", studentId);
}

let sessionStartTime = localStorage.getItem("sessionStartTime");
if (!sessionStartTime) {
  sessionStartTime = Date.now();
  localStorage.setItem("sessionStartTime", sessionStartTime);
}

const feedbackBox = document.getElementById('feedback');
const startButton = document.getElementById('start-button');
const overlayIntro = document.getElementById('overlay-intro');

startButton.addEventListener('click', () => {
  overlayIntro.style.display = 'none';
})

const helpButton = document.getElementById('help-button');
helpButton.addEventListener('click', () => {
  overlayIntro.style.display = 'flex';
});

let editor;

const BLINK_CODE = `// Green LED connected to LED_BUILTIN and pin 13,
// Red LED connected to pin 12. Enjoy!
// Blue LED connected to pin 11. Enjoy!

// the setup function runs once when you press reset or power the board
void setup() {
    pinMode(13, OUTPUT);    // initialize digital pin 13 as an output
}

// the loop function runs over and over again forever
void loop() {
    digitalWrite(13, HIGH); // turn the LED on (HIGH is the voltage level)
    Serial.println("LED is ON");
    delay(1000);            // wait for a second
    digitalWrite(13, LOW);  // turn the LED off by making the voltage LOW
    Serial.println("LED is OFF");
    delay(1000);            // wait for a second
}`.trim();

const BLINK_CODE_2 = `// Green LED connected to LED_BUILTIN and pin 13,
// Red LED connected to pin 12. Enjoy!
// Blue LED connected to pin 11. Enjoy!

int ledPin = 11;
unsigned long previousTime = 0;
int interval = 1000;
int ledState = LOW;

// the setup function runs once when you press 'run'
void setup() {
  pinMode(ledPin, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  unsigned long currentTime = millis();

  if (currentTime - previousTime > interval) {
    if(ledState == HIGH){
      ledState = LOW;
    } else if(ledState == LOW){
      ledState = HIGH;
    }
    Serial.println(ledState);
    digitalWrite(ledPin, ledState);
    previousTime = currentTime;
  }
}`

const led13 = document.getElementById('13');
const led12 = document.getElementById('12');
const led11 = document.getElementById('11');

let runner;

const runButton2 = document.getElementById('run-button')
const feedbackButton = document.getElementById('feedback-button');
const finishButton = document.getElementById('finish-button');

const stopButton2 = document.getElementById('stop-button');
stopButton2.addEventListener('click', stopCode);

const revertButton = document.getElementById('revert-button');
revertButton.addEventListener('click', setBlinkSnippet);

const statusLabel = document.getElementById('status-label');
const compilerOutputText = document.getElementById('compiler-output-text');
const serialOutputText = document.getElementById('serial-output-text');

async function compileAndRun() {
  incrementLocalStorageCounter("runButtonCount");
  led12.value = false;
  led13.value = false;

  storeUserSnippet();

  runButton2.setAttribute('disabled', '1');
  revertButton.setAttribute('disabled', '1');

  serialOutputText.textContent = '';
  try {
    statusLabel.textContent = 'Compiling...';
    const result = await buildHex(editor.getModel().getValue());
    compilerOutputText.textContent = result.stderr || result.stdout;
    if (result.hex) {
      compilerOutputText.textContent += '\nProgram running...';
      stopButton2.removeAttribute('disabled');
      console.log(result.hex)
      executeProgram(result.hex);
    } else {
      runButton2.removeAttribute('disabled');
    }
  } catch (err) {
    runButton2.removeAttribute('disabled');
    revertButton.removeAttribute('disabled');
    alert('Failed: ' + err);
  } finally {
    statusLabel.textContent = '';
  }
}

console.log('loading main script')

require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' } });
window.MonacoEnvironment = { getWorkerUrl: () => proxy };

let proxy = URL.createObjectURL(new Blob([`
self.MonacoEnvironment = {
    baseUrl: 'https://unpkg.com/monaco-editor@latest/min/'
};
importScripts('https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js');
`], { type: 'text/javascript' }));

require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById('code-editor'), {
    value: EditorHistoryUtil.getValue() || BLINK_CODE,
    language: 'cpp',
    minimap: { enabled: false },
    automaticLayout: true,
  });

  runButton2.addEventListener('click', compileAndRun);
  feedbackButton.addEventListener('click', () => {
    incrementLocalStorageCounter("feedbackButtonCount");
    globalMaybeFeedback({ overrideMin: true })
  });
  finishButton.addEventListener('click', finish);
  automaticFeedback()
})

async function getFeedback() {
  console.log("Requesting feedback...")
  let studentCode = editor.getValue();
  feedbackBox.textContent = "Loading...";

  try {
    const response = await fetch('', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId: studentId, studentCode: studentCode, feedbackVariant: feedbackVariant })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    //feedbackBox.textContent = data.feedback || "...";
    feedbackHistory.push(data.feedback);
    feedbackIndex = feedbackHistory.length - 1;
    renderFeedback();
    updateArrowButtons();
  } catch (err) {
    console.log(`Error: ${err.message}`)
    feedbackBox.textContent = `Error: Something went wrong when I tried to give feedback for you, contact the researcher, if this doesn't go away.`;
  }
}

async function fetchAndStoreFeedback() {
  const data = await fetchFeedbackFromAPI();
  const fbText = data.feedback || "...";

  if (fbText !== feedbackHistory[feedbackHistory.length - 1]) {
    feedbackHistory.push(fbText);
    feedbackIndex = feedbackHistory.length - 1;
    renderFeedback();
    updateArrowButtons();
  }
}

function executeProgram(hex) {
  runner = new AVRRunner(hex);
  const MHZ = 16000000;

  let lastState = PinState.Input;
  let lastStateCycles = 0;
  let lastUpdateCycles = 0;
  let ledHighCycles = 0;

  runner.portB.addListener((value) => {
    led12.value = runner.portB.pinState(4) === PinState.High;
    led13.value = runner.portB.pinState(5) === PinState.High;

    const pin11State = runner.portB.pinState(3);
    if (lastState !== pin11State) {
      const delta = runner.cpu.cycles - lastStateCycles;
      if (lastState === PinState.High) {
        ledHighCycles += delta;
      }
      lastState = pin11State;
      lastStateCycles = runner.cpu.cycles;
    }
  });

  let serialBuffer = '';
  let serialFlushScheduled = false;

  runner.usart.onByteTransmit = (value) => {
    serialBuffer += String.fromCharCode(value);

    if (!serialFlushScheduled) {
      serialFlushScheduled = true;
      setTimeout(() => {
        serialOutputText.textContent += serialBuffer;
        serialOutputText.scrollTop = serialOutputText.scrollHeight;
        serialBuffer = '';
        serialFlushScheduled = false;
      }, 50);
    }
  };
  const cpuPerf = new CPUPerformance(runner.cpu, MHZ);
  runner.execute((cpu) => {
    const time = formatTime(cpu.cycles / MHZ);
    const speed = (cpuPerf.update() * 100).toFixed(0);
    statusLabel.textContent = `Simulation time: ${time} (${speed}%)`;
    const cyclesSinceUpdate = cpu.cycles - lastUpdateCycles;
    const pin11State = runner.portB.pinState(3);
    if (pin11State === PinState.High) {
      ledHighCycles += cpu.cycles - lastStateCycles;
    }
    led11.value = ledHighCycles > 0;
    led11.brightness = ledHighCycles / cyclesSinceUpdate;
    lastUpdateCycles = cpu.cycles;
    lastStateCycles = cpu.cycles;
    ledHighCycles = 0;
  });
}

function stopCode() {
  stopButton2.setAttribute('disabled', '1');
  runButton2.removeAttribute('disabled');
  revertButton.removeAttribute('disabled');
  if (runner) {
    runner.stop();
    runner = null;
  }
}

function storeUserSnippet() {
  EditorHistoryUtil.clearSnippet();
  EditorHistoryUtil.storeSnippet(editor.getValue());
}

function setBlinkSnippet() {
  editor.setValue(BLINK_CODE);
  EditorHistoryUtil.storeSnippet(editor.getValue());
}

function finish() {
  const endTime = Date.now();
  const startTime = parseInt(localStorage.getItem("sessionStartTime"), 10);
  const timeSpentMs = endTime - startTime;
  const timeSpentSeconds = Math.floor(timeSpentMs / 1000);

  localStorage.setItem("timeSpentOnPage", timeSpentSeconds);
  console.log(`Time spent on page: ${timeSpentSeconds} seconds`);

  localStorage.removeItem("sessionStartTime");

  window.location.href = "closing_questionnaire.html";
}

let globalMaybeFeedback;

let charsSinceLast = 0;
let linesSinceLast = 0;

function automaticFeedback() {
  console.log("Automatic feedback enabled");

  const INITIAL_DELAY = 7000;   
  const DEBOUNCE_DELAY = 6000;    
  const FALLBACK_PERIOD = 30000;  
  const MIN_INTERVAL = 11000;  
  const MAX_PER_MINUTE = 6;       

  let lastFeedbackTime = 0;
  const feedbackTimestamps = [];  

  function pruneOldStamps() {
    const now = Date.now();
    while (feedbackTimestamps.length && now - feedbackTimestamps[0] > 60000) {
      feedbackTimestamps.shift();
    }
  }

  function canSendFeedback() {
    pruneOldStamps();
    return feedbackTimestamps.length < MAX_PER_MINUTE;
  }

  function maybeFeedback({ overrideMin = false } = {}) {
    const now = Date.now();

    if (!canSendFeedback()) {
      console.log('Feedback skipped: max per minute reached');
      return;
    }

    if (!overrideMin && now - lastFeedbackTime < MIN_INTERVAL) {
      console.log('Feedback skipped: waiting for MIN_INTERVAL');
      return;
    }

    if (charsSinceLast < 100 && linesSinceLast < 2 && !overrideMin) {
      console.log('Feedback skipped: not enough changes');
      return;
    }

    getFeedback();
    lastFeedbackTime = now;
    feedbackTimestamps.push(now);
    charsSinceLast = 0;
    linesSinceLast = 0;
  }

  globalMaybeFeedback = maybeFeedback;

  function debounce(fn, wait) {
    let timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  setTimeout(() => maybeFeedback({ overrideMin: true }), INITIAL_DELAY);

  setInterval(() => {
    if (Date.now() - lastFeedbackTime >= FALLBACK_PERIOD) {
      maybeFeedback();
    }
  }, FALLBACK_PERIOD);

  const onChangeDebounced = debounce(() => maybeFeedback(), DEBOUNCE_DELAY);
  editor.onDidChangeModelContent((e) => {
    for (const change of e.changes) {
      charsSinceLast += change.text.length;
      linesSinceLast += (change.text.match(/\n/g) || []).length;
    }
    onChangeDebounced();
  });
}

const feedbackHistory = [];
let feedbackIndex = -1;

function renderFeedback() {
  feedbackBox.textContent = feedbackHistory[feedbackIndex] || "No feedback yet.";
}

function updateArrowButtons() {
  prevBtn.disabled = feedbackIndex <= 0;
  nextBtn.disabled = feedbackIndex >= feedbackHistory.length - 1;
}

const prevBtn = document.getElementById('prev-feedback');
const nextBtn = document.getElementById('next-feedback');

prevBtn.addEventListener('click', () => {
  if (feedbackIndex > 0) {
    feedbackIndex--;
    renderFeedback();
    updateArrowButtons();
  }
});

nextBtn.addEventListener('click', () => {
  if (feedbackIndex < feedbackHistory.length - 1) {
    feedbackIndex++;
    renderFeedback();
    updateArrowButtons();
  }
});

function incrementLocalStorageCounter(key) {
  const count = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, count + 1);
}