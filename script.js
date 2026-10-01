const STORAGE_KEY = 'journalEntries';
const titleInput = document.getElementById('entry-title');
const tagsInput = document.getElementById('entry-tags');
const contentInput = document.getElementById('entry-content');
const saveButton = document.getElementById('save-entry');
const clearButton = document.getElementById('clear-entry');
const searchInput = document.getElementById('search-input');
const entriesList = document.getElementById('entries-list');
const statusText = document.getElementById('status');
const exportButton = document.getElementById('export-json');
const moodModal = document.getElementById('mood-modal');
const moodButtons = document.querySelectorAll('[data-mood]');

let entries = [];
let editingId = null;
let selectedMood = null;

function loadEntries() {
  const saved = localStorage.getItem(STORAGE_KEY);
  entries = saved ? JSON.parse(saved) : [];
  renderEntries();
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  statusText.textContent = 'Saved in browser storage.';
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function getFilteredEntries() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    return [...entries].sort((a, b) => b.timestamp - a.timestamp);
  }

  return entries
    .filter(entry => {
      const combined = [
        entry.title,
        entry.content,
        entry.tags.join(' '),
        entry.mood || '',
        entry.moodReason || '',
      ].join(' ').toLowerCase();
      return combined.includes(query);
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

function renderEntries() {
  const filtered = getFilteredEntries();
  entriesList.innerHTML = '';

  if (filtered.length === 0) {
    entriesList.innerHTML = '<p class="empty-state">No entries yet. Start writing to save your first journal note.</p>';
    return;
  }

  filtered.forEach(entry => {
    const card = document.createElement('article');
    card.className = 'entry-card';

    const meta = document.createElement('div');
    meta.className = 'entry-meta';
    meta.innerHTML = `<strong>${entry.title || 'Untitled entry'}</strong><span>${formatDate(entry.timestamp)}</span>`;

    const tagRow = document.createElement('div');
    tagRow.className = 'entry-tags';

    if (entry.mood) {
      const moodTag = document.createElement('span');
      moodTag.className = 'mood-tag';
      moodTag.textContent = entry.mood;
      tagRow.appendChild(moodTag);
    }

    entry.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag;
      tagRow.appendChild(tagElement);
    });

    const body = document.createElement('div');
    body.className = 'entry-content';
    body.textContent = entry.content || 'No content.';

    const actions = document.createElement('div');
    actions.className = 'entry-actions';

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => populateEditor(entry.id));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteEntry(entry.id));

    actions.append(editButton, deleteButton);
    card.append(meta, tagRow, body);

    if (entry.moodReason) {
      const moodReasonEl = document.createElement('p');
      moodReasonEl.className = 'mood-reason';
      moodReasonEl.textContent = `Why: ${entry.moodReason}`;
      card.append(moodReasonEl);
    }

    card.append(actions);
    entriesList.appendChild(card);
  });
}

function clearEditor() {
  editingId = null;
  selectedMood = null;
  titleInput.value = '';
  tagsInput.value = '';
  contentInput.value = '';
  moodButtons.forEach(button => button.classList.remove('selected'));
  saveButton.textContent = 'Save Entry';
  showMoodModal();
}

function populateEditor(id) {
  const entry = entries.find(item => item.id === id);
  if (!entry) return;

  editingId = id;
  selectedMood = entry.mood || null;
  titleInput.value = entry.title;
  tagsInput.value = entry.tags.join(', ');
  contentInput.value = entry.content;
  saveButton.textContent = 'Update Entry';
  titleInput.focus();
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  entries = entries.filter(entry => entry.id !== id);
  saveEntries();
  renderEntries();
}

function saveCurrentEntry() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  if (!selectedMood && !editingId) {
    alert('Please choose how you are feeling before saving.');
    return;
  }

  if (!title && !content) {
    alert('Add a title or some text before saving.');
    return;
  }

  const timestamp = Date.now();
  const mood = selectedMood || (editingId ? entries.find(entry => entry.id === editingId)?.mood : null);

  if (editingId) {
    entries = entries.map(entry =>
      entry.id === editingId
        ? { ...entry, title, content, tags, mood, timestamp }
        : entry
    );
  } else {
    entries.push({
      id: crypto.randomUUID(),
      title,
      content,
      tags,
      mood,
      timestamp,
    });
  }

  saveEntries();
  renderEntries();
  clearEditor();
}

function showMoodModal() {
  moodModal.classList.add('active');
  moodModal.setAttribute('aria-hidden', 'false');
}

function hideMoodModal() {
  moodModal.classList.remove('active');
  moodModal.setAttribute('aria-hidden', 'true');
}

function handleMoodSelect(event) {
  selectedMood = event.currentTarget.dataset.mood;
  moodButtons.forEach(button => button.classList.toggle('selected', button.dataset.mood === selectedMood));
  hideMoodModal();
  contentInput.focus();
}

moodButtons.forEach(button => button.addEventListener('click', handleMoodSelect));

function exportEntries() {
  const data = JSON.stringify(entries, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'journal-entries.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

saveButton.addEventListener('click', saveCurrentEntry);
clearButton.addEventListener('click', clearEditor);
searchInput.addEventListener('input', renderEntries);
exportButton.addEventListener('click', exportEntries);

loadEntries();
showMoodModal();
