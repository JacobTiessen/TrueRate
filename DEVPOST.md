# Devpost submission: copy and paste each part into its box

---

## Project name
TrueRate

## Tagline (the short line under the title, 200 characters max)
A Chrome extension that shows the real interest rate hidden inside "lease-to-own" and "pay later" offers, before you click buy.

## Image gallery (upload in this order, then type each caption)

| # | File | Caption |
|---|---|---|
| 1 | `docs/problem.png` | The problem: "$22/week" is really a 122% APR |
| 2 | `docs/sofa-122.png` | TrueRate catches a weekly lease and shows its math |
| 3 | `docs/bike-fair.png` | Fair plans get a green light. TrueRate only flags hidden costs |
| 4 | `docs/tires-hidden.png` | When a store hides the terms, TrueRate says so |
| 5 | `docs/how-it-works.png` | How it works: read, solve, warn |
| 6 | `docs/popup.png` | Pocket calculator for offers you see in a store |

---

## Inspiration

Picture this: your fridge breaks, you have no savings and your credit is bad. You find a new one online, and at checkout a bright green box says **"No credit needed! Just $129 a month."** It feels like a lifeline, so you click it.

What that box doesn't tell you is that you'll pay **$2,371.99 for a $1,299 fridge**. As a loan, that's about a **90% interest rate**.

This isn't a loophole I made up. Lease-to-own counts as a **rental**, not a loan, so these companies usually **don't have to show an APR** the way credit cards and bank loans do. The Maryland Attorney General's office says that if they did, rates would often be **120% to 150%**. About **6.7 million Americans** used rent-to-own in 2025, according to the industry's own trade group. The FTC found that customers are more likely to have **lower incomes, have kids and rent their homes**. These are the people who can least afford to overpay.

Then I found something that bothered me: lease-to-own companies have built **browser extensions that push these offers at checkout**. I couldn't find a single tool working for the shopper. So I built one that pushes back.

## What it does

TrueRate is a Chrome extension that watches checkout pages. When it sees a lease-to-own or pay-later offer, it:

- **Reads the terms**: price, payment, how often, number of payments and any fee due today
- **Calculates the real APR**, the same way lenders are legally required to for loans
- **Shows a color-coded banner in plain English:**
  - 🔴 *"Paying over time here costs as much as a 122% interest loan. You pay $1,437.01 extra. That's 3.4× the 36% cap federal law sets for loans to military families."*
  - 🟢 *"This payment plan doesn't charge interest."* TrueRate isn't against payment plans, only hidden costs.
  - 🟡 *"This page has an offer but doesn't show the full terms. That's a warning sign by itself."*
- **Shows better options:** *"Save $22 a week for 41 weeks and you own it,"* instead of paying for 104 weeks
- **Explains the math step by step** and lets you fix any number it read wrong
- **Pocket calculator:** click the toolbar icon to check any offer, even one on a sign in a physical store

**Tested on five sample checkouts, each written differently:**

| Offer | TrueRate says |
|---|---|
| Sofa: $22/week × 104, $49 fee | 🔴 122% APR, $2,337 for $899.99 |
| Laptop: $59.99 every 2 weeks for 12 months | 🔴 150% APR, $1,559.74 for $799 |
| Fridge: $129/mo × 18, $49.99 up front | 🔴 90% APR, $2,371.99 for $1,299 |
| Bike: 4 interest-free payments of $62.50 | 🟢 0%, fair |
| Tires: "as low as $35 a week*" | 🟡 Terms hidden, asks for details |

## How TrueRate is different

Rent-to-own calculators already exist, but they're websites you have to find and fill in yourself. Checkout-warning extensions exist too, but they look for hidden fees, subscriptions and dark patterns. TrueRate is different in four ways:

1. **It does real math, not keyword flags.** Other warning tools say "this looks risky." TrueRate solves for the exact rate (122%), the same way lenders must for loans.
2. **It targets the one product that legally avoids showing a rate.** Lease-to-own counts as a "rental," so its APR is hidden by design. That makes it exactly where an automatic APR check is most needed.
3. **It gives you something to do instead.** "Save $22 a week for 41 weeks and you own it" is a plan, not just a warning.
4. **It's fair.** Honest payment plans get a green light. TrueRate flags hidden costs, not every payment plan.

## How I built it

