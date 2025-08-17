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

function uid() {
  return 'q_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function nowISO() {
  return new Date().toISOString();
}

// Ensure all quotes have {id, updatedAt}
function migrateQuoteSchema(quotesArr) {
  let changed = false;
  quotesArr.forEach(q => {
    if (!q.id) { q.id = uid(); changed = true; }
    if (!q.updatedAt) { q.updatedAt = nowISO(); changed = true; }
  });
  if (changed) saveQuotes();
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

migrateQuoteSchema(quotes);

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
    quotes.push({ id: uid(), text, category, updatedAt: nowISO() });
    saveQuotes();
    // If you have populateCategories()/filterQuotes(), keep calling them as before
    if (typeof populateCategories === 'function') populateCategories();
    alert("Quote added successfully!");
    // Optionally: showRandomQuote() or filterQuotes()
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

function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  
  categoryFilter.innerHTML = ""; // reset dropdown
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // restore last selected filter from localStorage
  const savedCategory = localStorage.getItem("selectedCategory") || "all";
  categoryFilter.value = savedCategory;
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);

  let filteredQuotes = quotes;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  // Show a random filtered quote
  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    document.getElementById("quoteDisplay").textContent = 
      `"${filteredQuotes[randomIndex].text}" — ${filteredQuotes[randomIndex].category}`;
  } else {
    document.getElementById("quoteDisplay").textContent = "No quotes available in this category.";
  }
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value;
  const category = document.getElementById("newQuoteCategory").value;

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories(); // 🔥 update dropdown dynamically
    alert("Quote added!");
  }
}

window.onload = function() {
  loadQuotes();
  populateCategories();
  filterQuotes();
};

// ---- Add to script.js ----
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';
let syncing = false;

// Map JSONPlaceholder -> Quote model
function mapPostToQuote(p) {
  return {
    id: 'srv_' + String(p.id),                // namespace server ids
    text: (p.body || '').trim(),
    category: (p.title || 'General').trim(),
    updatedAt: nowISO() // synthesize since API has no timestamps
  };
}

async function fetchServerQuotes(limit = 10) {
  const res = await fetch(`${SERVER_URL}?_limit=${limit}`);
  if (!res.ok) throw new Error('Server fetch failed');
  const posts = await res.json();
  return posts
    .map(mapPostToQuote)
    // guard against empty text
    .filter(q => q.text.length > 0);
}

// (Optional) simulate pushing local quotes to server (JSONPlaceholder will just echo)
async function pushLocalQuotesToServer(localSubset = []) {
  // This is just a demo; JSONPlaceholder won't persist.
  const results = [];
  for (const q of localSubset) {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title: q.category, body: q.text, userId: 1 })
    });
    if (res.ok) results.push(await res.json());
  }
  return results;
}

function mergeServerIntoLocal(serverQuotes) {
  const byKey = new Map(); // key -> local index
  quotes.forEach((q, i) => byKey.set(`${q.text.trim()}|||${q.category.trim()}`, i));

  let added = 0, replaced = 0, conflicts = 0;
  for (const sq of serverQuotes) {
    const key = `${sq.text.trim()}|||${sq.category.trim()}`;
    if (byKey.has(key)) {
      // conflict: server wins
      const i = byKey.get(key);
      const local = quotes[i];
      if (local.text !== sq.text || local.category !== sq.category) conflicts++;
      quotes[i] = sq; // replace
      replaced++;
    } else {
      quotes.push(sq);
      byKey.set(key, quotes.length - 1);
      added++;
    }
  }
  saveQuotes();
  return { added, replaced, conflicts };
}

async function syncWithServer() {
  if (syncing) return;
  syncing = true;
  setSyncStatus('Syncing…');

  try {
    const serverQuotes = await fetchServerQuotes(8);
    const { added, replaced, conflicts } = mergeServerIntoLocal(serverQuotes);
    setSyncStatus(`Synced. Added: ${added}, Updated: ${replaced}, Conflicts: ${conflicts}`);
    // If you have filters, refresh current view:
    if (typeof populateCategories === 'function') populateCategories();
    if (typeof filterQuotes === 'function') filterQuotes();
    else if (typeof showRandomQuote === 'function') showRandomQuote();
  } catch (e) {
    setSyncStatus('Sync failed (offline or CORS).');
    // Keep app usable offline; nothing else to do
  } finally {
    syncing = false;
  }
}

function setSyncStatus(msg) {
  const el = document.getElementById('syncStatus');
  if (el) el.textContent = msg;
  // You could also add a brief highlight effect here if you like
}

// After DOM ready / after other listeners
const syncBtn = document.getElementById('syncNow');
if (syncBtn) syncBtn.addEventListener('click', syncWithServer);

// Auto-sync every 60s (adjust as needed)
setInterval(syncWithServer, 60000);

// Kick off an initial sync shortly after load (so the UI is ready)
setTimeout(syncWithServer, 1500);

function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', right: '12px', bottom: '12px',
    padding: '10px 14px', background: '#333', color: '#fff',
    borderRadius: '6px', zIndex: 9999, opacity: '0.95'
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// Example: call inside syncWithServer() after merge:
toast(`Synced ✓ Added: ${added}, Updated: ${replaced}, Conflicts: ${conflicts}`);

