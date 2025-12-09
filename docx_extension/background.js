// Background service worker for Interview Question Extractor

// Hardcoded API key - paste your Gemini API key here
const GEMINI_API_KEY = 'AIzaSyDXni1fKJr5B59FEotrIt1x7ezjkY3hn8c';

// Document reading function
async function readDocument(fileContent) {
  try {
    // Since we can't use python-docx in Chrome extension, we'll send the file to Gemini
    // for text extraction and then question analysis in one go
    return fileContent;
  } catch (error) {
    throw new Error(`Error reading document: ${error.message}`);
  }
}

// Call Gemini API
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in background.js');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  
  const body = {
    contents: [{
      role: 'user',
      parts: [{
        text: prompt
      }]
    }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Main processing function
async function processDocument(fileContent, fileName) {
  try {
    const prompt = `You are an AI assistant that analyzes interview question documents. 

Please analyze the following document content and extract the 5 most important interview questions that would be most valuable for interview preparation.

Document: "${fileName}"
Content: ${fileContent}

Please respond with ONLY the 5 most important questions, numbered 1-5, one per line. Do not include any other text, explanations, or formatting.`;

    const result = await callGemini(prompt);
    
    // Parse the response to extract individual questions
    const questions = result
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 0)
      .slice(0, 5); // Ensure we only get 5 questions

    return {
      success: true,
      questions: questions,
      fileName: fileName
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROCESS_DOCUMENT') {
    processDocument(message.content, message.fileName)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    return true; // Keep message channel open for async response
  }
});




