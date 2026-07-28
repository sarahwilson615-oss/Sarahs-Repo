# MLS CSV Schema

Export **Port Aransas only** from your MLS. Column names are matched case-insensitively; common aliases are accepted.

## Sold / Closed listings

| Field | Accepted column names | Required |
|-------|----------------------|----------|
| Sale price | `Sale Price`, `Sold Price`, `Close Price`, `Selling Price` | Yes |
| List price | `List Price`, `Original List Price`, `Listing Price` | Preferred |
| Close date | `Close Date`, `Sold Date`, `Closing Date` | Preferred |
| List date | `List Date`, `Listing Date`, `On Market Date` | Optional |
| Days on market | `DOM`, `Days on Market`, `Cumulative DOM`, `CDOM` | Preferred |
| Days to close | `Days to Close`, `DTC`, `Pending to Close` | Optional |
| Status | `Status` | Optional |
| Property type | `Property Type`, `Housing Type`, `Type` | Optional |
| City / area | `City`, `Market Area`, `Area` | Optional |
| Address | `Address`, `Street Address` | Optional |
| Sq Ft | `Building SqFt`, `SqFt`, `Living Area` | Optional |
| Beds / baths | `# of Bedrooms`, `Beds`, `Full Baths`, `Baths` | Optional |
| Neighborhood | `Subdivision`, `Neighborhood`, `Complex` | Optional |

## Active listings

| Field | Accepted column names | Required |
|-------|----------------------|----------|
| List price | `List Price`, `Listing Price` | Yes |
| DOM | `DOM`, `Days on Market`, `Cumulative DOM` | Preferred |
| Status | `Status` (or Matrix unnamed status column) | Optional |
| Property type | `Property Type`, `Housing Type` | Preferred for Townhome labels |
| Condo type | `Condo Type` | Used for Residential subtypes when Housing Type is missing |
| City / area | `City`, `Market Area` | Optional |
| MLS # | `MLS Number` (or Matrix unnamed MLS column) | Optional |

## Matrix “Agent Single Line” notes

Your CCAR Matrix exports often look like:

- Column 2 (unnamed header) = MLS number  
- Column 3 (unnamed header) = Status (`A` = Active)  
- `Condo Type` = blank / Attached / Detached  

The parser maps those automatically. See [categories.md](categories.md).

## Property class

Export **Residential only** for Port Aransas / 78373. Lots and commercial are out of scope for this report.

## Tips

1. Include **Housing Type** on Active and Sold for clean Single Family / Condo / Townhome labels.
2. Sold exports need **Selling Price**.
3. Save as CSV (UTF-8).
4. Upload Active (required) + Sold (for full market stats) in `src/index.html`.
