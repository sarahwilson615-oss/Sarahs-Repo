/**
 * Branded one-pager, social graphics, and newsletter — residential Port Aransas.
 */
(function (global) {
  const { formatMoney, formatPct, formatNumber } = global.MarketStats;

  function yoYClass(n) {
    if (n == null || !Number.isFinite(n)) return "flat";
    if (n > 0) return "up";
    if (n < 0) return "down";
    return "flat";
  }

  function takeaways(stats) {
    const lines = [];
    const inventoryMode = stats.mode === "inventory";

    if (inventoryMode) {
      lines.push(
        `Port Aransas has ${stats.activeListings} active residential listings` +
          (stats.medianListPrice != null
            ? ` with a median list price of ${formatMoney(stats.medianListPrice)}.`
            : ".")
      );
      const parts = (stats.subtypes || [])
        .filter((s) => s.active.count > 0)
        .map((s) => `${s.active.count} ${s.label.toLowerCase()}`);
      if (parts.length) lines.push(`Inventory mix: ${parts.join(", ")}.`);
      return lines.slice(0, 4);
    }

    if (stats.medianSalePrice != null) {
      lines.push(
        `Median sale price landed at ${formatMoney(stats.medianSalePrice)}` +
          (stats.medianSalePriceYoY != null
            ? ` (${formatPct(stats.medianSalePriceYoY)} vs ${stats.priorMonth}).`
            : ".")
      );
    }
    if (stats.closedSales) {
      lines.push(
        `${stats.closedSales} homes closed in ${stats.reportMonth}` +
          (stats.closedSalesYoY != null ? `, ${formatPct(stats.closedSalesYoY)} YoY.` : ".")
      );
    }
    if (stats.subtypes && stats.subtypes.length) {
      const top = [...stats.subtypes].sort((a, b) => b.sold.count - a.sold.count)[0];
      if (top && top.sold.count > 0) {
        lines.push(
          `${top.label} led closings with ${top.sold.count} sales` +
            (top.sold.medianPrice != null
              ? ` (median ${formatMoney(top.sold.medianPrice)}).`
              : ".")
        );
      }
    }
    if (stats.monthsOfInventory != null) {
      lines.push(
        `About ${formatNumber(stats.monthsOfInventory, 1)} months of inventory` +
          (stats.monthsOfInventory >= 6
            ? " — buyers have negotiating room."
            : " — inventory remains relatively tight.")
      );
    }
    return lines.slice(0, 4);
  }

  function subtypeTableHtml(stats) {
    const rows = (stats.subtypes || [])
      .filter((s) => s.active.count > 0 || s.sold.count > 0)
      .map(
        (s) => `<tr>
        <td>${s.label}</td>
        <td class="num">${s.active.count}</td>
        <td class="num">${formatMoney(s.active.medianPrice)}</td>
        <td class="num">${s.sold.count || "—"}</td>
        <td class="num">${s.sold.count ? formatMoney(s.sold.medianPrice) : "—"}</td>
      </tr>`
      )
      .join("");
    if (!rows) return "";
    return `<section>
      <h2>By housing type</h2>
      <table class="subtypes">
        <thead>
          <tr>
            <th>Category</th>
            <th class="num">Active</th>
            <th class="num">Med. list</th>
            <th class="num">Sold</th>
            <th class="num">Med. sale</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  function renderReportHtml(stats, brand) {
    const distRows = (stats.priceDistribution || [])
      .map(
        (b) => `
      <div class="dist-row">
        <span class="dist-label">${b.label}</span>
        <div class="dist-bar-wrap"><div class="dist-bar" style="width:${Math.max(b.pct, 0)}%"></div></div>
        <span class="dist-pct">${formatNumber(b.pct, 1)}%</span>
      </div>`
      )
      .join("");

    const tips = takeaways(stats)
      .map((t) => `<li>${t}</li>`)
      .join("");

    const inventoryMode = stats.mode === "inventory";
    const timingBlock =
      !inventoryMode && (stats.daysOnMarket != null || stats.monthsOfInventory != null)
        ? `<section>
        <h2>Market timing</h2>
        <div class="timing">
          <div><span>Days on market</span><strong>${formatNumber(stats.daysOnMarket, 0)}</strong></div>
          <div><span>Days to close</span><strong>${formatNumber(stats.daysToClose, 0)}</strong></div>
          <div><span>Total cycle</span><strong>${formatNumber(stats.totalCycleDays, 0)}</strong></div>
          <div><span>Months of inventory</span><strong>${formatNumber(stats.monthsOfInventory, 1)}</strong></div>
        </div>
      </section>`
        : `<section>
        <h2>How to read this report</h2>
        <p class="note" style="margin:0;line-height:1.45;">Housing types prefer MLS <em>Housing Type</em> (Single Family, Condo, Townhome). If missing, <em>Condo Type</em> is used (blank → Single Family; Attached/Detached → condo styles). Add a sold export for median sale price, DOM, and months of inventory.</p>
      </section>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Port Aransas Residential Market Report — ${stats.reportMonth}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --sand: ${brand.colors.sand};
    --foam: ${brand.colors.foam};
    --gulf: ${brand.colors.gulf};
    --tide: ${brand.colors.tide};
    --coral: ${brand.colors.coral};
    --ink: ${brand.colors.ink};
    --muted: ${brand.colors.muted};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; color: var(--ink);
    font-family: "Source Sans 3", system-ui, sans-serif;
    background:
      radial-gradient(1200px 600px at 10% -10%, #cfe8f2 0%, transparent 55%),
      radial-gradient(900px 500px at 100% 0%, #f0e0c8 0%, transparent 50%),
      linear-gradient(180deg, var(--foam), #eef4f7 60%, var(--sand));
  }
  .page { max-width: 920px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
  .mast {
    display: grid; gap: 0.35rem; margin-bottom: 1.5rem; padding-bottom: 1.1rem;
    border-bottom: 2px solid color-mix(in srgb, var(--gulf) 25%, transparent);
  }
  .brand {
    font-family: Fraunces, Georgia, serif; font-size: clamp(1.9rem, 4.5vw, 2.6rem);
    font-weight: 700; color: var(--gulf); letter-spacing: -0.02em; line-height: 1.05;
  }
  .brand-logo {
    display: block;
    width: min(420px, 100%);
    height: auto;
    margin: 0 0 0.85rem;
  }
  .brand-logo.sr-fallback { display: none; }
  .tagline { color: var(--tide); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; font-size: 0.78rem; }
  h1 { font-family: Fraunces, Georgia, serif; font-weight: 500; font-size: clamp(1.25rem, 3vw, 1.65rem); margin: 0.35rem 0 0; }
  .sub { color: var(--muted); margin: 0; }
  .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; margin: 1.25rem 0; }
  .stat {
    background: color-mix(in srgb, white 80%, var(--foam));
    border: 1px solid color-mix(in srgb, var(--gulf) 12%, transparent);
    padding: 0.9rem 1rem;
  }
  .stat .label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  .stat .value { font-family: Fraunces, Georgia, serif; font-size: 1.65rem; color: var(--gulf); margin-top: 0.2rem; }
  .stat .delta { font-size: 0.85rem; font-weight: 600; margin-top: 0.15rem; }
  .delta.up { color: #1f7a4c; } .delta.down { color: var(--coral); } .delta.flat { color: var(--muted); }
  .grid-2 { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 1rem; margin-top: 0.25rem; }
  section {
    background: color-mix(in srgb, white 85%, transparent);
    border: 1px solid color-mix(in srgb, var(--gulf) 10%, transparent);
    padding: 1rem 1.1rem 1.15rem; margin-top: 1rem;
  }
  section h2 { font-family: Fraunces, Georgia, serif; font-size: 1.1rem; margin: 0 0 0.75rem; color: var(--gulf); }
  table.subtypes { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  table.subtypes th, table.subtypes td { padding: 0.4rem 0.35rem; border-bottom: 1px solid #e2e8ee; text-align: left; }
  table.subtypes th { color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
  table.subtypes .num, table.subtypes th.num { text-align: right; }
  .dist-row { display: grid; grid-template-columns: 9.5rem 1fr 3rem; gap: 0.5rem; align-items: center; margin-bottom: 0.35rem; font-size: 0.84rem; }
  .dist-bar-wrap { background: #e4ecf1; height: 0.5rem; overflow: hidden; }
  .dist-bar { height: 100%; background: linear-gradient(90deg, var(--tide), var(--gulf)); }
  .dist-pct { text-align: right; font-weight: 600; color: var(--gulf); }
  .timing { display: grid; gap: 0.55rem; }
  .timing div { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px dashed #d5dee5; padding-bottom: 0.4rem; }
  .timing strong { color: var(--gulf); font-family: Fraunces, Georgia, serif; font-size: 1.1rem; }
  .takeaways ul { margin: 0; padding-left: 1.1rem; }
  .takeaways li { margin-bottom: 0.4rem; }
  .cta { margin-top: 1.35rem; padding: 1rem 1.15rem; background: var(--gulf); color: white; }
  .cta a { color: #d7eef8; }
  .cta-team { display: grid; gap: 0.65rem; margin-top: 0.85rem; }
  .cta-person strong { font-family: Fraunces, Georgia, serif; font-size: 1.1rem; display: block; margin-bottom: 0.15rem; }
  .cta-web { margin-top: 0.85rem; font-size: 0.95rem; }
  .foot { margin-top: 0.9rem; font-size: 0.72rem; color: var(--muted); }
  .note { font-size: 0.82rem; color: var(--muted); margin: 0.35rem 0 0; }
  @media (max-width: 720px) {
    .hero-stats, .grid-2 { grid-template-columns: 1fr; }
    .dist-row { grid-template-columns: 1fr; gap: 0.15rem; }
  }
  @media print {
    body { background: white; }
    .page { padding: 0; max-width: none; }
    .stat, section, .cta { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="page">
    <header class="mast">
      ${
        brand.logoHorizontal
          ? `<img class="brand-logo" src="${brand.logoHorizontal}" alt="${brand.brokerageName}" />`
          : `<div class="brand">${brand.brokerageName}</div>`
      }
      <div class="tagline">${brand.tagline}</div>
      <h1>Port Aransas Residential Market Report</h1>
      <p class="sub">${stats.reportMonth}${stats.priorMonth && stats.priorMonth !== "—" ? ` · Compared to ${stats.priorMonth}` : ""}</p>
    </header>

    <div class="hero-stats">
      <div class="stat">
        <div class="label">${inventoryMode ? "Median list price" : "Median sale price"}</div>
        <div class="value">${formatMoney(inventoryMode ? stats.medianListPrice : stats.medianSalePrice)}</div>
        <div class="delta ${yoYClass(inventoryMode ? stats.medianListPriceYoY : stats.medianSalePriceYoY)}">${formatPct(inventoryMode ? stats.medianListPriceYoY : stats.medianSalePriceYoY)} YoY</div>
      </div>
      <div class="stat">
        <div class="label">${inventoryMode ? "Active listings" : "Closed sales"}</div>
        <div class="value">${inventoryMode ? stats.activeListings : stats.closedSales}</div>
        <div class="delta ${yoYClass(inventoryMode ? stats.activeListingsYoY : stats.closedSalesYoY)}">${formatPct(inventoryMode ? stats.activeListingsYoY : stats.closedSalesYoY)} YoY</div>
      </div>
      <div class="stat">
        <div class="label">${inventoryMode ? "Housing types" : "Active listings"}</div>
        <div class="value">${inventoryMode ? (stats.subtypes || []).filter((s) => s.active.count > 0).length : stats.activeListings}</div>
        <div class="delta flat">${inventoryMode ? "In this inventory mix" : formatPct(stats.activeListingsYoY) + " YoY · MOI " + formatNumber(stats.monthsOfInventory, 1)}</div>
      </div>
    </div>

    ${subtypeTableHtml(stats)}

    <div class="grid-2">
      <section>
        <h2>Price distribution (${stats.priceDistributionBasis})</h2>
        ${distRows}
      </section>
      ${timingBlock}
    </div>

    <section class="takeaways">
      <h2>Local expert takeaways</h2>
      <ul>${tips}</ul>
    </section>

    <div class="cta">
      ${brand.cta}
      <div class="cta-team">
        ${(brand.team && brand.team.length
          ? brand.team
          : [{ name: brand.agentName, phone: brand.phone, email: brand.email }]
        )
          .map(
            (p) => `<div class="cta-person">
          <strong>${p.name}</strong>
          ${[p.phone, p.email ? `<a href="mailto:${p.email}">${p.email}</a>` : ""]
            .filter(Boolean)
            .join(" · ")}
        </div>`
          )
          .join("")}
      </div>
      ${
        brand.website
          ? `<div class="cta-web"><a href="${brand.website}">${brand.website.replace(/^https?:\/\//, "")}</a></div>`
          : ""
      }
    </div>
    <p class="foot">Aggregate Port Aransas residential statistics only. Not an appraisal. Confirm MLS marketing rules with your brokerage before publishing.</p>
  </div>
</body>
</html>`;
  }

  function newsletterCopy(stats, brand) {
    const tips = takeaways(stats);
    const subject =
      stats.mode === "inventory"
        ? `Port Aransas Residential Inventory — ${stats.reportMonth}`
        : `Port Aransas Residential Market Update — ${stats.reportMonth}`;

    const subtypeLines = (stats.subtypes || [])
      .filter((s) => s.active.count > 0 || s.sold.count > 0)
      .map((s) => {
        const soldBit = s.sold.count
          ? ` · ${s.sold.count} sold (med ${formatMoney(s.sold.medianPrice)})`
          : "";
        return `• ${s.label}: ${s.active.count} active (med list ${formatMoney(s.active.medianPrice)})${soldBit}`;
      });

    const text = [
      subject,
      "",
      `From ${brand.brokerageName} · ${brand.tagline}`,
      "",
      stats.mode === "full"
        ? `Median sale: ${formatMoney(stats.medianSalePrice)} (${formatPct(stats.medianSalePriceYoY)} YoY)`
        : `Median list: ${formatMoney(stats.medianListPrice)}`,
      `Active: ${stats.activeListings}` +
        (stats.mode === "full"
          ? ` · Closed: ${stats.closedSales} · MOI: ${formatNumber(stats.monthsOfInventory, 1)}`
          : ""),
      "",
      "By housing type:",
      ...subtypeLines,
      "",
      "Highlights:",
      ...tips.map((t) => `• ${t}`),
      "",
      brand.cta,
      "",
      ...(brand.team && brand.team.length
        ? brand.team.map((p) => `${p.name} · ${p.phone} · ${p.email}`)
        : [`${brand.agentName} · ${brand.phone} · ${brand.email}`]),
      brand.website || "",
    ].join("\n");

    const teamHtml = (brand.team && brand.team.length
      ? brand.team
      : [{ name: brand.agentName, phone: brand.phone, email: brand.email }]
    )
      .map(
        (p) =>
          `<p style="margin:0 0 8px;color:#002F6C;"><strong>${p.name}</strong><br/>${p.phone} · <a href="mailto:${p.email}">${p.email}</a></p>`
      )
      .join("");

    const html = `
<div style="font-family:Georgia,serif;color:#1A1F24;max-width:560px;line-height:1.5;">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#1A4A8A;">${brand.tagline}</p>
  <h1 style="margin:0 0 8px;font-size:26px;color:#002F6C;">Port Aransas Residential Market</h1>
  <p style="margin:0 0 16px;color:#5C6670;">${stats.reportMonth}</p>
  <p style="margin:0 0 8px;"><strong>${stats.mode === "full" ? "Median sale" : "Median list"}:</strong> ${formatMoney(stats.mode === "full" ? stats.medianSalePrice : stats.medianListPrice)}</p>
  <p style="margin:0 0 16px;"><strong>Active:</strong> ${stats.activeListings}${stats.mode === "full" ? ` · <strong>Closed:</strong> ${stats.closedSales}` : ""}</p>
  <p style="margin:0 0 6px;"><strong>By housing type</strong></p>
  <ul style="padding-left:18px;margin:0 0 16px;">
    ${subtypeLines.map((l) => `<li style="margin-bottom:6px;">${l.replace(/^• /, "")}</li>`).join("")}
  </ul>
  <ul style="padding-left:18px;margin:0 0 16px;">
    ${tips.map((t) => `<li style="margin-bottom:6px;">${t}</li>`).join("")}
  </ul>
  <p style="margin:0 0 12px;">${brand.cta}</p>
  ${teamHtml}
  ${brand.website ? `<p style="margin:8px 0 0;"><a href="${brand.website}">${brand.website.replace(/^https?:\/\//, "")}</a></p>` : ""}
</div>`.trim();

    return { subject, text, html };
  }

  function drawSocial(canvas, stats, brand, variant, logoImg) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const isStory = variant === "story";
    const pad = isStory ? 56 : 48;
    const colors = brand.colors;

    // Coastal sky → gulf wash
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#7EB8D4");
    sky.addColorStop(0.28, "#3A7CA5");
    sky.addColorStop(0.55, colors.gulf || "#002F6C");
    sky.addColorStop(1, "#001532");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Soft sun glow
    const sun = ctx.createRadialGradient(w * 0.85, h * 0.08, 10, w * 0.85, h * 0.08, w * 0.45);
    sun.addColorStop(0, "rgba(255,236,200,0.45)");
    sun.addColorStop(1, "rgba(255,236,200,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);

    drawWaveLayer(ctx, w, h, h * (isStory ? 0.72 : 0.68), "rgba(255,255,255,0.10)", 18, 0);
    drawWaveLayer(ctx, w, h, h * (isStory ? 0.76 : 0.74), "rgba(244,241,234,0.14)", 14, 40);
    drawWaveLayer(ctx, w, h, h * (isStory ? 0.82 : 0.82), "rgba(0,47,108,0.35)", 22, 80);

    // Sand shoreline
    const sandGrad = ctx.createLinearGradient(0, h * 0.88, 0, h);
    sandGrad.addColorStop(0, "rgba(244,241,234,0)");
    sandGrad.addColorStop(0.35, "rgba(244,241,234,0.92)");
    sandGrad.addColorStop(1, "#E8DCC8");
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, h * 0.86, w, h * 0.14);

    let y = pad;
    if (logoImg && logoImg.complete && logoImg.naturalWidth) {
      const maxLogoW = isStory ? w * 0.62 : w * 0.58;
      const maxLogoH = isStory ? 78 : 64;
      const scale = Math.min(maxLogoW / logoImg.naturalWidth, maxLogoH / logoImg.naturalHeight);
      const lw = logoImg.naturalWidth * scale;
      const lh = logoImg.naturalHeight * scale;
      const cardPadX = 22;
      const cardPadY = 16;
      roundRect(ctx, pad, y, lw + cardPadX * 2, lh + cardPadY * 2, 14);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
      ctx.drawImage(logoImg, pad + cardPadX, y + cardPadY, lw, lh);
      y += lh + cardPadY * 2 + (isStory ? 36 : 28);
    } else {
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${isStory ? 24 : 20}px "Source Sans 3", system-ui, sans-serif`;
      ctx.fillText(brand.brokerageName, pad, y + 24);
      y += isStory ? 56 : 44;
    }

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `700 ${isStory ? 22 : 18}px "Source Sans 3", system-ui, sans-serif`;
    fillUpper(ctx, "PORT ARANSAS SNAPSHOT", pad, y);
    y += isStory ? 28 : 22;

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${isStory ? 72 : 56}px Fraunces, Georgia, serif`;
    ctx.fillText(isStory ? "Island" : "Island living,", pad, y + (isStory ? 70 : 54));
    y += isStory ? 78 : 58;
    ctx.font = `500 ${isStory ? 64 : 48}px Fraunces, Georgia, serif`;
    ctx.fillText(isStory ? "market check" : "decoded.", pad, y + (isStory ? 62 : 46));
    y += isStory ? 78 : 56;

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `600 ${isStory ? 24 : 20}px "Source Sans 3", system-ui, sans-serif`;
    ctx.fillText(stats.reportMonth, pad, y);
    y += isStory ? 48 : 36;

    const priceLabel = stats.mode === "full" ? "Median sale price" : "Median list price";
    const priceValue = formatMoney(
      stats.mode === "full" ? stats.medianSalePrice : stats.medianListPrice
    );
    const yoy = stats.mode === "full" ? stats.medianSalePriceYoY : stats.medianListPriceYoY;

    const heroH = isStory ? 210 : 168;
    drawGlassCard(ctx, pad, y, w - pad * 2, heroH);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `700 ${isStory ? 20 : 17}px "Source Sans 3", system-ui, sans-serif`;
    fillUpper(ctx, priceLabel, pad + 32, y + (isStory ? 42 : 36));
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${isStory ? 84 : 68}px Fraunces, Georgia, serif`;
    ctx.fillText(priceValue, pad + 32, y + (isStory ? 125 : 100));
    ctx.fillStyle = yoy != null && yoy < 0 ? "#F6C6A8" : "#B8F0D0";
    ctx.font = `700 ${isStory ? 26 : 22}px "Source Sans 3", system-ui, sans-serif`;
    const yoyText =
      yoy == null || !Number.isFinite(yoy)
        ? "Your local island read"
        : `${formatPct(yoy)} vs last year`;
    ctx.fillText(yoyText, pad + 32, y + heroH - (isStory ? 36 : 28));
    y += heroH + (isStory ? 28 : 22);

    const closed = stats.mode === "full" ? stats.closedSales : null;
    const tiles = [
      { label: "Active homes", value: String(stats.activeListings), hint: "on the market" },
      {
        label: closed != null ? "Just sold" : "Housing types",
        value:
          closed != null
            ? String(closed)
            : String((stats.subtypes || []).filter((s) => s.active.count > 0).length),
        hint: closed != null ? "in this window" : "in the mix",
      },
      {
        label: "Inventory",
        value: stats.monthsOfInventory != null ? formatNumber(stats.monthsOfInventory, 1) : "—",
        hint: "months of supply",
      },
    ];
    const gap = 14;
    const tileW = (w - pad * 2 - gap * 2) / 3;
    const tileH = isStory ? 150 : 126;
    tiles.forEach((t, i) => {
      const x = pad + i * (tileW + gap);
      drawGlassCard(ctx, x, y, tileW, tileH);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `700 ${isStory ? 15 : 13}px "Source Sans 3", system-ui, sans-serif`;
      fillUpper(ctx, t.label, x + 16, y + 28);
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${isStory ? 48 : 40}px Fraunces, Georgia, serif`;
      ctx.fillText(t.value, x + 16, y + (isStory ? 88 : 74));
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = `600 ${isStory ? 16 : 14}px "Source Sans 3", system-ui, sans-serif`;
      ctx.fillText(t.hint, x + 16, y + tileH - 22);
    });
    y += tileH + (isStory ? 32 : 24);

    const mix = (stats.subtypes || []).filter((s) => s.active.count > 0);
    const mixTotal = mix.reduce((a, s) => a + s.active.count, 0) || 1;
    const palette = ["#F4F1EA", "#7EB8D4", "#F0A76E", "#B8D4C8", "#C9B8E0", "#E8D4B8"];

    if (mix.length && y + 110 < h - pad) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `700 ${isStory ? 20 : 16}px "Source Sans 3", system-ui, sans-serif`;
      fillUpper(ctx, "What's listed right now", pad, y);
      y += isStory ? 28 : 22;

      const barH = isStory ? 28 : 22;
      let bx = pad;
      const barW = w - pad * 2;
      roundRect(ctx, pad, y, barW, barH, 8);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();
      mix.forEach((s, i) => {
        const sw = (s.active.count / mixTotal) * barW;
        if (sw < 1) return;
        ctx.fillStyle = palette[i % palette.length];
        ctx.fillRect(bx, y, sw + 0.5, barH);
        bx += sw;
      });
      // re-clip rounded ends
      ctx.save();
      roundRect(ctx, pad, y, barW, barH, 8);
      ctx.clip();
      bx = pad;
      mix.forEach((s, i) => {
        const sw = (s.active.count / mixTotal) * barW;
        ctx.fillStyle = palette[i % palette.length];
        ctx.fillRect(bx, y, sw + 0.5, barH);
        bx += sw;
      });
      ctx.restore();
      y += barH + (isStory ? 26 : 18);

      mix.slice(0, isStory ? 5 : 4).forEach((s, i) => {
        const pct = Math.round((s.active.count / mixTotal) * 100);
        ctx.fillStyle = palette[i % palette.length];
        roundRect(ctx, pad, y - 10, 14, 14, 3);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `600 ${isStory ? 20 : 17}px "Source Sans 3", system-ui, sans-serif`;
        ctx.fillText(`${s.label}  ${s.active.count}  ·  ${pct}%`, pad + 24, y + 2);
        y += isStory ? 32 : 26;
      });
    }

    ctx.fillStyle = colors.gulf || "#002F6C";
    ctx.font = `700 ${isStory ? 22 : 18}px "Source Sans 3", system-ui, sans-serif`;
    ctx.fillText(brand.tagline, pad, h - pad + 4);
    ctx.font = `600 ${isStory ? 18 : 15}px "Source Sans 3", system-ui, sans-serif`;
    ctx.fillStyle = colors.tide || "#1A4A8A";
    const site = (brand.website || "").replace(/^https?:\/\//, "");
    if (site) ctx.fillText(site, pad, h - pad + (isStory ? 32 : 26));
  }

  function drawWaveLayer(ctx, w, h, baseY, color, amp, phase) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);
    for (let x = 0; x <= w; x += 8) {
      const yy =
        baseY +
        Math.sin((x + phase) / 70) * amp +
        Math.sin((x + phase) / 33) * (amp * 0.35);
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawGlassCard(ctx, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 18);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fillUpper(ctx, text, x, y) {
    ctx.fillText(String(text).toUpperCase(), x, y);
  }

  function loadLogo(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  global.ReportOutputs = {
    renderReportHtml,
    newsletterCopy,
    drawSocial,
    loadLogo,
    takeaways,
  };
})(typeof window !== "undefined" ? window : globalThis);
