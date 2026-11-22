// Manual calculator in the toolbar popup. Uses the same math engine as the banner.
const ids = ["price", "payment", "frequency", "count", "upfront"];
const out = document.getElementById("out");

function update() {
  const v = Object.fromEntries(ids.map((id) => [id, document.getElementById(id).value]));
  const a = TrueRate.analyze(v);
  const { money, pct } = TrueRate;
  if (!a) {
    out.style.setProperty("--c", "#4a3838");
    out.innerHTML = `<div class="empty">Fill in every box to see the real rate.</div>`;
    return;
  }
  out.style.setProperty("--c", a.verdict.color);
  out.innerHTML = `
    <div class="lvl">${a.verdict.title}</div>
    <div class="inner">
      <div class="rate">${pct(a.apr)} APR</div>
      <div class="plain">${TrueRate.plainEnglish(a)}</div>
      <div class="row"><span>You pay in total</span><b>${money(a.totalPaid)}</b></div>
      <div class="row"><span>Extra over the price</span><b>${money(a.extraCost)}</b></div>
      ${a.extraCost > 0 ? `<div class="row"><span>Save up instead, own it in</span><b class="good">${a.periodsToSave} ${a.periodPlural}</b></div>` : ""}
    </div>`;
}

ids.forEach((id) => document.getElementById(id).addEventListener("input", update));
update();
