# CSV Validation Status

## Known Extraction Error Patterns

When spot-checking CSVs, focus on these common issues:

1. **Column shift between receptive_language and expressive_language** — Values swapped or shifted by one column
2. **Value leaking into adjacent columns** — A value appears in a neighboring column where it should be `-`
3. **Age/row number confusion** — The row's age or raw_score value incorrectly appears in unrelated columns (especially adaptive_behavior)
4. **Sparse rows most error-prone** — Rows with many `-` values have more errors due to column alignment difficulty
5. **Rightmost columns most affected** — fine_motor and adaptive_behavior accumulate more errors from left-to-right drift

### Spot-check priorities
- Rows with many `-` values
- Transitions where values change to/from `-` or bounds (`<50`, `>150`)
- Last few rows of each table
- receptive_language, expressive_language, fine_motor, adaptive_behavior columns

## Validated
- [x] Table-A1-Raw-Scores-to-Age-Equivalents.csv
- [x] Table-B13-Raw-Scores-to-Standard-Scores-Age-12-13-Months.csv
- [x] Table-B14-Raw-Scores-to-Standard-Scores-Age-14-15-Months.csv *(fixed: social_emotional shift at raw_score 3-4)*
- [x] Table-B15-Raw-Scores-to-Standard-Scores-Age-16-18-Months.csv
- [x] Table-B16-Raw-Scores-to-Standard-Scores-Age-19-21-Months.csv *(note: PDF has >54 summary row, intentionally omitted)*
- [x] Table-B17-Raw-Scores-to-Standard-Scores-Age-22-24-Months.csv *(fixed: receptive_language missing >150 at raw_score 37; note: PDF has >59 summary row, intentionally omitted)*
- [x] Table-B18-Raw-Scores-to-Standard-Scores-Age-25-27-Months.csv *(fixed: social_emotional shift at raw_score 5; removed spurious >62 summary row)*
- [x] Table-B19-Raw-Scores-to-Standard-Scores-Age-28-30-Months.csv *(note: PDF has >66 summary row, intentionally omitted)*
- [x] Table-B20-Raw-Scores-to-Standard-Scores-Age-31-33-Months.csv
- [x] Table-B21-Raw-Scores-to-Standard-Scores-Age-34-36-Months.csv *(fixed: spurious social_emotional=134 at raw_score 64)*
- [x] Table-B22-Raw-Scores-to-Standard-Scores-Age-37-39-Months.csv *(fixed: 16 rows had spurious adaptive_behavior values at raw_score 65-80)*
- [x] Table-B23-Raw-Scores-to-Standard-Scores-Age-40-42-Months.csv *(note: PDF has >85 summary row, intentionally omitted)*
- [x] Table-B24-Raw-Scores-to-Standard-Scores-Age-43-45-Months.csv
- [x] Table-B25-Raw-Scores-to-Standard-Scores-Age-46-48-Months.csv
- [x] Table-B26-Raw-Scores-to-Standard-Scores-Age-49-53-Months.csv
- [x] Table-B27-Raw-Scores-to-Standard-Scores-Age-54-59-Months.csv
- [x] Table-B28-Raw-Scores-to-Standard-Scores-Age-60-65-Months.csv
- [x] Table-B29-Raw-Scores-to-Standard-Scores-Age-66-71-Months.csv
- [x] Table-C1-Standard-Scores-to-Percentile-Ranks.csv
- [x] Table-D1-Sums-of-Subdomain-Standard-Scores-to-Domain-Standard-Scores.csv
