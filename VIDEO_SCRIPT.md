# TrueRate demo video script (about 2 minutes 40 seconds)

**Rule from EvoHacks: 2 to 3 minutes.** Aim for 2:40 so you have room to spare.
**Tools:** OBS Studio (free) or the Xbox Game Bar on Windows (press Win + G) to record your screen. Speak into a headset mic if you have one.
**Before recording:** load the extension, turn on "Allow access to file URLs," open `samples/index.html`, close every other tab, and zoom Chrome to 110% so text is easy to read.

---

### 0:00 – 0:15 · Hook
**Screen:** `docs/problem.png`, full screen.
**Say:**
> "This sofa costs nine hundred dollars. At checkout, the store offers it for twenty-two dollars a week, no credit needed. Sounds cheap. But if you take that deal, you pay two thousand three hundred thirty-seven dollars. That's a 122 percent interest rate, and the store never has to tell you."

### 0:15 – 0:40 · The problem
**Screen:** stay on the problem image.
**Say:**
> "This is called lease-to-own. Legally, it's a rental, not a loan, so these companies usually don't have to show an APR the way a credit card does. About 6.7 million Americans used rent-to-own last year, and they're mostly families with lower incomes, the people who can least afford it. The lease companies even make browser extensions to push these offers at checkout. I built one that pushes back. It's called TrueRate."

### 0:40 – 1:20 · Main demo: the sofa
**Screen:** click sample store 1 (sofa). Wait for the offer box to load and the red banner to drop in.
**Say:**
> "Here's a checkout page. The lease offer loads a second after the page, like it does on real sites, and TrueRate catches it right away."

**Point at the big number:**
> "122 percent APR. In plain English: I'd pay fourteen hundred dollars extra, more than the sofa itself. That's over three times the 36 percent limit federal law sets for loans to military families."

**Point at the three boxes:**
> "It also shows me a better option. If I saved that same twenty-two dollars a week, I'd own the sofa in 41 weeks instead of 104."

**Open "Check the numbers":**
> "And it shows its work. Here are the numbers it read from the page, and here's exactly how it got 122 percent. If it reads something wrong, I can fix it and the math updates."
*(Change the payment to 15 so viewers see the number update, then change it back to 22.)*

### 1:20 – 1:55 · Other samples (show that it isn't hard-coded)
**Screen:** go back to the store list and open store 2, then 4, then 5. Spend about 10 seconds on each.
**Say:**
> "Stores write these offers in different ways. This laptop is fifty-nine ninety-nine every two weeks for twelve months. TrueRate turns twelve months into 26 payments and finds a 150 percent APR."

> "And TrueRate isn't against every payment plan. This bike is split into four payments with no interest, so TrueRate gives it a green light: fair deal."

> "Some stores hide the terms completely. TrueRate calls that out, because hidden terms are a warning sign, and lets you fill in the details yourself."

### 1:55 – 2:25 · How it works
**Screen:** `docs/how-it-works.png`, then a few seconds of `apr.js` in your code editor.
**Say:**
> "Here's how it works. First, it reads the offer from the page and handles weekly, every-two-weeks and monthly plans and fees due today. Then comes the hard part: the store shows the payment but never the rate, so TrueRate has to solve this equation for the rate. You can't rearrange it with algebra, so I used bisection: keep cutting the range of possible rates in half until it lands on the answer. I tested it on real loans with known rates, and it gets them right to within a hundredth of a percent. Everything runs on your own computer: no server, no tracking."

### 2:25 – 2:40 · Close
**Screen:** back to the red sofa banner, or the popup calculator.
**Say:**
> "Lease-to-own companies count on people not seeing this number. TrueRate puts it right in front of them, at the moment it matters, before they click buy. Thanks for watching."

---

## Recording tips
- **Practice out loud twice before recording**, and time yourself.
- If you make a mistake, pause for 2 seconds and say the sentence again, then cut the mistake when you edit.
- Talk a bit slower than feels normal. Judges watch many videos, so make yours easy to follow.
- Upload to YouTube as **Unlisted**, then paste the link into Devpost.