- **Plain JavaScript + Chrome Manifest V3.** No frameworks and no build step, so anyone can read the code and install it in two minutes.
- **Offer reader (`parser.js`).** Pattern matching that understands many ways stores write the same offer: "$22/week", "$45 every 2 weeks", "$129/mo", "$89 monthly for 24 months", "4 interest-free payments of $62.50". It converts between units (12 months of every-2-week payments = 26 payments) and works out the number of payments from the total when a store leaves it out.
- **Math engine (`apr.js`).** The hard part. Stores show the payment but never the rate, so TrueRate solves this equation for the rate *r*:
  `payment × (1 − (1+r)^−n) ÷ r = amount borrowed`.
  You can't rearrange it to get *r* by itself, so I used **bisection**: the left side always goes down as *r* goes up, so cutting the search range in half 200 times is guaranteed to land on the one correct answer. APR = *r* × payments per year, which is the definition in the Truth in Lending Act.
- **Watching the page.** Real checkout widgets load after the page does, so a `MutationObserver` rescans whenever the page changes.
- **Shadow DOM banner.** The banner is sealed off from the store's code, so the store's styles can't break it and it can't break the store.
- **Tests.** 24 automated tests in Node.js. They check the solver against real loans with known rates (a 12% loan and a 6% car loan, both recovered to within 0.01%), check that every sample store is read correctly, and check that bad input returns "can't calculate" instead of a wrong number.
- **Privacy by design.** Everything runs on your own computer. There's no server, no account and no tracking.

## Usability and accessibility

- **Plain English first:** every banner leads with one sentence anyone can understand ("You pay $1,437.01 extra just for paying over time"). The math is there for people who want it, folded away by default.
- **Never color alone:** every verdict is written out in words ("Fair deal: no hidden interest", "Above the 36% legal limit"), so color-blind users get the same message.
- **Large, high-contrast text** on a dark banner, readable on any store's design.
- **Nothing to set up:** no account and no settings. Install it and it works on every page.
- **Helpful when it's unsure:** if a store hides the terms, TrueRate says so and asks for the missing numbers instead of guessing.
- **Works offline and privately:** no data leaves the computer, which matters for people who are worried about money.

## What I built during the event (and what was pre-existing)

Everything was built during EvoHacks II on Nov 21–22, 2026: the extension, the math engine, the offer reader, the 5 sample stores, the tests, the screenshots and the demo video. The [commit history](https://github.com/JacobTiessen/TrueRate/commits/main) shows it.

- **Pre-existing components:** none. No libraries or frameworks, only Chrome's built-in extension APIs and plain JavaScript.
- **AI use:** I built TrueRate solo with help from an AI assistant (Claude), which I used for coding, research and making the demo video. I chose the problem and the approach, and I checked the math against known loan rates.

## Challenges I ran into

- **Stores write the same offer a dozen different ways.** "$22/week", "$22 per week", "$22 a week", "$22 weekly", "every 2 weeks" versus "bi-weekly"... I had to build the reader one pattern at a time and test each one.
- **Units that don't match.** "$59.99 every 2 weeks for 12 months" mixes two units of time. TrueRate has to turn 12 months into 26 payments before the math works.
- **Offers that load late.** At first TrueRate scanned the page once and missed offers that popped in a second later. Watching the page for changes fixed it.
- **Not crying wolf.** Early on, every payment plan looked "bad." I added the green "fair" result and the 36% benchmark so TrueRate only warns when there's a real hidden cost.
- **Admitting what it can't read.** When a store hides the terms, a wrong guess would be worse than no answer. So TrueRate says the terms are hidden and lets you fill them in.

## Accomplishments that I'm proud of

- The math is **verified**: it recovers known loan rates to within 0.01%.
- It handles **weekly, every-2-weeks, twice-a-month and monthly** plans, fees due up front, and terms written in different units.
- It's **honest in both directions**: red for hidden costs, green for fair plans, yellow for hidden terms.
- Someone with no finance background can read the banner and understand exactly how much extra they'd pay.

## What I learned

- How lenders calculate APR, and why the Truth in Lending Act's definition matters
- **Numerical methods:** some equations can't be solved with algebra, but bisection can still find the answer to any accuracy you want
- How Chrome extensions work: content scripts, Manifest V3, MutationObserver and Shadow DOM
- That a 'rental' label can be enough to keep a 122% rate off the screen

## What's next for TrueRate

- **AI backup reader:** when pattern matching fails, send the offer text to an AI model to pull out the terms
- **Firefox, Edge and Safari** versions, plus a **Chrome Web Store** release for one-click install
- **Spanish** version of the banner
- **Partnering with credit counselors and financial-literacy teachers**, so it reaches the people who need it before they sign

## Built with
javascript · html · css · chrome-extension · manifest-v3 · shadow-dom · node.js

## Try it out
- GitHub: https://github.com/JacobTiessen/TrueRate
- Demo video: https://youtu.be/KsizOH12GOI
