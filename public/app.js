// Updated from root app.js
function saveBedtime(){
	const time=document.getElementById("bedtimeTime").value;
	if(!time){
		alert("Please choose a bedtime");
		return;
	}
	localStorage.setItem("bedtimeReminder",time);
	alert("Bedtime reminder saved for "+time);
}
function setDedication(text){
	document.getElementById("dedication").value = text;
}
function updateGuide(){
	const name = document.getElementById("heroName").value || "your child";
	document.getElementById("storyGuideText").innerText =
		`You decide the adventure for ${name}. Choose an idea below or write your own.`;
}
function showHero(){
	document.getElementById("heroForm").classList.remove("hidden");
	document.getElementById("tonightForm").classList.add("hidden");
}

function showTonight(){
	document.getElementById("heroForm").classList.add("hidden");
	document.getElementById("tonightForm").classList.remove("hidden");
}

function setIdea(text){
	document.getElementById("heroIdea").value = text;
}

let currentStory = "";

async function generateStory(){
	const name=document.getElementById("heroName").value;
	const age=document.getElementById("heroAge").value;
	const idea=document.getElementById("heroIdea").value;
	const length=document.getElementById("heroLength").value;

	const loading=document.getElementById("loading");
	const storyBox=document.getElementById("story");
	const controls=document.getElementById("controls");

	loading.classList.remove("hidden");
	storyBox.innerHTML="";
	controls.classList.add("hidden");

	try{
		const response=await fetch("/story",{
			method:"POST",
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify({name,age,idea,length})
		});
		const data=await response.json();

		currentStory = data.story;

		const dedication = document.getElementById("dedication").value || "With love 64f";
		storyBox.innerHTML = `
			<p class="dedication">This story is for ${name}, ${dedication}</p>
			<img src="${data.image}" style="width:100%;border-radius:10px;margin-bottom:20px;">
			<p>${data.story}</p>
		`;

		controls.classList.remove("hidden");
	}catch(error){
		storyBox.innerText="Something went wrong generating the story.";
	}

	loading.classList.add("hidden");
}

async function generateTonight(){
	// Try to use heroName/heroAge if visible, else fallback
	let name = "your child";
	let age = "5";
	if (!document.getElementById("heroForm").classList.contains("hidden")) {
		name = document.getElementById("heroName").value || name;
		age = document.getElementById("heroAge").value || age;
	}

	const idea = "a peaceful magical bedtime adventure";
	const length = "medium";

	const loading=document.getElementById("loading");
	const storyBox=document.getElementById("story");

	loading.classList.remove("hidden");
	storyBox.innerHTML="";

	try{
		const response = await fetch("/story",{
			method:"POST",
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify({
				name,
				age,
				idea,
				length
			})
		});

		const data = await response.json();

		storyBox.innerHTML = `
			<img src="${data.image}" style="width:100%;border-radius:10px;margin-bottom:20px;">
			<p>${data.story}</p>
		`;

	}catch(error){
		storyBox.innerText="Could not generate tonight's story.";
	}

	loading.classList.add("hidden");
}

// READ STORY OUT LOUD
function readStory(){
	const speech = new SpeechSynthesisUtterance(currentStory);
	speech.rate = 0.9;
	speech.pitch = 1;
	speech.volume = 1;
	window.speechSynthesis.speak(speech);
}

// SAVE STORY
function saveStory(){
	let stories = JSON.parse(localStorage.getItem("savedStories") || "[]");
	stories.push(currentStory);
	localStorage.setItem("savedStories", JSON.stringify(stories));
	alert("Story saved 650");
}
// --- UI Mode Switching ---
function showTonight() {
	document.getElementById('tonightForm').classList.remove('hidden');
	document.getElementById('heroForm').classList.add('hidden');
	document.getElementById('storyGuideText').innerText = "Generate a calming bedtime story instantly.";
	document.getElementById('tabTonight').classList.add('active');
	document.getElementById('tabTonight').setAttribute('aria-selected', 'true');
	document.getElementById('tabHero').classList.remove('active');
	document.getElementById('tabHero').setAttribute('aria-selected', 'false');
}

