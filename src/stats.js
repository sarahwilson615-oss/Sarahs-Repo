/**
 * CSV parsing + Port Aransas residential market stats (with housing subtypes).
 */
(function (global) {
  const PRICE_BUCKETS = [
    { label: "$0 – $99,999", min: 0, max: 99999 },
    { label: "$100,000 – $199,999", min: 100000, max: 199999 },
    { label: "$200,000 – $299,999", min: 200000, max: 299999 },
    { label: "$300,000 – $399,999", min: 300000, max: 399999 },
    { label: "$400,000 – $499,999", min: 400000, max: 499999 },
    { label: "$500,000 – $749,999", min: 500000, max: 749999 },
    { label: "$750,000 – $999,999", min: 750000, max: 999999 },
    { label: "$1,000,000+", min: 1000000, max: Infinity },
  ];

  const SUBTYPE_ORDER = [
    "single_family",
    "condo_attached",
    "condo_detached",
    "condo",
    "townhome",
    "multi_family",
    "other",
  ];

  const SUBTYPE_LABELS = {
    single_family: "Single Family",
    condo_attached: "Condo — Attached",
    condo_detached: "Condo — Detached",
    condo: "Condo",
    townhome: "Townhome",
    multi_family: "Multi-Family",
    other: "Other Residential",
  };

  const ALIASES = {
    salePrice: ["sale price", "sold price", "close price", "selling price", "closed price"],
    listPrice: ["list price", "original list price", "listing price", "original price"],
    closeDate: ["close date", "sold date", "closing date", "closed date"],
    listDate: ["list date", "listing date", "on market date", "entry date"],
    dom: ["dom", "days on market", "cumulative dom", "cdom", "days on mls"],
    dtc: ["days to close", "dtc", "pending to close", "contract to close"],
    status: ["status", "listing status"],
    propertyType: ["property type", "housing type", "type", "property subtype"],
    condoType: ["condo type", "condo style"],
    city: ["city", "market area", "area", "city name"],
    address: ["address", "street address", "full address"],
    sqft: ["building sqft", "sqft", "living area", "sq ft", "approx sqft"],
    beds: ["# of bedrooms", "beds", "bedrooms", "bed"],
    baths: ["full baths", "baths", "bathrooms", "# of bathrooms"],
    subdivision: ["subdivision", "neighborhood", "complex", "condo name"],
    mlsNumber: ["mls number", "mls#", "listing id", "mls id", "listing number"],
  };

  function normalizeHeader(h) {
    return String(h || "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function parseMoney(value) {
    if (value == null || value === "") return null;
    const n = Number(String(value).replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function parseNumber(value) {
    if (value == null || value === "") return null;
    const n = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    const input = String(text).replace(/^\uFEFF/, "");

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const next = input[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          field += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        field += ch;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    if (!rows.length) return [];

    const headers = rows[0].map(normalizeHeader);
    const fieldIndex = {};
    for (const [key, aliases] of Object.entries(ALIASES)) {
      const idx = headers.findIndex((h) => aliases.includes(h));
      if (idx >= 0) fieldIndex[key] = idx;
    }

    // Matrix Agent Single Line: unnamed MLS# + Status columns
    if (fieldIndex.mlsNumber == null && headers.length > 2 && !headers[2]) {
      fieldIndex.mlsNumber = 2;
    }
    if (fieldIndex.status == null && headers.length > 3 && !headers[3]) {
      fieldIndex.status = 3;
    }

    return rows
      .slice(1)
      .filter((r) => r.some((c) => String(c).trim() !== ""))
      .map((r) => {
        const get = (key) => (fieldIndex[key] != null ? r[fieldIndex[key]] : "");
        const propertyType = String(get("propertyType") || "").trim();
        const condoType = String(get("condoType") || "").trim();
        return {
          mlsNumber: String(get("mlsNumber") || "").trim(),
          address: String(get("address") || "").trim(),
          city: String(get("city") || "").trim(),
          salePrice: parseMoney(get("salePrice")),
          listPrice: parseMoney(get("listPrice")),
          closeDate: String(get("closeDate") || "").trim(),
          listDate: String(get("listDate") || "").trim(),
          dom: parseNumber(get("dom")),
          dtc: parseNumber(get("dtc")),
          status: String(get("status") || "").trim(),
          propertyType,
          condoType,
          sqft: parseNumber(get("sqft")),
          beds: parseNumber(get("beds")),
          baths: parseNumber(get("baths")),
          subdivision: String(get("subdivision") || "").trim(),
          subtype: residentialSubtype({ propertyType, condoType }),
        };
      });
  }

  /**
   * Prefers Housing Type; falls back to Condo Type (Matrix).
   */
  function residentialSubtype(row) {
    const housing = (row.propertyType || "").toLowerCase();
    const condo = (row.condoType || "").toLowerCase();

    if (housing) {
      if (/town\s*-?\s*home|townhouse/.test(housing)) return "townhome";
      if (/multi|duplex|triplex|fourplex|2\s*-?\s*4|attach or/.test(housing)) {
        return "multi_family";
      }
      if (/condo|condominium/.test(housing)) {
        if (condo === "attached") return "condo_attached";
        if (condo === "detached") return "condo_detached";
        return "condo";
      }
      if (/^detached$|single\s*family|\bsfr\b|single family/.test(housing)) {
        return "single_family";
      }
      if (/detached/.test(housing) && !/condo/.test(housing)) return "single_family";
      // Known-but-uncommon residential types (don't collapse into SFH via blank Condo Type)
      return "other";
    }

    if (condo === "attached") return "condo_attached";
    if (condo === "detached") return "condo_detached";
    if (!condo) return "single_family";
    return "other";
  }

  function median(nums) {
    if (!nums.length) return null;
    const s = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function mean(nums) {
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  function pctChange(current, prior) {
    if (current == null || prior == null || prior === 0) return null;
    return ((current - prior) / Math.abs(prior)) * 100;
  }

  function priceDistribution(prices) {
    const total = prices.length || 1;
    return PRICE_BUCKETS.map((b) => {
      const count = prices.filter((p) => p >= b.min && p <= b.max).length;
      return { label: b.label, count, pct: (count / total) * 100 };
    });
  }

  function summarizeListings(rows, priceKey) {
    const list = rows || [];
    const prices = list.map((r) => r[priceKey]).filter((p) => p != null && p > 0);
    const doms = list.map((r) => r.dom).filter((d) => d != null && d >= 0);
    const dtcs = list.map((r) => r.dtc).filter((d) => d != null && d >= 0);
    return {
      count: list.length,
      medianPrice: median(prices),
      averagePrice: mean(prices),
      averageDom: mean(doms),
      averageDtc: mean(dtcs),
      priceDistribution: priceDistribution(prices),
    };
  }

  function buildSubtypeStats(activeRows, soldRows) {
    const keys = new Set([
      ...activeRows.map((r) => r.subtype),
      ...soldRows.map((r) => r.subtype),
    ]);
    const ordered = SUBTYPE_ORDER.filter((k) => keys.has(k));
    for (const k of keys) {
      if (!ordered.includes(k)) ordered.push(k);
    }
    return ordered.map((key) => {
      const active = activeRows.filter((r) => r.subtype === key);
      const sold = soldRows.filter((r) => r.subtype === key);
      return {
        key,
        label: SUBTYPE_LABELS[key] || key,
        active: summarizeListings(active, "listPrice"),
        sold: summarizeListings(sold, "salePrice"),
      };
    });
  }

  /**
   * @param {object} input
   * @param {object[]} input.activeCurrent
   * @param {object[]} [input.activePrior]
   * @param {object[]} [input.soldCurrent]
   * @param {object[]} [input.soldPrior]
   * @param {string} input.reportMonth
   * @param {string} input.priorMonth
   */
  function computeMarketStats(input) {
    const activeNow = input.activeCurrent || [];
    const activePrior = input.activePrior || [];
    const soldNow = input.soldCurrent || [];
    const soldPrior = input.soldPrior || [];

    const activeSummary = summarizeListings(activeNow, "listPrice");
    const activePriorSummary = summarizeListings(activePrior, "listPrice");
    const soldSummary = summarizeListings(soldNow, "salePrice");
    const soldPriorSummary = summarizeListings(soldPrior, "salePrice");
    const subtypes = buildSubtypeStats(activeNow, soldNow);

    const hasSold = soldSummary.count > 0;
    const avgDom = soldSummary.averageDom;
    const avgDtc = soldSummary.averageDtc;
    const totalCycle =
      avgDom != null && avgDtc != null ? avgDom + avgDtc : avgDom != null ? avgDom : null;
    const priorDom = soldPriorSummary.averageDom;
    const priorDtc = soldPriorSummary.averageDtc;
    const priorCycle =
      priorDom != null && priorDtc != null ? priorDom + priorDtc : priorDom != null ? priorDom : null;

    return {
      reportMonth: input.reportMonth || "",
      priorMonth: input.priorMonth || "",
      marketName: "Port Aransas",
      mode: hasSold ? "full" : "inventory",
      subtypes,
      medianSalePrice: soldSummary.medianPrice,
      medianSalePriceYoY: pctChange(soldSummary.medianPrice, soldPriorSummary.medianPrice),
      averageSalePrice: soldSummary.averagePrice,
      closedSales: soldSummary.count,
      closedSalesYoY: pctChange(soldSummary.count, soldPriorSummary.count),
      activeListings: activeSummary.count,
      activeListingsYoY: pctChange(activeSummary.count, activePriorSummary.count),
      medianListPrice: activeSummary.medianPrice,
      medianListPriceYoY: pctChange(activeSummary.medianPrice, activePriorSummary.medianPrice),
      priceDistribution: hasSold
        ? soldSummary.priceDistribution
        : activeSummary.priceDistribution,
      priceDistributionBasis: hasSold ? "closed sales" : "active list prices",
      daysOnMarket: avgDom,
      daysToClose: avgDtc,
      totalCycleDays: totalCycle,
      cycleDaysYoYDelta:
        totalCycle != null && priorCycle != null ? totalCycle - priorCycle : null,
      monthsOfInventory:
        soldSummary.count > 0 ? activeSummary.count / soldSummary.count : null,
      priorMonthsOfInventory:
        soldPriorSummary.count > 0
          ? activePriorSummary.count / soldPriorSummary.count
          : null,
      prior: {
        medianSalePrice: soldPriorSummary.medianPrice,
        closedSales: soldPriorSummary.count,
        activeListings: activePriorSummary.count,
        daysOnMarket: priorDom,
        daysToClose: priorDtc,
        totalCycleDays: priorCycle,
      },
    };
  }

  /** Back-compat alias used by older UI code paths. */
  function computeCategorizedStats(input) {
    return computeMarketStats({
      activeCurrent: input.residentialActive || input.activeCurrent || [],
      activePrior: input.residentialActivePrior || input.activePrior || [],
      soldCurrent: input.residentialSold || input.soldCurrent || [],
      soldPrior: input.residentialSoldPrior || input.soldPrior || [],
      reportMonth: input.reportMonth,
      priorMonth: input.priorMonth,
    });
  }

  function formatMoney(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  }

  function formatPct(n, digits = 1) {
    if (n == null || !Number.isFinite(n)) return "—";
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toFixed(digits)}%`;
  }

  function formatNumber(n, digits = 0) {
    if (n == null || !Number.isFinite(n)) return "—";
    return Number(n).toFixed(digits);
  }

  global.MarketStats = {
    PRICE_BUCKETS,
    SUBTYPE_LABELS,
    ALIASES,
    parseCsv,
    residentialSubtype,
    computeMarketStats,
    computeCategorizedStats,
    formatMoney,
    formatPct,
    formatNumber,
  };
})(typeof window !== "undefined" ? window : globalThis);
