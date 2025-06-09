This is the code repository for a research project executed at the TU/E.

It provides a website with an arduino editor, compiler and some LEDs "hooked up". Alongside an avatar providing feedback. 
It also provides two apis to store the data, and request feedback from the openAI api according to predesigned rules.

It does not contain the needed api keys or requested domains, these have been stripped.

The whole setup was hosted on a vps in different docker containers, and used subdomains of my main domain jessestrijker.com.

# Arduino Programming Feedback Research Platform

This repository contains the codebase for a research project at TU Eindhoven (TU/e) focused on studying perceived programming difficulty and the role of feedback in learning environments. The platform provides an interactive Arduino coding website with real-time feedback from AI-driven avatars, as well as APIs for feedback generation and data collection.

---

## Features

- **Web-based Arduino Editor:** Simulate Arduino code, run and test sketches, and interact with virtual LEDs.
- **AI Feedback Avatars:** Receive tailored feedback from one of four AI personas, each with distinct feedback styles and valence.
- **Surveys & Data Collection:** Integrated pre- and post-exercise questionnaires to assess self-efficacy and collect research data.
- **Backend APIs:** Middleware and backend APIs for secure data storage and OpenAI-powered feedback generation.
- **Session Tracking:** Tracks user actions, time spent, and survey responses for research analysis.

---

## Project Structure

```
Backend Api/
  package.json
  server.js
Middle Api/
  package.json
  server.js
  submissions/
Website/
  index.html
  index_arduino.html
  mainV63.js
  script.js
  storeV10.js
  questionnaireV20.js
  closing_questionnaire.html
  closing_questionnaireV6.js
  no_consent.html
  thank_you.html
  css/
  functions/
  images/
  surveys/
README.md
```

### Key Components

- **Website/**
  - `index.html`: Landing page with the initial consent and demographic survey.
  - `index_arduino.html`: Main coding exercise interface with the Arduino editor and feedback avatar.
  - `mainV63.js`: Handles editor logic, feedback requests, LED simulation, and session management.
  - `questionnaireV20.js`, `closing_questionnaireV6.js`: Scripts for pre- and post-exercise surveys.
  - `storeV10.js`: Collects and submits user session and survey data.
  - `functions/`: Utility modules for code compilation, execution, and simulation.
  - `css/`: Stylesheets for the editor and landing pages.
  - `surveys/`: JSON survey definitions.

- **Backend Api/**
  - `server.js`: Express server for generating feedback using OpenAI, with rate limiting and security.
  - `package.json`: Backend dependencies.

- **Middle Api/**
  - `server.js`: Middleware API for storing survey results and relaying feedback requests.
  - `submissions/`: Directory for storing local survey submissions.
  - `package.json`: Middleware dependencies.

---

## Installation

### Prerequisites

- Node.js (v16+ recommended)
- npm

### Setup

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies for each API:**
   ```sh
   cd "Backend Api"
   npm install
   cd ../"Middle Api"
   npm install
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env` in both `Backend Api/` and `Middle Api/`.
   - Add your OpenAI API key and any required tokens/domains.

---

## Usage

### 1. Start the APIs

- **Backend API (OpenAI feedback):**
  ```sh
  cd "Backend Api"
  node server.js
  ```

- **Middle API (Data storage and relay):**
  ```sh
  cd "../Middle Api"
  node server.js
  ```

### 2. Serve the Website

You can use any static file server to serve the `Website/` directory, for example:

```sh
cd ../Website
npx serve .
```

Or use your preferred web server.

### 3. Access the Platform

- Open your browser and navigate to the served website (e.g., `http://localhost:5000`).
- Follow the instructions to complete the consent form, surveys, and coding exercise.

---

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- Research conducted at TU Eindhoven (TU/e).
- Uses [OpenAI](https://openai.com/) for feedback generation.
- Arduino simulation powered by [avr8js](https://github.com/wokwi/avr8js) and [Wokwi Elements](https://docs.wokwi.com/parts/wokwi-led).

---

**Note:** API keys, tokens, and sensitive endpoints are not included in this repository for security reasons.
