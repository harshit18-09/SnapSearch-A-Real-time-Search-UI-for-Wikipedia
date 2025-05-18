const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');

const loader = document.createElement('div');
loader.className = 'loader';
document.querySelector('.container').appendChild(loader);

let searchHistory = [];

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

async function fetchResults(query) {
  if (!query.trim()) {
    resultsDiv.innerHTML = '';
    loader.style.display = 'none';
    return;
  }

  loader.style.display = 'block';
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srsearch=${query}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.style.display = 'none';
    displayResults(data.query.search, query);
    updateSearchHistory(query);
  } catch (error) {
    resultsDiv.innerHTML = '<p>Error fetching data...</p>';
    loader.style.display = 'none';
  }
}

function displayResults(results, query) {
  resultsDiv.innerHTML = '';
  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>No results found. Try a different keyword.</p>';
    return;
  }
  results.slice(0, 5).forEach(item => {
    const title = highlightMatch(item.title, query);
    const snippet = highlightMatch(item.snippet, query);
    const url = `https://en.wikipedia.org/?curid=${item.pageid}`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${title}</h3>
      <p>${snippet}...</p>
      <a href="${url}" target="_blank">Read More</a>
      <br />
      <button onclick="copyToClipboard('${url}')">Copy Link</button>
    `;
    resultsDiv.appendChild(card);
  });
}

function highlightMatch(text, term) {
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function updateSearchHistory(query) {
  if (!searchHistory.includes(query)) {
    searchHistory.unshift(query);
    if (searchHistory.length > 5) searchHistory.pop();
    renderSearchHistory();
  }
}

function renderSearchHistory() {
  let historyBox = document.getElementById('historyBox');
  if (!historyBox) {
    historyBox = document.createElement('div');
    historyBox.id = 'historyBox';
    historyBox.innerHTML = '<h4>Recent Searches</h4><ul id="historyList"></ul><button id="clearHistoryBtn">Clear History</button>';
    document.querySelector('.container').appendChild(historyBox);
    document.getElementById('clearHistoryBtn').onclick = clearHistory;
  }

  const list = historyBox.querySelector('#historyList');
  list.innerHTML = '';
  searchHistory.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.style.cursor = 'pointer';
    li.onclick = () => {
      searchInput.value = item;
      fetchResults(item);
    };
    list.appendChild(li);
  });
}

function clearHistory() {
  searchHistory = [];
  const historyList = document.getElementById('historyList');
  if (historyList) historyList.innerHTML = '';
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => alert('Link copied!'));
}

const themeToggleBtn = document.createElement('button');
themeToggleBtn.textContent = '🌙 Toggle Dark Mode';
themeToggleBtn.className = 'theme-toggle';
themeToggleBtn.onclick = toggleDarkMode;
document.querySelector('.container').prepend(themeToggleBtn);

searchInput.addEventListener('input', debounce(() => {
  fetchResults(searchInput.value);
}, 300));

const voiceBtn = document.getElementById('voiceBtn');
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  voiceBtn.onclick = () => {
    recognition.start();
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    searchInput.value = transcript;
    fetchResults(transcript);
  };

  recognition.onerror = (e) => {
    alert('Voice recognition failed: ' + e.error);
  };
} else {
  voiceBtn.disabled = true;
  voiceBtn.textContent = 'Voice not supported';
}
