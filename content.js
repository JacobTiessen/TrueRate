// TrueRate content script: runs on every page, looks for lease-to-own / pay-later offers
// (using parser.js), and shows the real cost in a banner at the top of the page (using apr.js).

(() => {
  if (window.top !== window) return; // only the main page, not ads or iframes

  let host = null; // the <truerate-banner> element
  let dismissed = false; // user closed the banner
  let userEdited = false; // user typed their own numbers, so stop overwriting them
  let lastKey = "";

  const { money, pct } = TrueRate;
  const FREQ_NAMES = { week: "Weekly", biweek: "Every 2 weeks", semimonth: "Twice a month", month: "Monthly" };

  const CSS = `
    :host { all: initial; }
    .bar { --c: #ef4444; position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
      width: min(740px, calc(100vw - 24px)); background: #151313; color: #fff; border-radius: 16px;
      box-shadow: 0 18px 50px rgba(0,0,0,.4); font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
      border: 2px solid var(--c); overflow: hidden; animation: drop .35s ease-out; }
    @keyframes drop { from { opacity: 0; transform: translate(-50%, -16px); } to { opacity: 1; transform: translate(-50%, 0); } }
    .brand { display: flex; align-items: center; gap: 6px; padding: 7px 16px; font-size: 11px; font-weight: 700;
      letter-spacing: .08em; color: #151313; background: var(--c); }
    .brand .lvl { margin-left: auto; font-weight: 600; letter-spacing: .02em; }
    .top { display: flex; align-items: center; gap: 16px; padding: 14px 16px; }
    .rate { font-size: 40px; font-weight: 800; color: var(--c); line-height: 1; white-space: nowrap; text-align: center; min-width: 96px; }
    .rate small { display: block; font-size: 11px; font-weight: 700; color: #cfc4c4; letter-spacing: .08em; margin-top: 5px; }
    .head { flex: 1; }
    .head b { font-size: 16px; }
    .head p { margin: 4px 0 0; color: #e6dada; }
    .x { background: none; border: 0; color: #aaa; font-size: 24px; cursor: pointer; padding: 0 4px; align-self: flex-start; }
    .x:hover { color: #fff; }
    .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #2e2626; border-top: 1px solid #2e2626; }
    .fact { background: #151313; padding: 10px 14px; }
    .fact span { display: block; font-size: 11px; color: #a99c9c; text-transform: uppercase; letter-spacing: .05em; }
    .fact strong { font-size: 19px; }
    .bad strong { color: #ff8a8a; }
    .good strong { color: #6ee7a8; }
    details { padding: 10px 16px 14px; color: #d9cccc; border-top: 1px solid #2e2626; }
    summary { cursor: pointer; color: #fff; font-weight: 600; }
    .form { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 10px; }
    label { font-size: 11px; color: #a99c9c; display: flex; flex-direction: column; gap: 3px; }
    input, select { background: #241d1d; color: #fff; border: 1px solid #4a3838; border-radius: 7px; padding: 6px; font: inherit; width: 100%; box-sizing: border-box; }
    .math { margin-top: 10px; font-size: 12.5px; line-height: 1.55; }
    @media (max-width: 600px) { .facts { grid-template-columns: 1fr; } .form { grid-template-columns: 1fr 1fr; } }
  `;

  function factsHtml(a) {
    if (a.verdict.level === "fair") {
      return `
        <div class="fact good"><span>Total you pay</span><strong>${money(a.totalPaid)}</strong> same as the price</div>
        <div class="fact good"><span>Extra cost</span><strong>$0.00</strong></div>
        <div class="fact"><span>Plan</span><strong>${a.count} × ${money(a.payment)}</strong> every ${a.periodWord}</div>`;
    }
    const card = TrueRate.creditCardComparison(a.price, a.payment, a.frequency);
    return `
      <div class="fact bad"><span>This plan costs</span><strong>${money(a.totalPaid)}</strong> over ${a.count} ${a.periodPlural}</div>
      <div class="fact good"><span>Save up instead</span><strong>${a.periodsToSave} ${a.periodPlural}</strong> of ${money(a.payment)}, then buy it</div>
      <div class="fact"><span>Same item on a 25% card</span><strong>${card ? money(card.totalPaid) : "n/a"}</strong> paying ${money(a.payment)} each time</div>`;
  }

  function render(offer) {
    if (dismissed) return;
    if (!host) {
      host = document.createElement("truerate-banner");
      host.attachShadow({ mode: "open" }); // Shadow DOM: store CSS can't break us, and we can't break the store
      document.documentElement.appendChild(host);
    }
    const root = host.shadowRoot;
    const a = TrueRate.analyze(offer);

    let color, level, body;
    if (a) {
      color = a.verdict.color;
      level = a.verdict.title;
      const headline =
        a.verdict.level === "fair"
          ? "This payment plan doesn't charge interest."
          : `Paying over time here costs as much as a ${pct(a.apr)} interest loan.`;
      const capLine =
        a.apr > TrueRate.LEGAL_CAP ? ` That's ${a.timesLegalCap.toFixed(1)}× the 36% cap federal law sets for loans to military families.` : "";
      body = `
        <div class="top">
          <div class="rate">${pct(a.apr)}<small>REAL APR</small></div>
          <div class="head"><b>${headline}</b><p>${TrueRate.plainEnglish(a)}${capLine}</p></div>
          <button class="x" title="Close">×</button>
        </div>
        <div class="facts">${factsHtml(a)}</div>`;
    } else {
      color = "#f59e0b";
      level = "Needs a few details";
      body = `
        <div class="top">
          <div class="rate">?<small>REAL APR</small></div>
          <div class="head"><b>This page has a lease-to-own or pay-later offer, but doesn't show the full terms.</b>
            <p>That's a warning sign by itself. Fill in the boxes below (ask the store, or check the agreement) to see the real cost.</p></div>
          <button class="x" title="Close">×</button>
        </div>`;
    }

    const f = (v) => (v == null || Number.isNaN(v) ? "" : v);
    root.innerHTML = `<style>${CSS}</style>
      <div class="bar" style="--c:${color}">
        <div class="brand">TRUERATE <span class="lvl">${level}</span></div>
        ${body}
        <details ${a ? "" : "open"}>
          <summary>${a ? "Check the numbers TrueRate read, or change them" : "Enter the offer's terms"}</summary>
          <div class="form">
            <label>Cash price $<input id="price" type="number" step="0.01" value="${f(offer.price)}"></label>
            <label>Each payment $<input id="payment" type="number" step="0.01" value="${f(offer.payment)}"></label>
            <label>How often<select id="frequency">${Object.entries(FREQ_NAMES)
              .map(([k, v]) => `<option value="${k}" ${offer.frequency === k ? "selected" : ""}>${v}</option>`)
              .join("")}</select></label>
            <label># of payments<input id="count" type="number" step="1" value="${f(offer.count)}"></label>
            <label>Due today $<input id="upfront" type="number" step="0.01" value="${f(offer.upfront)}"></label>
          </div>
          ${
            a
              ? `<div class="math"><b>How TrueRate gets ${pct(a.apr)}:</b> paying ${money(a.upfront)} today means you're really borrowing
            ${money(a.financed)}. TrueRate finds the interest rate <i>r</i> that makes ${a.count} payments of ${money(a.payment)} worth exactly that much:
            ${money(a.payment)} × (1 − (1+<i>r</i>)<sup>−${a.count}</sup>) ÷ <i>r</i> = ${money(a.financed)}.
            The answer is <i>r</i> = ${(a.periodicRate * 100).toFixed(3)}% per ${a.periodWord}. Multiply by ${TrueRate.PERIODS_PER_YEAR[a.frequency]} payments a year
            and you get ${pct(a.apr)} APR (${pct(a.effectiveAnnual)} if you count interest on interest). Lease-to-own counts as a "rental,"
            so these companies usually don't have to show you this number.</div>`
              : ""
          }
        </details>
      </div>`;

    root.querySelector(".x").onclick = () => {
      dismissed = true;
      host.remove();
    };
    root.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("change", () => {
        userEdited = true;
        const g = (id) => root.getElementById(id).value;
        render({
          price: parseFloat(g("price")),
          payment: parseFloat(g("payment")),
          count: parseFloat(g("count")),
          frequency: g("frequency"),
          upfront: parseFloat(g("upfront")) || 0,
        });
        root.querySelector("details").open = true;
      });
    });
  }

  // Read the page and show the banner if there's an offer.
  function scan() {
    if (dismissed || userEdited || !document.body) return;
    const offer = TrueRateParser.parse(document.body.innerText);
    if (!offer) return;
    if (!offer.price) {
      const meta = document.querySelector('meta[property="product:price:amount"], [itemprop="price"]');
      if (meta) offer.price = parseFloat(meta.getAttribute("content") || meta.textContent);
    }
    const key = JSON.stringify(offer);
    if (key === lastKey) return;
    lastKey = key;
    render(offer);
  }

  // Checkout widgets often load after the page, so keep watching for changes.
  let timer = null;
  new MutationObserver((muts) => {
    if (host && muts.every((m) => m.target === host || host.contains(m.target))) return;
    clearTimeout(timer);
    timer = setTimeout(scan, 600);
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  scan();
})();
