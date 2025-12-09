Travel Agent Helper (Chrome Extension)
====================================

A Manifest V3 Chrome extension that ports your `practice.ipynb` workflow into a beautiful UI for travel agents. It routes a natural-language query to Gemini to select a function (find_hotel or find_flight), calls SerpApi for data, and asks Gemini to format the final answer into one strict line.

Features
--------
- Popup UI for instant querying
- Options page to store Gemini and SerpApi API keys (Chrome sync storage)
- Background service worker orchestrates Gemini + SerpApi
- Pretty dark UI, responsive, with icons

Install (Developer Mode)
------------------------
1. Get API keys:
   - Gemini API Key (Google AI Studio)
   - SerpApi key
2. In Chrome go to `chrome://extensions/`, enable Developer Mode.
3. Click “Load unpacked” and select the `extension/` folder in this repository.
4. Open the extension’s Options page and paste your keys.
5. Open the popup and try: "Find me a hotel in Bali for tomorrow".

Usage
-----
The model will respond in one of the two formats only:
- Best Flight - DEP <Detaprture date time> - ARR <Arrival Date Time> - <Flight company / Flight number> - <Departure city> - <Arrival City> - <Flight Price>
- Best Hotel - <City> - <Check In Date> - <Checkout Date> - <Hotel Name> - <Price per night>

Notes
-----
- Data is fetched client-side. Your keys remain in browser storage.
- Network access: `https://generativelanguage.googleapis.com/` and `https://serpapi.com/`.
- You can customize prompt logic in `background.js`.

Folder Structure
----------------
- `manifest.json` – MV3 manifest
- `background.js` – model routing + API calls + result formatting
- `popup.html`, `popup.js` – UI
- `options.html`, `options.js` – API keys settings
- `styles.css` – shared styles
- `icons/` – icon assets


