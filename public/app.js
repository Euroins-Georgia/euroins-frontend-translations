
let translationData = [];
let headers = [];
let hasUnsavedChanges = false;
let showUntranslatedOnly = false;

document.addEventListener('DOMContentLoaded', loadTranslations);

window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  }
});

async function loadTranslations() {
  try {
    const response = await fetch('/api/translations');
    const data = await response.json();
    
    if (response.ok) {
      headers = data.headers;
      translationData = data.data;
      renderTable();
      updateStats();
    } else {
      showMessage('Error loading translations: ' + data.error, 'error');
    }
  } catch (error) {
    showMessage('Error loading translations: ' + error.message, 'error');
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
}

function renderTable() {
  const table = document.getElementById('translationTable');
  const headerRow = document.getElementById('tableHeader');
  const tbody = document.getElementById('tableBody');

  headerRow.innerHTML = '';
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });

  tbody.innerHTML = '';
  let filteredData = translationData;
  if (showUntranslatedOnly) {
    const langHeaders = headers.filter(h => ['en', 'ka'].includes(h.toLowerCase()));
    filteredData = translationData.filter(row => {
      return langHeaders.some(lang => !row[lang] || row[lang].trim() === '');
    });
  }
  filteredData.forEach((row) => {
    const tr = document.createElement('tr');
    const realIndex = translationData.indexOf(row);
    headers.forEach(header => {
      const td = document.createElement('td');
      if (header === 'Key' || header === 'Context') {
        td.className = header.toLowerCase() + '-cell';
        td.textContent = row[header] || '';
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = row[header] || '';
        textarea.addEventListener('input', (e) => updateCell(realIndex, header, e.target.value));
        td.appendChild(textarea);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.style.display = 'table';
}

function toggleFilterUntranslated() {
  showUntranslatedOnly = !showUntranslatedOnly;
  const btn = document.getElementById('filterBtn');
  btn.textContent = showUntranslatedOnly ? 'All' : 'Untranslated';
  renderTable();
}

function updateCell(rowIndex, header, value) {
  translationData[rowIndex][header] = value;
  markUnsaved();
}

function markUnsaved() {
  hasUnsavedChanges = true;
  document.getElementById('saveBtn').textContent = 'Save Changes *';
}

function updateStats() {
  document.getElementById('rowCount').textContent = `Rows: ${translationData.length}`;
}

async function saveTranslations() {
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const response = await fetch('/api/translations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: translationData,
        headers: headers
      })
    });

    const result = await response.json();

    if (response.ok) {
      showMessage('Translations saved successfully!', 'success');
      hasUnsavedChanges = false;
      saveBtn.textContent = 'Save Changes';
    } else {
      showMessage('Error saving translations: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error saving translations: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    if (hasUnsavedChanges) {
      saveBtn.textContent = 'Save Changes *';
    }
  }
}

async function importTranslations() {
  const importBtn = document.getElementById('importBtn');
  importBtn.disabled = true;
  importBtn.textContent = 'Importing...';

  try {
    const response = await fetch('/api/import', {
      method: 'POST'
    });

    const result = await response.json();

    if (response.ok) {
      showMessage('Import completed successfully!', 'success');
      setTimeout(() => {
        loadTranslations();
      }, 1000);
    } else {
      showMessage('Error importing: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error importing: ' + error.message, 'error');
  } finally {
    importBtn.disabled = false;
    importBtn.textContent = 'Import';
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.className = 'message ' + type;
  messageDiv.textContent = text;
  setTimeout(() => {
    messageDiv.textContent = '';
    messageDiv.className = '';
  }, 5000);
}
