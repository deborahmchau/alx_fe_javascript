// ===== Storage keys =====
const STORAGE_KEY = 'quotes';
const SESSION_KEY = 'lastViewedQuoteIndex';

// ===== Load/save helpers =====
function loadQuotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

// ===== Data =====
let quotes = loadQuotes();
if (quotes.length === 0) {
  quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
    { text: "Do not let what you cannot do interfere with what you can do.", category: "Inspiration" }
  ];
  saveQuotes();
}

// ===== Rendering =====
function renderQuote(quote) {
  document.getElementById("quoteDisplay").innerHTML = `
    <p>"${quote.text}"</p>
    <small>- ${quote.category}</small>
  `;
}

// ===== Core actions =====
function showRandomQuote() {
  if (quotes.length === 0) return;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  sessionStorage.setItem(SESSION_KEY, String(randomIndex));
  renderQuote(quotes[randomIndex]);
}

function showLastViewedQuoteIfAny() {
  const idx = parseInt(sessionStorage.getItem(SESSION_KEY), 10);
  if (!Number.isNaN(idx) && quotes[idx]) {
    renderQuote(quotes[idx]);
    return true;
  }
  return false;
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();

    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    alert("Quote added successfully!");
  } else {
    alert("Please enter both a quote and a category.");
  }
}

// ===== Dynamic form (if you need to generate it) =====
function createAddQuoteForm() {
  // const host = document.getElementById('formHost'); // Example
  // Otherwise, append to body:
  const formDiv = document.createElement("div");

  const inputText = document.createElement("input");
  inputText.id = "newQuoteText";
  inputText.type = "text";
  inputText.placeholder = "Enter a new quote";

  const inputCategory = document.createElement("input");
  inputCategory.id = "newQuoteCategory";
  inputCategory.type = "text";
  inputCategory.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formDiv.appendChild(inputText);
  formDiv.appendChild(inputCategory);
  formDiv.appendChild(addButton);

  document.body.appendChild(formDiv);
}

// ===== Import / Export =====
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('JSON must be an array');

      const seen = new Set(quotes.map(q => `${q.text}|||${q.category}`));
      let added = 0;

      imported.forEach(item => {
        if (item && typeof item.text === 'string' && typeof item.category === 'string') {
          const key = `${item.text.trim()}|||${item.category.trim()}`;
          if (!seen.has(key)) {
            quotes.push({ text: item.text.trim(), category: item.category.trim() });
            seen.add(key);
            added++;
          }
        }
      });

      saveQuotes();
      alert(`Quotes imported successfully! Added: ${added}`);
      showRandomQuote();
    } catch {
      alert('Invalid JSON file. Please provide an array of { text, category } objects.');
    } finally {
      event.target.value = '';
    }
  };
  fileReader.readAsText(file);
}

// ===== Wire up =====
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// If you added these controls in HTML:
const exportBtn = document.getElementById('exportJson');
if (exportBtn) exportBtn.addEventListener('click', exportToJson);

const importInput = document.getElementById('importFile');
if (importInput) importInput.addEventListener('change', importFromJsonFile);

// Initial render
if (!showLastViewedQuoteIfAny()) {
  showRandomQuote();
}
