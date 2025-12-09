// Popup script for Interview Question Extractor

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFile = document.getElementById('removeFile');
const extractBtn = document.getElementById('extractBtn');
const settingsBtn = document.getElementById('settingsBtn');
const results = document.getElementById('results');
const questionsList = document.getElementById('questionsList');
const error = document.getElementById('error');

let selectedFile = null;

// File upload handling
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

fileInput.addEventListener('change', handleFileSelect);
removeFile.addEventListener('click', clearFile);

extractBtn.addEventListener('click', extractQuestions);
settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

function handleDragOver(e) {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
}

function handleFile(file) {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    showError('Please select a .docx file');
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  
  uploadArea.style.display = 'none';
  fileInfo.style.display = 'block';
  extractBtn.disabled = false;
  
  hideError();
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  uploadArea.style.display = 'block';
  fileInfo.style.display = 'none';
  extractBtn.disabled = true;
  results.style.display = 'none';
  hideError();
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function extractQuestions() {
  if (!selectedFile) return;

  setLoading(true);
  hideError();
  results.style.display = 'none';

  try {
    // Read file content
    const content = await readFileAsText(selectedFile);
    
    // Send to background script for processing
    const result = await chrome.runtime.sendMessage({
      type: 'PROCESS_DOCUMENT',
      content: content,
      fileName: selectedFile.name
    });

    if (result.success) {
      displayResults(result.questions, result.fileName);
    } else {
      showError(result.error);
    }

  } catch (error) {
    showError(`Error processing document: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function displayResults(questions, fileName) {
  questionsList.innerHTML = '';
  
  questions.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
      <div class="question-number">${index + 1}</div>
      <div class="question-text">${question}</div>
    `;
    questionsList.appendChild(questionDiv);
  });

  results.style.display = 'block';
}

function setLoading(loading) {
  const btnText = document.querySelector('.btn-text');
  const btnLoading = document.querySelector('.btn-loading');
  
  if (loading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    extractBtn.disabled = true;
  } else {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    extractBtn.disabled = false;
  }
}

function showError(message) {
  error.textContent = message;
  error.style.display = 'block';
}

function hideError() {
  error.style.display = 'none';
}




