# DAYC-2 CSV Schema Specification

All CSVs are UTF-8, comma-separated, with a single header row.

CSV filenames mirror source PDF filenames (replacing `.pdf` with `.csv`).

## Value Conventions

- **All values stored as strings** exactly as printed in PDF
- **No numeric parsing** at extraction stage
- **Dash normalization**: All dash-like characters (–, —, ‑) normalized to ASCII hyphen-minus (`-`)
- **Whitespace**: Leading/trailing whitespace trimmed

### Value Types

| Pattern | Meaning | Examples |
|---------|---------|----------|
| Integer | Single score | `50`, `100`, `145` |
| Range | Score span | `0-4`, `10-12`, `100-101` |
| Less-than | Below threshold | `<1`, `<50`, `<0.1` |
| Greater-than | Above threshold | `>71`, `>150`, `>99.9` |
| Dash | Missing/not applicable | `-` |
| Empty | Cell doesn't exist in source | (empty string) |

---

## Table A1: Age Equivalents

**Source**: `Table-A1-Raw-Scores-to-Age-Equivalents.pdf` (2 pages)

**Output**: `Table-A1-Raw-Scores-to-Age-Equivalents.csv`

**Concept**: Maps age (in months) → raw score ranges per domain

### Columns

| Column | Description |
|--------|-------------|
| `age_months` | Age equivalent in months (e.g., `1`, `12`, `<1`, `>71`) |
| `cognitive` | Raw score or range for Cognitive domain |
| `communication` | Raw score or range for Communication domain |
| `receptive_language` | Raw score or range for Receptive Language |
| `expressive_language` | Raw score or range for Expressive Language |
| `social_emotional` | Raw score or range for Social-Emotional |
| `physical_development` | Raw score or range for Physical Development |
| `gross_motor` | Raw score or range for Gross Motor |
| `fine_motor` | Raw score or range for Fine Motor |
| `adaptive_behavior` | Raw score or range for Adaptive Behavior |

### Notes

- Rows from both pages merged into single file
- Duplicate header on page 2 excluded
- Age column appears twice in PDF (left and right) — use left column only

---

## Tables B13-B29: Raw Score to Standard Score

**Source**: 17 PDF files (`Table-B13-*.pdf` through `Table-B29-*.pdf`)

**Output**: 17 CSV files with matching names (e.g., `Table-B13-Raw-Scores-to-Standard-Scores-Age-12-13-Months.csv`)

**Concept**: Maps raw score → standard score for each domain

### Columns

| Column | Description |
|--------|-------------|
| `raw_score` | Raw score value (integer as string) |
| `cognitive` | Standard score for Cognitive |
| `receptive_language` | Standard score for Receptive Language |
| `expressive_language` | Standard score for Expressive Language |
| `social_emotional` | Standard score for Social-Emotional |
| `gross_motor` | Standard score for Gross Motor |
| `fine_motor` | Standard score for Fine Motor |
| `adaptive_behavior` | Standard score for Adaptive Behavior |

### Notes

- Age range is encoded in filename, not as a column
- Raw score column appears twice in PDF (left and right) — use left column only
- Values include integers, `<50`, `>150`, and `-`

---

## Table C1: Standard Score to Percentile Rank

**Source**: `Table-C1-Standard-Scores-to-Percentile-Ranks.pdf`

**Output**: `Table-C1-Standard-Scores-to-Percentile-Ranks.csv`

**Concept**: Maps standard score → percentile rank

### Columns

| Column | Description |
|--------|-------------|
| `standard_score_1` | Standard score (first column pair) |
| `percentile_rank_1` | Percentile rank (first column pair) |
| `standard_score_2` | Standard score (second column pair) |
| `percentile_rank_2` | Percentile rank (second column pair) |
| `standard_score_3` | Standard score (third column pair) |
| `percentile_rank_3` | Percentile rank (third column pair) |

### Notes

- Preserves visual 3-pair layout from PDF
- Makes visual verification easier
- Percentile values may include decimals (e.g., `0.1`, `99.9`)
- Bounds: `<0.1`, `>99.9`
- Empty cells at end of columns stored as empty strings

---

## Table D1: Sum of Subdomain Scores to Domain Standard Score

**Source**: `Table-D1-Sums-of-Subdomain-Standard-Scores-to-Domain-Standard-Scores.pdf`

**Output**: `Table-D1-Sums-of-Subdomain-Standard-Scores-to-Domain-Standard-Scores.csv`

**Concept**: Maps sum of subdomain standard scores (RL+EL or GM+FM) → domain standard score

### Columns

| Column | Description |
|--------|-------------|
| `sum_range_1` | Sum of subdomain scores (first column pair) |
| `standard_score_1` | Domain standard score (first column pair) |
| `sum_range_2` | Sum of subdomain scores (second column pair) |
| `standard_score_2` | Domain standard score (second column pair) |
| `sum_range_3` | Sum of subdomain scores (third column pair) |
| `standard_score_3` | Domain standard score (third column pair) |

### Notes

- Preserves visual 3-pair layout from PDF
- Sum ranges may be single values (`102`) or ranges (`100-101`)
- Empty cells at end of columns stored as empty strings

---

## Validation Checklist (Stage 2)

After extraction, validate:

- [ ] Column count matches schema
- [ ] No empty rows (except trailing)
- [ ] Value patterns match expected (integers, ranges, bounds, dashes)
- [ ] Monotonicity where expected (raw scores in B tables, standard scores in C1)
- [ ] Row counts reasonable (A1: ~70+, B tables: ~50+ each, C1: ~30+, D1: ~30+)
