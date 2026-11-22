// TrueRate math engine.
// Turns "price + payment schedule" into the interest rate a lender would have to disclose.

const TrueRate = (() => {
  // How many payments happen in one year for each schedule.
  const PERIODS_PER_YEAR = { week: 52, biweek: 26, semimonth: 24, month: 12 };
  const PERIOD_WORD = { week: "week", biweek: "2 weeks", semimonth: "half-month", month: "month" };
  const PERIOD_PLURAL = { week: "weeks", biweek: "payments", semimonth: "payments", month: "months" };

  // The Military Lending Act caps most loans to service members at 36% a year.
  // TrueRate uses it as a plain benchmark for "too expensive".
  const LEGAL_CAP = 0.36;

  // Present value: what n payments of size A are worth today at periodic rate r.
  // PV = A * (1 - (1 + r)^-n) / r   (and A * n when r = 0)
  function presentValue(payment, count, r) {
    if (r === 0) return payment * count;
    return (payment * (1 - Math.pow(1 + r, -count))) / r;
  }

  // Find the periodic rate r where the payments are exactly worth the amount financed.
  // PV only goes down as r goes up, so bisection always lands on the one correct answer.
  function solvePeriodicRate(financed, payment, count) {
    if (payment * count <= financed + 1e-9) return 0; // you pay no more than you borrowed
    let lo = 0;
    let hi = 1;
    while (presentValue(payment, count, hi) > financed && hi < 1e6) hi *= 2;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (presentValue(payment, count, mid) > financed) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Sort an APR into one of four plain-language levels.
  function verdict(apr) {
    if (apr < 0.005) return { level: "fair", title: "Fair deal: no hidden interest", color: "#22c55e" };
    if (apr <= LEGAL_CAP) return { level: "costly", title: "This plan charges interest", color: "#f59e0b" };
    if (apr <= 1) return { level: "predatory", title: "Above the 36% legal limit for military loans", color: "#ef4444" };
    return { level: "extreme", title: "Extremely expensive", color: "#ef4444" };
  }

  // Main entry point. Returns everything the banner and popup need, or null if inputs are unusable.
  function analyze({ price, payment, count, frequency = "week", upfront = 0 }) {
    price = Number(price);
    payment = Number(payment);
    count = Math.round(Number(count));
    upfront = Number(upfront) || 0;
    const perYear = PERIODS_PER_YEAR[frequency];
    if (!(price > 0 && payment > 0 && count > 0 && perYear)) return null;

    const financed = price - upfront; // money you are effectively borrowing
    if (financed <= 0) return null;

    const r = solvePeriodicRate(financed, payment, count);
    const apr = r * perYear; // nominal APR, the way the Truth in Lending Act defines it
    const effectiveAnnual = Math.pow(1 + r, perYear) - 1; // with compounding
    const totalPaid = upfront + payment * count;
    const extraCost = Math.max(0, totalPaid - price);

    return {
      price,
      payment,
      count,
      frequency,
      upfront,
      financed,
      periodicRate: r,
      apr,
      effectiveAnnual,
      timesLegalCap: apr / LEGAL_CAP,
      totalPaid,
      extraCost,
      markupPct: extraCost / price,
      termYears: count / perYear,
      periodsToSave: Math.ceil(price / payment), // save the same payment instead, then buy it outright
      periodWord: PERIOD_WORD[frequency],
      periodPlural: PERIOD_PLURAL[frequency],
      verdict: verdict(apr),
    };
  }

  // One sentence a 12-year-old could understand.
  function plainEnglish(a) {
    if (a.verdict.level === "fair") return `You pay ${money(a.totalPaid)} in total, the same as the price. Splitting it up costs you nothing extra.`;
    const extra = money(a.extraCost);
    if (a.extraCost >= a.price) return `You pay ${extra} extra just for paying over time. In total that's ${(a.totalPaid / a.price).toFixed(1)}× the price, like buying it more than twice.`;
    return `You pay ${extra} extra just for paying over time (${pct(a.markupPct)} on top of the price).`;
  }

  // Compare: cost of the same item on an ordinary credit card paid off with the same payment.
  function creditCardComparison(price, payment, frequency, cardApr = 0.25) {
    const perYear = PERIODS_PER_YEAR[frequency];
    const r = cardApr / perYear;
    if (payment <= price * r) return null; // payment never pays it off
    let balance = price;
    let paid = 0;
    let periods = 0;
    while (balance > 0.005 && periods < 10000) {
      balance *= 1 + r;
      const p = Math.min(payment, balance);
      balance -= p;
      paid += p;
      periods++;
    }
    return { cardApr, totalPaid: paid, periods };
  }

  function money(x) {
    return "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function pct(x) {
    return (x * 100).toLocaleString("en-US", { maximumFractionDigits: 0 }) + "%";
  }

  return {
    analyze,
    verdict,
    plainEnglish,
    creditCardComparison,
    presentValue,
    solvePeriodicRate,
    PERIODS_PER_YEAR,
    LEGAL_CAP,
    money,
    pct,
  };
})();

if (typeof module !== "undefined") module.exports = TrueRate; // lets Node run the tests
