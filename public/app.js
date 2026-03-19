function showHero() {
  const heroForm = document.getElementById("heroForm");
  const tonightForm = document.getElementById("tonightForm");
  const tabHero = document.getElementById("tabHero");
  const tabTonight = document.getElementById("tabTonight");

  heroForm.classList.remove("hidden");
  tonightForm.classList.add("hidden");
  tabHero.classList.add("active");
  tabTonight.classList.remove("active");
}

function showTonight() {
  const heroForm = document.getElementById("heroForm");
  const tonightForm = document.getElementById("tonightForm");
  const tabHero = document.getElementById("tabHero");
  const tabTonight = document.getElementById("tabTonight");

  tonightForm.classList.remove("hidden");
  heroForm.classList.add("hidden");
  tabTonight.classList.add("active");
  tabHero.classList.remove("active");
}

async function handleGenerate(mode) {
  const loadingMessage = document.getElementById("loadingMessage");
  const storyOutput = document.getElementById("storyOutput");
  const buttonId = mode === "hero" ? "generateHeroBtn" : "generateTonightBtn";
  const button = document.getElementById(buttonId);

  const payload =
    mode === "hero"
      ? {
          name: (document.getElementById("heroName").value || "").trim(),
          age: (document.getElementById("heroAge").value || "").trim(),
          idea: (document.getElementById("heroIdea").value || "").trim(),
          length: document.getElementById("heroLength").value
        }
      : {
          name: "Your Child",
          age: "5",
          idea: "a peaceful magical bedtime adventure",
          length: "short"
        };

  if (mode === "hero" && (!payload.name || !payload.age || !payload.idea)) {
    alert("Please fill in name, age, and idea.");
    return;
  }

  loadingMessage.classList.remove("hidden");
  storyOutput.innerText = "";
  button.disabled = true;

  const originalText = button.innerText;
  button.innerText = "Creating...";

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    storyOutput.innerText = data.story || "No story was returned.";
    storyOutput.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error(error);
    storyOutput.innerText = "Something went wrong, please try again.";
  } finally {
    loadingMessage.classList.add("hidden");
    button.disabled = false;
    button.innerText = originalText;
  }
}
