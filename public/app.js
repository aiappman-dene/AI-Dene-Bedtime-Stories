// 🔐 PASSWORD PROTECTION
const APP_PASSWORD = "Jj987157b";

function checkPassword() {
  const entered = prompt("Enter password to access the app:");

  if (entered !== APP_PASSWORD) {
    document.body.innerHTML =
      "<h2 style='text-align:center;margin-top:50px;'>Access Denied</h2>";
  }
}

checkPassword();

// --- GLOBAL ---
let currentStory = "";

// --- UI MODE SWITCH ---
function showTonight() {
  document.getElementById("heroForm").classList.add("hidden");
  document.getElementById("tonightForm").classList.remove("hidden");
}

function showHero() {
  document.getElementById("heroForm").classList.remove("hidden");
  document.getElementById("tonightForm").classList.add("hidden");
}

// --- QUICK IDEAS ---
function setIdea(text) {
  document.getElementById("idea").value = text;
}

// --- GENERATE HERO STORY ---
async function generateStory() {
  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;
  const idea = document.getElementById("idea").value;
  const length = document.getElementById("length").value;

  const loading = document.getElementById("loading");
  const storyBox = document.getElementById("story");
  const controls = document.getElementById("controls");

  loading.classList.remove("hidden");
  storyBox.innerHTML = "";
  controls.classList.add("hidden");

  const prompt = `Write a ${length} bedtime story for a child named ${name} (age ${age}). The story is about ${idea}. Make it calming, magical, and age appropriate.`;

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    currentStory = data.story;

    storyBox.innerHTML = `<p>${data.story}</p>`;
    controls.classList.remove("hidden");
  } catch (err) {
    storyBox.innerText = "Error generating story.";
  }

  loading.classList.add("hidden");
}

// --- TONIGHT STORY ---
async function generateTonight() {
  const loading = document.getElementById("loading");
  const storyBox = document.getElementById("story");

  loading.classList.remove("hidden");
  storyBox.innerHTML = "";

  const prompt =
    "Write a calming, magical bedtime story for a young child.";

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    currentStory = data.story;

    storyBox.innerHTML = `<p>${data.story}</p>`;
    document.getElementById("controls").classList.remove("hidden");
  } catch (err) {
    storyBox.innerText = "Error generating story.";
  }

  loading.classList.add("hidden");
}

// --- READ STORY ---
function readStory() {
  if (!currentStory) return;

  const speech = new SpeechSynthesisUtterance(currentStory);
  speech.rate = 0.9;
  speech.pitch = 1;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

// --- SAVE STORY ---
function saveStory() {
  let stories = JSON.parse(localStorage.getItem("savedStories") || "[]");

  stories.push(currentStory);

  localStorage.setItem("savedStories", JSON.stringify(stories));

  alert("Story saved ⭐");
}
