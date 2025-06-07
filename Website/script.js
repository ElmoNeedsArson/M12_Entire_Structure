let studentId = localStorage.getItem("studentId");
        if (!studentId) {
            studentId = crypto.randomUUID();
            localStorage.setItem("studentId", studentId);
        }

async function getFeedback() {
  const code = document.getElementById('codeInput').value;
  const persona = document.getElementById('persona').value;
  const resultBox = document.getElementById('feedbackResult');

  resultBox.textContent = "Loading...";

  try {
    const response = await fetch('', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId: studentId, studentCode: code })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    resultBox.textContent = data.feedback || "No feedback received.";
  } catch (err) {
    resultBox.textContent = `Error: ${err.message}`;
  }
}