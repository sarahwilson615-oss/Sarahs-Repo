# Residential housing types

This report is **Port Aransas residential only** (no lots or commercial).

## Categories (from MLS)

| Priority | MLS field | Values → report label |
|----------|-----------|------------------------|
| 1st | **Housing Type** | Detached / Single Family → Single Family; Condo → Condo (Attached/Detached if Condo Type set); Townhome → Townhome |
| 2nd | **Condo Type** (fallback) | blank → Single Family; Attached → Condo — Attached; Detached → Condo — Detached |

Include **Housing Type** on both Active and Sold exports for the cleanest breakdown.
