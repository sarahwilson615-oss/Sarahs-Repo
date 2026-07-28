# Port Aransas Residential Market Report

Branded **residential-only** market report for Port Aransas. Upload MLS Active (+ Sold) CSVs and produce:

1. A one-pager (HTML → Print / Save as PDF)
2. Social graphics (square + story PNGs)
3. E-newsletter copy

Breaks out Single Family, Condo, Townhome, etc. from **Housing Type** (fallback: Condo Type).

## Quick start

1. Edit [`brand.json`](brand.json) and mirror in [`src/brand.js`](src/brand.js).
2. Open [`src/index.html`](src/index.html).
3. Upload residential Active + Sold, or click **Load July 27 data (inbox)**.
4. Download / print / copy outputs.

## Exports needed

| File | Required? |
|------|-----------|
| Residential Active | Yes |
| Residential Sold | For full stats (median sale, MOI) |
| Prior-year sold/active | Optional YoY |

See [`docs/mls-export.md`](docs/mls-export.md) and [`docs/categories.md`](docs/categories.md).

## Waiting on you

- New **Active** export that includes **Housing Type** (drop it here when ready)
- Optional: prior-year sold for YoY
- Final brand name / contact info in `brand.json`
