// Select the HTML elements
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Update the character and word counters
function updateCounts() {
    const text = noteText.value;

    // Count characters
    const characters = text.length;

    // Count words
    const words = text.trim() === ""
        ? 0
        : text.trim().split(/\s+/).length;

    // Display character count
    charCount.textContent = `${characters} / 200 characters`;

    // Display word count
    wordCount.textContent = `${words} words`;

    // Remove old warning classes
    charCount.classList.remove("warning");
    charCount.classList.remove("over");

    // Warning when over 180 characters
    if (characters > 180 && characters <= 200) {
        charCount.classList.add("warning");
    }

    // Over limit when above 200 characters
    if (characters > 200) {
        charCount.classList.add("over");
    }
}

// Listen for typing
noteText.addEventListener("input", function () {
    updateCounts();

    // Save the draft
    localStorage.setItem("quickNotesDraft", noteText.value);
});

// Function to clear the note
function clearNote() {
    noteText.value = "";

    updateCounts();

    localStorage.removeItem("quickNotesDraft");
}

// Clear button
clearBtn.addEventListener("click", clearNote);

// Press Escape to clear the note
noteText.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        clearNote();
    }
});

// Toggle dark/light theme
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeToggle.textContent = "Light mode";
        localStorage.setItem("quickNotesTheme", "dark");
    } else {
        themeToggle.textContent = "Dark mode";
        localStorage.setItem("quickNotesTheme", "light");
    }
});

// Restore saved draft when the page loads
const savedDraft = localStorage.getItem("quickNotesDraft");

if (savedDraft !== null) {
    noteText.value = savedDraft;
}

// Restore saved theme
const savedTheme = localStorage.getItem("quickNotesTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
} else {
    themeToggle.textContent = "Dark mode";
}

// Update counters when the page loads
updateCounts();