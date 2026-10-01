// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes
function searchNotes(word) {
  return notes.filter(n =>
    n.text.toLowerCase().includes(word.toLowerCase())
  );
}
// Tests
console.log(searchNotes("milk")); // → [{ id:1, text:"Buy milk and bread", category:"personal" }]
console.log(searchNotes("xyz"));  // → []

// 2. longestNote
function longestNote() {
  if (notes.length === 0) return null;
  return notes.reduce((longest, current) =>
    current.text.length > longest.text.length ? current : longest
  );
}
// Tests
console.log(longestNote()); // → { id:3, text:"Email the project report to Grace", category:"work" }
notes = []; console.log(longestNote()); // → null
// Reset notes
notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 3. countByCategory
function countByCategory() {
  let counts = {};
  for (let n of notes) {
    counts[n.category] = (counts[n.category] || 0) + 1;
  }
  return counts;
}
// Tests
console.log(countByCategory()); // → { personal:2, study:2, work:1 }

// 4. getSummary
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  let parts = [];
  for (let cat in counts) {
    parts.push(`${counts[cat]} ${cat}`);
  }
  return `${total} ${total === 1 ? "note" : "notes"}: ${parts.join(", ")}`;
}
// Tests
console.log(getSummary()); // → "5 notes: 2 personal, 1 work, 2 study"

// 5. isDuplicate
function isDuplicate(text) {
  const normalized = text.trim().toLowerCase();
  return notes.some(n => n.text.trim().toLowerCase() === normalized);
}
// Tests
console.log(isDuplicate("  buy milk and bread ")); // → true
console.log(isDuplicate("New note")); // → false

// 6. addNote
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  const trimmed = text.trim();

  if (trimmed.length < 1 || trimmed.length > 200) {
    console.log("Invalid length");
    return false;
  }
  if (!validCategories.includes(category)) {
    console.log("Invalid category");
    return false;
  }
  if (isDuplicate(trimmed)) {
    console.log("Duplicate note");
    return false;
  }

  const newId = notes.length ? notes[notes.length - 1].id + 1 : 1;
  notes.push({ id: newId, text: trimmed, category });
  return true;
}
// Tests
console.log(addNote("Read a book", "personal")); // → true
console.log(addNote("Read a book", "personal")); // → false (duplicate)
console.log(addNote("", "study"));               // → false (invalid length)
console.log(addNote("Another note", "other"));   // → false (invalid category)
