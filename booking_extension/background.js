// Background service worker: orchestrates Gemini prompt -> SerpApi function call -> format result

// Paste your keys here to hardcode them. If left empty, extension will use keys from Options (Chrome storage).
const HARDCODED_GEMINI_KEY = 'AIzaSyDXni1fKJr5B59FEotrIt1x7ezjkY3hn8c';
const HARDCODED_SERP_KEY = 'e4a5753152998398c7af7eba846dba3903fca88f928ddee14475839338d1b5f4';

const CITY_CODES = {
  delhi: 'DEL',
  bangalore: 'BLR',
  mumbai: 'BOM',
  chennai: 'MAA',
  hyderabad: 'HYD',
  kolkata: 'CCU'
};

function getCurrentDateISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildSystemPrompt(query) {
  const currentDate = getCurrentDateISO();
  return (
    `You are a travel agent. By analyzing the input, you need to respond in the following format only:\n\n` +
    `<python function name>|<arguments>\n\n` +
    `Following are the list of functions available:\n\n` +
    `1. find_hotel(city, checkin, checkout, adults) : Function to find the cheapest hotel in the city for the given checkin and checkout date and number of adults.\n` +
    `2. find_flight(origin, destination, departure_date, adults) : Function to find the cheapest flight from the origin to the destination on the given departure date.\n\n` +
    `Consider the current date is ${currentDate}. Calculate the date of travel taking reference of current date if specific date is not mentioned in the query.\n\n` +
    `Lastly, consider the ${JSON.stringify(CITY_CODES)} mapping and put city codes in the reponse.\n\n` +
    query
  );
}

async function callGemini(geminiKey, contents) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(geminiKey);
  const body = {
    contents: [{ role: 'user', parts: [{ text: contents }]}]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

async function callSerpApiHotel(serpKey, city, checkin, checkout, adults) {
  const params = new URLSearchParams({
    engine: 'google_hotels',
    q: city,
    check_in_date: checkin,
    check_out_date: checkout,
    adults: String(adults || 1),
    currency: 'INR',
    gl: 'us',
    hl: 'en',
    api_key: serpKey
  });
  const res = await fetch('https://serpapi.com/search.json?' + params.toString());
  if (!res.ok) throw new Error(`SerpApi hotel error ${res.status}`);
  return res.json();
}

async function callSerpApiFlight(serpKey, origin, destination, departure_date, adults) {
  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departure_date,
    return_date: '',
    currency: 'INR',
    hl: 'en',
    type: '2',
    sort_by: '2',
    adults: String(adults || 1),
    stops: '1',
    api_key: serpKey
  });
  const res = await fetch('https://serpapi.com/search.json?' + params.toString());
  if (!res.ok) throw new Error(`SerpApi flight error ${res.status}`);
  return res.json();
}

function buildResultPrompt(query, functionResponse) {
  return (
    `You are an travel agent, Based on the query: ${query}, an external source of information has generated the following response: ${JSON.stringify(functionResponse)}. \n\n` +
    `Analyse this response and the query and formulate the response one of the following formats only with no extra information and text:\n\n` +
    `Best Flight - DEP <Detaprture date time> - ARR <Arrival Date Time> - <Flight company / Flight number> - <Departure city> - <Arrival City> - <Flight Price>\n` +
    `OR\n` +
    `Best Hotel - <City> - <Check In Date> - <Checkout Date> - <Hotel Name> - <Price per night>\n`
  );
}

async function runQuery(query) {
  const geminiKey = HARDCODED_GEMINI_KEY;
  const serpKey = HARDCODED_SERP_KEY;
  if (!geminiKey || !serpKey) {
    throw new Error('Missing API keys. Paste values into HARDCODED_GEMINI_KEY and HARDCODED_SERP_KEY in background.js.');
  }

  const sysPrompt = buildSystemPrompt(query);
  const routing = await callGemini(geminiKey, sysPrompt);
  const [fnName, argsRaw] = routing.replace(/\n/g, '').split('|');

  let functionResponse = null;
  if (fnName === 'find_hotel') {
    const [city, checkin, checkout, adults] = (argsRaw || '').split(',');
    functionResponse = await callSerpApiHotel(serpKey, city, checkin, checkout, adults);
  } else if (fnName === 'find_flight') {
    const [origin, destination, departure_date, adults] = (argsRaw || '').split(',');
    functionResponse = await callSerpApiFlight(serpKey, origin, destination, departure_date, adults);
  } else {
    throw new Error('Model did not return a valid function name.');
  }

  const resultPrompt = buildResultPrompt(query, functionResponse);
  const finalText = await callGemini(geminiKey, resultPrompt);
  return finalText.trim();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'RUN_QUERY') {
    runQuery(message.query)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true; // keep channel open
  }
});


