// Background service worker for context menu and API calls
// Creates context menu, captures selected text, calls Gemini API, stores result, and notifies user

const CONTEXT_MENU_ID = "gemini_explain_code";
const STORAGE_KEY_LAST_EXPLANATION = "lastExplanation";
const STORAGE_KEY_LAST_ERROR = "lastError";
const STORAGE_KEY_LAST_INPUT = "lastInput";
const STORAGE_KEY_IS_LOADING = "isLoading";

// Placeholder: set your Gemini Flash 2.0 API key here or via chrome.storage
const GEMINI_API_KEY_STORAGE_KEY = "geminiApiKey"; // store your key in chrome.storage.local under this key
// If you want to hardcode your key, paste it between the quotes below.
// Example: const HARDCODED_GEMINI_API_KEY = "AIza...your_key_here...";
const HARDCODED_GEMINI_API_KEY = "AIzaSyDXni1fKJr5B59FEotrIt1x7ezjkY3hn8c"; // <<< PUT YOUR GEMINI API KEY HERE
const GEMINI_MODEL = "gemini-2.0-flash"; // adjust if needed

// Create context menu on install/update
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: "Explain this code with Gemini",
        contexts: ["selection"]
      });
    });
  } catch (e) {
    // swallow
  }
});

// Helper to get selected text from the active tab
async function getSelectedText(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => (window.getSelection ? String(window.getSelection()) : "")
    });
    return (result || "").trim();
  } catch (e) {
    return "";
  }
}

async function setLoading(isLoading) {
  await chrome.storage.local.set({ [STORAGE_KEY_IS_LOADING]: Boolean(isLoading) });
}

// Call Gemini Flash 2.0 API with the code snippet
async function callGeminiApi(apiKey, codeSnippet) {
  const endpointBase = "https://generativelanguage.googleapis.com/v1beta/models/";
  const endpoint = endpointBase +
    encodeURIComponent(GEMINI_MODEL) +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  const prompt = `Explain the following code snippet and describe its use case, also make sure the explaination is in html code with inline css so that it can be rendered easily:\n\n\u3010CODE START\u3011\n${codeSnippet}\n\u3010CODE END\u3011`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Gemini API error ${resp.status}: ${text}`);
  }

  const data = await resp.json();

  // Gemini response parsing (v1beta generateContent)
  // Usually data.candidates[0].content.parts[0].text
  const explanation = (data?.candidates?.[0]?.content?.parts || [])
    .map(p => p?.text || "")
    .join("\n")
    .trim();

  if (!explanation) {
    throw new Error("Empty response from Gemini API");
  }
  return explanation;
}

// Store the explanation for popup consumption
async function storeExplanation(input, explanation) {
  await chrome.storage.local.set({
    [STORAGE_KEY_LAST_INPUT]: input,
    [STORAGE_KEY_LAST_EXPLANATION]: explanation,
    [STORAGE_KEY_LAST_ERROR]: null
  });
}

async function storeError(input, errorMessage) {
  await chrome.storage.local.set({
    [STORAGE_KEY_LAST_INPUT]: input || "",
    [STORAGE_KEY_LAST_EXPLANATION]: "",
    [STORAGE_KEY_LAST_ERROR]: errorMessage
  });
}

function notify(title, message) {
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message
    });
  } catch (e) {
    // notifications permission might be disabled; ignore
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;

  const tabId = tab.id;
  let selectedText = (info.selectionText || "").trim();
  if (!selectedText) {
    selectedText = await getSelectedText(tabId);
  }

  if (!selectedText) {
    await storeError("", "No text selected. Please select a code snippet first.");
    notify("Code Explainer", "No selection found. Select code and try again.");
    return;
  }

  // Prefer hardcoded API key if provided, otherwise read from storage
  const { [GEMINI_API_KEY_STORAGE_KEY]: storedKey } = await chrome.storage.local.get(
    GEMINI_API_KEY_STORAGE_KEY
  );
  const apiKey = HARDCODED_GEMINI_API_KEY || storedKey;
  if (!apiKey) {
    await storeError(
      selectedText,
      "Missing Gemini API key. Add it to HARDCODED_GEMINI_API_KEY in background.js."
    );
    notify("Code Explainer", "Missing Gemini API key. Add it in background.js.");
    return;
  }

  try {
    await setLoading(true);
    notify("Code Explainer", "Sending code to Gemini...");
    const explanation = await callGeminiApi(apiKey, selectedText);
    await storeExplanation(selectedText, explanation);
    notify("Code Explainer", "Explanation ready. Open the popup to view.");
  } catch (err) {
    const message = err?.message || String(err);
    await storeError(selectedText, message);
    notify("Code Explainer", "Failed to get explanation from Gemini.");
  } finally {
    await setLoading(false);
  }
});
