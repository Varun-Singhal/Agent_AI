# Code Explainer with Gemini

Chrome extension that lets you highlight any code on a page, right–click, and get an instant Gemini-powered explanation. Results are available in the popup for quick copy or in a full-page viewer for richer rendering.

## Features
- Context-menu action **“Explain this code with Gemini”** on selected text.
- Calls Gemini Flash (`gemini-2.0-flash`) and stores the latest request/response.
- Popup shows status, explanation text, copy-to-clipboard, and “Open in Tab”.
- Full-page viewer renders the returned HTML (scripts stripped for safety).
- Minimal theming for both popup and viewer.

## Project Structure
- `manifest.json` – MV3 manifest, permissions, and content script wiring.
- `background.js` – context menu setup, selection capture, Gemini API call, storage/notification handling.
- `content.js` – helper to return the current page selection on request.
- `popup.html / popup.js / popup.css` – popup UI to read, copy, or open the last explanation.
- `viewer.html / viewer.js / viewer.css` – dedicated tab to render the stored explanation safely.

## Setup
1) **Get an API key** for the Gemini API and ensure the model `gemini-2.0-flash` is accessible.
2) **Provide the key**  
   - Preferred: update `HARDCODED_GEMINI_API_KEY` in `background.js`.  
   - Alternatively: store it in `chrome.storage.local` under the key `geminiApiKey` (e.g., via the Extensions page “Inspect views” console: `chrome.storage.local.set({ geminiApiKey: "YOUR_KEY" })`).
3) **Load the extension**  
   - Open `chrome://extensions`, enable *Developer mode*, click *Load unpacked*, and select the repository folder.

## Usage
1) Highlight code on any page.  
2) Right-click → **“Explain this code with Gemini”**.  
3) Open the extension popup to view or copy the explanation, or click **Open in Tab** to render it in a full page.

## Notes & Privacy
- Explanations and the last input are stored only in `chrome.storage.local`.
- `viewer.js` strips `<script>` tags from the returned HTML before rendering.
- The extension requests `notifications` to surface success/failure toasts and `clipboardRead` to support copy in some contexts.

## Troubleshooting
- **“Missing Gemini API key”**: set `HARDCODED_GEMINI_API_KEY` in `background.js` or store `geminiApiKey` in `chrome.storage.local`.
- **Empty response**: ensure your model access is enabled and the selected text is non-empty.
- **Permission errors**: re-load the extension after changing permissions or keys.

## Development Tips
- The background script is a service worker; use the *Service Workers* section in `chrome://extensions` to inspect logs.
- To clear cached state between tests: `chrome.storage.local.clear()`.