function showHero() {
	document.getElementById('heroForm').classList.remove('hidden');
	document.getElementById('tonightForm').classList.add('hidden');
	document.getElementById('storyGuideText').innerText = "You decide the adventure for your child. Choose an idea below or write your own.";
	document.getElementById('tabHero').classList.add('active');
	document.getElementById('tabHero').setAttribute('aria-selected', 'true');
	document.getElementById('tabTonight').classList.remove('active');
	document.getElementById('tabTonight').setAttribute('aria-selected', 'false');
}

// --- Quick Prompt Buttons ---
function setIdea(idea) {
	document.getElementById('heroIdea').value = idea;
}

function setDedication(dedication) {
	document.getElementById('dedication').value = dedication;
}

function updateGuide() {
	const name = document.getElementById('heroName').value;
	if (name) {
		document.getElementById('storyGuideText').innerText = `Story for ${name}. Choose an idea or write your own!`;
	} else {
		document.getElementById('storyGuideText').innerText = "You decide the adventure for your child. Choose an idea below or write your own.";
	}
}

// --- Story Generation ---
async function generateStory() {
	const name = document.getElementById('heroName').value.trim();
	const age = document.getElementById('heroAge').value.trim();
	const idea = document.getElementById('heroIdea').value.trim();
	const length = document.getElementById('heroLength').value;
	const dedication = document.getElementById('dedication').value.trim();

	if (!name || !age || !idea) {
		alert('Please fill in name, age, and idea.');
		return;
	}

	showLoading(true);

	const prompt = `Write a ${length} bedtime story for a child named ${name} (age ${age}). The story idea is: ${idea}. Dedicate the story: ${dedication}. Make it calming, magical, and age-appropriate.`;

	try {
		const res = await fetch('/story', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt })
		});
		const data = await res.json();
		showStory(data.story);
	} catch (err) {
		showStory('Sorry, there was an error generating your story.');
	} finally {
		showLoading(false);
	}
}

async function generateTonight() {
	showLoading(true);
	const prompt = "Write a short, calming bedtime story for a young child. Make it magical and gentle.";
	try {
		const res = await fetch('/story', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt })
		});
		const data = await res.json();
		showStory(data.story);
	} catch (err) {
		showStory('Sorry, there was an error generating your story.');
	} finally {
		showLoading(false);
	}
}

function showLoading(show) {
	document.getElementById('loading').classList.toggle('hidden', !show);
	document.getElementById('story').classList.toggle('hidden', show);
	document.getElementById('controls').classList.toggle('hidden', show);
}

function showStory(story) {
	document.getElementById('story').innerText = story;
	document.getElementById('story').classList.remove('hidden');
	document.getElementById('controls').classList.remove('hidden');
}

// --- Story Controls ---
function readStory() {
	const story = document.getElementById('story').innerText;
	if (!story) return;
	const utterance = new SpeechSynthesisUtterance(story);
	utterance.rate = 0.95;
	utterance.pitch = 1.1;
	window.speechSynthesis.speak(utterance);
}

function saveStory() {
	const story = document.getElementById('story').innerText;
	if (!story) return;
	const saved = JSON.parse(localStorage.getItem('savedStories') || '[]');
	saved.push({ story, date: new Date().toISOString() });
	localStorage.setItem('savedStories', JSON.stringify(saved));
	alert('Story saved!');
}

// --- Bedtime Reminder ---
function saveBedtime() {
	const time = document.getElementById('bedtimeTime').value;
	if (!time) {
		alert('Please select a time.');
		return;
	}
	localStorage.setItem('bedtimeTime', time);
	alert('Bedtime reminder saved!');
}

window.onload = function() {
	const bedtime = localStorage.getItem('bedtimeTime');
	if (bedtime) {
		document.getElementById('bedtimeTime').value = bedtime;
	}
};
