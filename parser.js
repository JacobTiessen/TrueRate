// TrueRate offer reader.
// Takes the visible text of a page and pulls out the terms of a lease-to-own or pay-later offer.
// Kept separate from the banner code so it can be tested on its own (see tests/test.js).

const TrueRateParser = (() => {
  // Words that mean "this page has a financing offer on it".
  const TRIGGERS =
    /(lease[- ]to[- ]own|rent[- ]to[- ]own|lease[- ]purchase|rental[- ]purchase|no credit (needed|required|check)|interest[- ]free payments|pay in \d|acima|katapult|snap finance|progressive leasing|koalafi|affirm|klarna|afterpay)/i;

  // A dollar amount like $22, $22.00, $1,299.99
  const MONEY = String.raw`\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)`;
  const toNum = (s) => parseFloat(String(s).replace(/,/g, ""));

  // Turn a schedule word into one of: week, biweek, semimonth, month
  function frequencyFrom(word) {
    const w = String(word).toLowerCase();
    if (/bi-?week|2 weeks|two weeks|other week/.test(w)) return "biweek";
    if (/semi-?month|twice a month/.test(w)) return "semimonth";
    if (/month|^mo$/.test(w)) return "month";
    if (/week|wk/.test(w)) return "week";
    return null;
  }

  function firstMatch(text, patterns) {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return m;
    }
    return null;
  }

  function parse(text) {
    if (!text || !TRIGGERS.test(text)) return null;

    let payment = null;
    let frequency = null;
    let count = null;

    // Style A: "$22/week", "$22 per week", "$59.99 every 2 weeks", "$129/mo", "$89 monthly"
    const pay = firstMatch(text, [
      new RegExp(MONEY + String.raw`\s*(?:\/|per|a|each)?\s*(bi-?weekly|semi-?monthly|weekly|monthly)\b`, "i"),
      new RegExp(MONEY + String.raw`\s*(?:every|each)\s*(2 weeks|two weeks|other week)`, "i"),
      new RegExp(MONEY + String.raw`\s*(?:\/|per|a|each)\s*(week|wk|month|mo)\b`, "i"),
    ]);

    // Style B: "4 interest-free payments of $62.50" (pay-in-4 plans)
    const split = text.match(new RegExp(String.raw`(\d{1,3})\s*(?:interest[- ]free\s*)?(?:payments|installments)\s*of\s*` + MONEY, "i"));

    if (pay) {
      payment = toNum(pay[1]);
      frequency = frequencyFrom(pay[2]);
    } else if (split) {
      count = parseInt(split[1], 10);
      payment = toNum(split[2]);
      // Pay-in-4 plans are almost always every 2 weeks unless the page says monthly.
      frequency = /monthly|per month|a month|\/mo\b/i.test(text) ? "month" : "biweek";
    } else {
      // We know there's an offer, but couldn't read a payment. The banner will ask the user.
      return { price: readPrice(text), payment: null, count: null, frequency: "week", upfront: readUpfront(text), partial: true };
    }

    // Number of payments: "104 payments", "104 weekly payments", "for 12 months"
    if (!count) {
      const cnt = firstMatch(text, [
        /(\d{1,3})\s*(?:weekly |bi-?weekly |monthly )?(?:payments|installments)\b/i,
        /for\s+(\d{1,3})\s*(weeks|months)\b/i,
        /(\d{1,3})[- ](week|month)\s+(?:lease|term|agreement|plan)/i,
      ]);
      if (cnt) {
        const n = parseInt(cnt[1], 10);
        const unit = cnt[2] ? frequencyFrom(cnt[2]) : null;
        if (unit && unit !== frequency) {
          // "$59.99 every 2 weeks for 12 months" -> 26 payments
          const P = { week: 52, biweek: 26, semimonth: 24, month: 12 };
          count = Math.round((n * P[frequency]) / P[unit]);
        } else count = n;
      }
    }

    // If the count is missing but the total is shown, work the count out from the total.
    if (!count) {
      const tot = text.match(
        new RegExp(String.raw`(?:total of payments|total cost of ownership|cost of ownership|total lease cost|total cost)[^$]{0,30}` + MONEY, "i")
      );
      if (tot) count = Math.round(toNum(tot[1]) / payment);
    }

    return { price: readPrice(text), payment, count, frequency, upfront: readUpfront(text), partial: !count };
  }

  // Cash price of the item (what you'd pay up front with no plan)
  function readPrice(text) {
    const pr = firstMatch(text, [
      new RegExp(String.raw`(?:cash price|retail price|cash value|item price|regular price)[^$\n]{0,20}` + MONEY, "i"),
      new RegExp(String.raw`(?:subtotal|price)[^$\n]{0,15}` + MONEY, "i"),
    ]);
    return pr ? toNum(pr[1]) : null;
  }

  // Anything you pay on day one: "$49 processing fee due today", "initial payment: $49"
  function readUpfront(text) {
    const up = firstMatch(text, [
      new RegExp(MONEY + String.raw`\s*(?:processing|application|initial|down|lease)?\s*(?:fee|payment)?\s*(?:due today|due at signing)`, "i"),
      new RegExp(String.raw`(?:due today|due at signing|initial payment|processing fee|application fee|down payment)[^$\n]{0,20}` + MONEY, "i"),
    ]);
    return up ? toNum(up[1]) : 0;
  }

  return { parse, frequencyFrom, TRIGGERS };
})();

if (typeof module !== "undefined") module.exports = TrueRateParser;
