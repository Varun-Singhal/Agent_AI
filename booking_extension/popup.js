const queryEl = document.getElementById('query');
const runBtn = document.getElementById('run');
const resultEl = document.getElementById('result');
const openOptionsBtn = document.getElementById('openOptions');

function renderParsed(text) {
  // Expected formats:
  // Best Flight - DEP <Departure> - ARR <Arrival> - <Carrier/Number> - <From> - <To> - <Price>
  // Best Hotel - <City> - <CheckIn> - <Checkout> - <HotelName> - <Price>
  const clean = (text || '').trim();
  if (!clean) return resultEl.textContent = 'No result';

  const flightMatch = clean.match(/^Best\s+Flight\s+-\s+DEP\s+([^\-]+)-\s+ARR\s+([^\-]+)-\s+([^\-]+)-\s+([^\-]+)-\s+([^\-]+)-\s+(.+)$/i);
  const hotelMatch = clean.match(/^Best\s+Hotel\s+-\s+([^\-]+)-\s+([^\-]+)-\s+([^\-]+)-\s+([^\-]+)-\s+(.+)$/i);

  resultEl.innerHTML = '';

  if (flightMatch) {
    const [, dep, arr, carrier, fromCity, toCity, price] = flightMatch.map(s => s.trim());
    resultEl.innerHTML = `
      <div class="pill">✈️ Best Flight</div>
      <div class="title">${carrier}</div>
      <div class="kvs">
        <div class="k">Departure</div><div class="v">${dep}</div>
        <div class="k">Arrival</div><div class="v">${arr}</div>
        <div class="k">From</div><div class="v">${fromCity}</div>
        <div class="k">To</div><div class="v">${toCity}</div>
        <div class="k">Price</div><div class="v">${price}</div>
      </div>
    `;
    return;
  }

  if (hotelMatch) {
    const [, city, checkIn, checkOut, hotelName, price] = hotelMatch.map(s => s.trim());
    resultEl.innerHTML = `
      <div class="pill">🏨 Best Hotel</div>
      <div class="title">${hotelName}</div>
      <div class="kvs">
        <div class="k">City</div><div class="v">${city}</div>
        <div class="k">Check-in</div><div class="v">${checkIn}</div>
        <div class="k">Checkout</div><div class="v">${checkOut}</div>
        <div class="k">Price</div><div class="v">${price}</div>
      </div>
    `;
    return;
  }

  // Fallback
  resultEl.textContent = clean;
}

openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

runBtn.addEventListener('click', async () => {
  const query = queryEl.value.trim();
  if (!query) {
    resultEl.textContent = 'Please enter a query.';
    return;
  }
  runBtn.disabled = true;
  resultEl.textContent = 'Working...';
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'RUN_QUERY', query });
    if (resp?.ok) {
      renderParsed(resp.result);
    } else {
      resultEl.textContent = 'Error: ' + (resp?.error || 'Unknown error');
    }
  } catch (e) {
    resultEl.textContent = 'Error: ' + e.message;
  } finally {
    runBtn.disabled = false;
  }
});


