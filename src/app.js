/**
 * Port Aransas Residential Market Report — UI
 */
(function () {
  const brand = Object.assign({}, globalThis.BrandConfig || {
    brokerageName: "Coldwell Banker Island Escapes",
    agentName: "Sarah Wilson",
    tagline: "Port Aransas Local Experts",
    phone: "",
    email: "",
    website: "https://www.cbporta.com",
    cta: "Thinking of buying or selling in Port Aransas? Let's talk island market strategy.",
    colors: {
      sand: "#F4F1EA",
      foam: "#FAF8F4",
      gulf: "#002F6C",
      tide: "#1A4A8A",
      coral: "#C45C26",
      ink: "#1A1F24",
      muted: "#5C6670",
    },
  });

  const logos = globalThis.BrandLogos || {};
  brand.logoHorizontal = logos.horizontalBlue || "";
  brand.logoVertical = logos.verticalBlue || "";

  applyBrandTheme(brand);

  const els = {
    reportMonth: document.getElementById("reportMonth"),
    priorMonth: document.getElementById("priorMonth"),
    resActive: document.getElementById("resActive"),
    resSold: document.getElementById("resSold"),
    resActivePrior: document.getElementById("resActivePrior"),
    resSoldPrior: document.getElementById("resSoldPrior"),
    runBtn: document.getElementById("runBtn"),
    sampleBtn: document.getElementById("sampleBtn"),
    inboxBtn: document.getElementById("inboxBtn"),
    status: document.getElementById("status"),
    results: document.getElementById("results"),
    preview: document.getElementById("reportPreview"),
    newsletterSubject: document.getElementById("newsletterSubject"),
    newsletterText: document.getElementById("newsletterText"),
    newsletterHtml: document.getElementById("newsletterHtml"),
    canvasSquare: document.getElementById("socialSquare"),
    canvasStory: document.getElementById("socialStory"),
    downloadReport: document.getElementById("downloadReport"),
    downloadSquare: document.getElementById("downloadSquare"),
    downloadStory: document.getElementById("downloadStory"),
    copyNewsletter: document.getElementById("copyNewsletter"),
    printReport: document.getElementById("printReport"),
    brandName: document.getElementById("brandName"),
  };

  els.brandName.textContent = brand.brokerageName;
  const headerLogo = document.getElementById("headerLogo");
  if (headerLogo && brand.logoHorizontal) {
    headerLogo.src = brand.logoHorizontal;
    headerLogo.hidden = false;
  }

  els.runBtn.addEventListener("click", () => runFromUploads());
  els.sampleBtn.addEventListener("click", () => runSample());
  els.inboxBtn.addEventListener("click", () => runInbox());
  els.downloadReport.addEventListener("click", downloadReportHtml);
  els.downloadSquare.addEventListener("click", () =>
    downloadCanvas(els.canvasSquare, "port-aransas-residential-square.png")
  );
  els.downloadStory.addEventListener("click", () =>
    downloadCanvas(els.canvasStory, "port-aransas-residential-story.png")
  );
  els.copyNewsletter.addEventListener("click", copyNewsletter);
  els.printReport.addEventListener("click", printReport);

  let lastReportHtml = "";
  let lastNewsletter = null;

  async function runFromUploads() {
    setStatus("Reading listings…", false);
    try {
      const activeCurrent = await requiredFile(els.resActive, "Residential active");
      const soldCurrent = await optionalFile(els.resSold);
      const payload = {
        activeCurrent,
        soldCurrent,
        activePrior: await optionalFile(els.resActivePrior),
        soldPrior: await optionalFile(els.resSoldPrior),
        reportMonth: els.reportMonth.value.trim() || "Current period",
        priorMonth: els.priorMonth.value.trim() || "—",
      };
      finish(MarketStats.computeMarketStats(payload));
    } catch (err) {
      console.error(err);
      setStatus(err.message || String(err), true);
    }
  }

  function runInbox() {
    setStatus("Loading July 27 inbox data…", false);
    try {
      const inbox = globalThis.InboxData;
      if (!inbox || !inbox.residential_active) {
        throw new Error("Inbox data not embedded.");
      }
      const payload = {
        activeCurrent: MarketStats.parseCsv(inbox.residential_active),
        soldCurrent: inbox.residential_sold
          ? MarketStats.parseCsv(inbox.residential_sold)
          : [],
        reportMonth: "Last 30 days (as of Jul 27, 2026)",
        priorMonth: "—",
      };
      els.reportMonth.value = payload.reportMonth;
      finish(MarketStats.computeMarketStats(payload));
    } catch (err) {
      console.error(err);
      setStatus(err.message || String(err), true);
    }
  }

  function runSample() {
    setStatus("Loading sample data…", false);
    try {
      const s = globalThis.SampleData;
      if (!s) throw new Error("Sample data missing.");
      const payload = {
        activeCurrent: MarketStats.parseCsv(s["active_2026-06"]),
        activePrior: MarketStats.parseCsv(s["active_2025-06"]),
        soldCurrent: MarketStats.parseCsv(s["sold_2026-06"]),
        soldPrior: MarketStats.parseCsv(s["sold_2025-06"]),
        reportMonth: "June 2026 (sample)",
        priorMonth: "June 2025",
      };
      els.reportMonth.value = payload.reportMonth;
      els.priorMonth.value = payload.priorMonth;
      finish(MarketStats.computeMarketStats(payload));
    } catch (err) {
      console.error(err);
      setStatus(err.message || String(err), true);
    }
  }

  async function finish(stats) {
    lastReportHtml = ReportOutputs.renderReportHtml(stats, brand);
    lastNewsletter = ReportOutputs.newsletterCopy(stats, brand);

    els.preview.srcdoc = lastReportHtml;
    els.newsletterSubject.value = lastNewsletter.subject;
    els.newsletterText.value = lastNewsletter.text;
    els.newsletterHtml.value = lastNewsletter.html;

    const logoImg = await ReportOutputs.loadLogo(brand.logoHorizontal);
    ReportOutputs.drawSocial(els.canvasSquare, stats, brand, "square", logoImg);
    ReportOutputs.drawSocial(els.canvasStory, stats, brand, "story", logoImg);

    els.results.hidden = false;
    setStatus(
      `Report ready — ${stats.activeListings} active` +
        (stats.mode === "full"
          ? `, ${stats.closedSales} sold, median ${MarketStats.formatMoney(stats.medianSalePrice)}`
          : `, median list ${MarketStats.formatMoney(stats.medianListPrice)}`) +
        ".",
      false
    );
    els.results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function requiredFile(input, label) {
    const file = input && input.files && input.files[0];
    if (!file) throw new Error(`Please choose a CSV for: ${label}`);
    const rows = MarketStats.parseCsv(await file.text());
    if (!rows.length) throw new Error(`${label} appears empty or could not be parsed.`);
    return rows;
  }

  async function optionalFile(input) {
    const file = input && input.files && input.files[0];
    if (!file) return [];
    return MarketStats.parseCsv(await file.text());
  }

  function setStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.classList.toggle("error", !!isError);
  }

  function downloadReportHtml() {
    if (!lastReportHtml) return;
    const blob = new Blob([lastReportHtml], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "port-aransas-residential-market-report.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadCanvas(canvas, filename) {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
  }

  async function copyNewsletter() {
    if (!lastNewsletter) return;
    await navigator.clipboard.writeText(lastNewsletter.text);
    setStatus("Newsletter text copied to clipboard.", false);
  }

  function printReport() {
    if (!lastReportHtml) return;
    const w = window.open("", "_blank");
    if (!w) {
      setStatus("Pop-up blocked — allow pop-ups to print/PDF the report.", true);
      return;
    }
    w.document.open();
    w.document.write(lastReportHtml);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  function applyBrandTheme(b) {
    const root = document.documentElement;
    if (!b.colors) return;
    root.style.setProperty("--sand", b.colors.sand);
    root.style.setProperty("--foam", b.colors.foam);
    root.style.setProperty("--gulf", b.colors.gulf);
    root.style.setProperty("--tide", b.colors.tide);
    root.style.setProperty("--coral", b.colors.coral);
    root.style.setProperty("--ink", b.colors.ink);
    root.style.setProperty("--muted", b.colors.muted);
  }
})();
