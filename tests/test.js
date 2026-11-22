// TrueRate test suite. Run with:  node tests/test.js
// No libraries needed. Checks the math against known answers and the reader against every sample store.

const fs = require("fs");
const path = require("path");
const TrueRate = require("../apr.js");
const Parser = require("../parser.js");

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log("  PASS  " + name);
  } else {
    failed++;
    console.log("  FAIL  " + name + (detail ? "  ->  " + detail : ""));
  }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

console.log("\nMath engine");

// 1. A normal bank loan: $1,000 at 12% APR, 12 monthly payments of $88.85. TrueRate must recover 12%.
let a = TrueRate.analyze({ price: 1000, payment: 88.8488, count: 12, frequency: "month" });
check("recovers a known 12% loan", near(a.apr, 0.12, 0.0001), (a.apr * 100).toFixed(4) + "%");

// 2. A $10,000 car loan at 6% for 60 months has payment $193.33. TrueRate must recover 6%.
a = TrueRate.analyze({ price: 10000, payment: 193.328, count: 60, frequency: "month" });
check("recovers a known 6% car loan", near(a.apr, 0.06, 0.0001), (a.apr * 100).toFixed(4) + "%");

// 3. Paying exactly the price back gives 0%.
a = TrueRate.analyze({ price: 250, payment: 62.5, count: 4, frequency: "biweek" });
check("interest-free plan is 0% and marked fair", a.apr === 0 && a.verdict.level === "fair");

// 4. The solved rate really does make the payments worth the amount financed.
a = TrueRate.analyze({ price: 899.99, payment: 22, count: 104, frequency: "week", upfront: 49 });
check("solution satisfies the equation", near(TrueRate.presentValue(22, 104, a.periodicRate), a.financed, 0.001));
check("sofa example totals $2,337.00", near(a.totalPaid, 2337, 0.001));

// 5. Bad input returns null instead of a wrong number.
check("rejects missing numbers", TrueRate.analyze({ price: 500, payment: 20, count: 0 }) === null);
check("rejects a fee bigger than the price", TrueRate.analyze({ price: 100, payment: 10, count: 20, upfront: 150 }) === null);

// 6. Verdict levels line up with the 36% benchmark.
check("verdict: 20% is 'costly'", TrueRate.verdict(0.2).level === "costly");
check("verdict: 60% is 'predatory'", TrueRate.verdict(0.6).level === "predatory");
check("verdict: 150% is 'extreme'", TrueRate.verdict(1.5).level === "extreme");

console.log("\nOffer reader, using the real sample store pages");

// Turn a sample page into roughly the text Chrome shows (tags removed, template content included).
function pageText(file) {
  const html = fs.readFileSync(path.join(__dirname, "..", "samples", file), "utf8");
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|h2|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ");
}

const expected = [
  { file: "1-sofa-weekly-lease.html", price: 899.99, payment: 22, count: 104, frequency: "week", upfront: 49, apr: 1.22 },
  { file: "2-laptop-biweekly-lease.html", price: 799, payment: 59.99, count: 26, frequency: "biweek", upfront: 0, apr: 1.5 },
  { file: "3-fridge-monthly-lease.html", price: 1299, payment: 129, count: 18, frequency: "month", upfront: 49.99, apr: 0.9 },
  { file: "4-bike-pay-in-4-fair.html", price: 250, payment: 62.5, count: 4, frequency: "biweek", upfront: 0, apr: 0 },
];

for (const e of expected) {
  const o = Parser.parse(pageText(e.file));
  const ok =
    o && o.price === e.price && o.payment === e.payment && o.count === e.count && o.frequency === e.frequency && o.upfront === e.upfront;
  check(`reads every term on ${e.file}`, ok, JSON.stringify(o));
  if (o) {
    const r = TrueRate.analyze(o);
    check(`  ...and gets about ${Math.round(e.apr * 100)}% APR`, r && near(r.apr, e.apr, 0.01), r && (r.apr * 100).toFixed(1) + "%");
  }
}

const tires = Parser.parse(pageText("5-tires-hidden-terms.html"));
check("hidden-terms page: spots the offer but knows terms are missing", tires && tires.partial === true && tires.payment === 35, JSON.stringify(tires));

check("ignores pages with no financing offer", Parser.parse("Free shipping on orders over $50. Price $19.99") === null);

console.log("\nOther wording real stores use");
const cases = [
  ["$45 per week, 52 payments. Lease-to-own. Cash price $1,500", { payment: 45, frequency: "week", count: 52, price: 1500 }],
  ["No credit check! $89 monthly for 24 months. Retail price $1,200.00", { payment: 89, frequency: "month", count: 24, price: 1200 }],
  ["Rent-to-own: $30 bi-weekly. Total cost $1,560. Price $700", { payment: 30, frequency: "biweek", count: 52, price: 700 }],
  ["Lease-to-own $25/wk for 12 months, item price $600", { payment: 25, frequency: "week", count: 52, price: 600 }],
];
for (const [text, want] of cases) {
  const o = Parser.parse(text);
  const ok = o && Object.entries(want).every(([k, v]) => o[k] === v);
  check(`"${text.slice(0, 46)}..."`, ok, JSON.stringify(o));
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
