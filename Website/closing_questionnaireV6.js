document.addEventListener("DOMContentLoaded", function () {
    fetch("surveys/closing_surveyV4.json")
        .then(response => response.json())
        .then(surveyJson => {
            const requiredToggle = true; 

            surveyJson.pages.forEach(page => {
                page.elements.forEach(q => {
                    q.isRequired = requiredToggle;
                });
            });

            const survey = new Survey.Model(surveyJson);

            survey.onAfterRenderQuestion.add(function (_, options) {
                console.log("Questions rendered")
                const titleEl = options.htmlElement.querySelector(".sd-question__title .sv-string-viewer");
                if (titleEl) {
                    console.log("Title element found");
                    titleEl.innerHTML = titleEl.innerHTML.replace(/\[u\](.*?)\[\/u\]/g, '<span class="underline">$1</span>');
                }
            });

            const savedState = localStorage.getItem("surveyState");
            if (savedState) {
                try {
                    survey.data = JSON.parse(savedState);
                } catch (e) {
                    console.warn("Could not parse saved survey state:", e);
                }
            }

            survey.onValueChanged.add(function (sender, options) {
                localStorage.setItem("surveyState", JSON.stringify(sender.data));
            });

            survey.onComplete.add(function (sender) {
                localStorage.removeItem("surveyState");

                const results = sender.data;
                localStorage.setItem("finalSurveyResults_closing", JSON.stringify(results));

                console.log("Survey results:", sender.data);
                //window.location.href = "coding_exercise.html";
                window.location.href = "thank_you.html";
            });

            survey.render(document.getElementById("surveyContainer"));
        })
        .catch(error => console.error("Error loading survey JSON:", error));
});