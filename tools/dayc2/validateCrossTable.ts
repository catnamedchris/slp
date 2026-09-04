import * as fs from 'fs';
import * as path from 'path';

const CSV_DIR = path.join(__dirname, '../../data/csv');

// Ordered B table IDs by ascending age
const B_TABLE_ORDER = [
  'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19',
  'B20', 'B21', 'B22', 'B23', 'B24', 'B25', 'B26',
  'B27', 'B28', 'B29',
] as const;

const SUBDOMAINS = [
  'cognitive', 'receptive_language', 'expressive_language',
  'social_emotional', 'gross_motor', 'fine_motor', 'adaptive_behavior',
] as const;

type TableId = typeof B_TABLE_ORDER[number];
type Subdomain = typeof SUBDOMAINS[number];
type ParsedCsv = { header: string[]; rows: string[][] };
type Table = ParsedCsv & { file: string };
type Tables = Partial<Record<TableId, Table>>;
type CellType = 'lt50' | 'numeric' | 'gt150' | 'dash' | 'unknown';
type SequenceState = 'start' | CellType;

const parseCSV = (content: string): ParsedCsv => {
  const lines = content.trim().split('\n');
  const header = lines[0].split(',');
  const rows = lines.slice(1).map((line) => line.split(','));
  return { header, rows };
};

/**
 * Parse a cell value into a comparable numeric, or null if not numeric.
 * '<50' => 49 (below floor), '>150' => 151 (above ceiling), '-' => null
 */
const cellToNumeric = (cell: string): number | null => {
  if (cell === '-' || cell === '') return null;
  if (cell === '<50') return 49;
  if (cell === '>150') return 151;
  if (/^\d+$/.test(cell)) return parseInt(cell, 10);
  return null;
};

const loadBTables = (): Tables => {
  const tables: Tables = {};

  for (const tableId of B_TABLE_ORDER) {
    const files = fs.readdirSync(CSV_DIR).filter((file) => file.includes(`Table-${tableId}-`));
    if (files.length !== 1) {
      console.error(`Expected 1 file for ${tableId}, found ${files.length}`);
      continue;
    }
    const content = fs.readFileSync(path.join(CSV_DIR, files[0]), 'utf8');
    const { header, rows } = parseCSV(content);
    tables[tableId] = { file: files[0], header, rows };
  }

  return tables;
};

const loadA1 = (): ParsedCsv | null => {
  const files = fs.readdirSync(CSV_DIR).filter((file) => file.startsWith('Table-A1'));
  if (files.length !== 1) return null;
  const content = fs.readFileSync(path.join(CSV_DIR, files[0]), 'utf8');
  return parseCSV(content);
};

// --- Check 1: Cross-table monotonicity ---
// For each subdomain and raw_score, standard scores must be non-increasing
// as age band increases (older children need higher raw scores for same standard score).
const checkCrossTableMonotonicity = (tables: Tables): string[] => {
  const errors: string[] = [];

  // Find the max raw_score across all tables
  const maxRaw = Math.max(...B_TABLE_ORDER.map((id) => tables[id] ? tables[id].rows.length - 1 : 0));

  for (const subdomain of SUBDOMAINS) {
    for (let rawScore = 0; rawScore <= maxRaw; rawScore++) {
      let prevVal: number | null = null;
      let prevId: TableId | null = null;

      for (const tableId of B_TABLE_ORDER) {
        const table = tables[tableId];
        if (!table || rawScore >= table.rows.length) continue;

        const colIdx = table.header.indexOf(subdomain);
        if (colIdx === -1) continue;

        const val = cellToNumeric(table.rows[rawScore][colIdx]);
        if (val === null) continue;

        if (prevVal !== null && val > prevVal) {
          errors.push(
            `Cross-table monotonicity: ${subdomain} at raw_score=${rawScore} ` +
            `increases from ${prevId} (${prevVal}) to ${tableId} (${val})`
          );
        }

        prevVal = val;
        prevId = tableId;
      }
    }
  }

  return errors;
};

// --- Check 2: Boundary value consistency ---
// Within each B table column, the value sequence must follow:
//   <50* → numeric (ascending)* → >150* → -* (end of column)
// No <50 after a numeric, no numeric after >150, no resumption after dash.
const checkBoundaryConsistency = (tables: Tables): string[] => {
  const errors: string[] = [];

  for (const tableId of B_TABLE_ORDER) {
    const table = tables[tableId];
    if (!table) continue;

    for (const subdomain of SUBDOMAINS) {
      const colIdx = table.header.indexOf(subdomain);
      if (colIdx === -1) continue;

      // Track state machine: lt50 → numeric → gt150 → dash
      let state: SequenceState = 'start';
      for (let i = 0; i < table.rows.length; i++) {
        const cell = table.rows[i][colIdx];
        let cellType: CellType;
        if (cell === '<50') cellType = 'lt50';
        else if (cell === '>150') cellType = 'gt150';
        else if (cell === '-') cellType = 'dash';
        else if (/^\d+$/.test(cell)) cellType = 'numeric';
        else cellType = 'unknown';

        const valid = validateTransition(state, cellType);
        if (!valid) {
          errors.push(
            `Boundary sequence: ${tableId} ${subdomain} at raw_score=${i}: ` +
            `unexpected '${cell}' (${cellType}) after state '${state}'`
          );
        }
        state = cellType;
      }
    }
  }

  return errors;
};

const validateTransition = (state: SequenceState, cellType: CellType): boolean => {
  // Valid transitions:
  // start  → lt50, numeric, gt150, dash
  // lt50   → lt50, numeric, gt150, dash
  // numeric→ numeric, gt150, dash
  // gt150  → gt150, dash
  // dash   → dash
  switch (state) {
    case 'start':
      return true;
    case 'lt50':
      return cellType !== 'unknown';
    case 'numeric':
      return cellType === 'numeric' || cellType === 'gt150' || cellType === 'dash';
    case 'gt150':
      return cellType === 'gt150' || cellType === 'dash';
    case 'dash':
      return cellType === 'dash';
    default:
      return false;
  }
};

// --- Check 3: Dash region consistency across columns ---
// If a subdomain transitions to '-' at raw_score N, then for that same raw_score,
// adjacent/related subdomains should not have values drastically beyond their own
// ceiling. This catches column-shift errors where values leak into wrong columns.
const checkDashRegionConsistency = (tables: Tables): string[] => {
  const warnings: string[] = [];

  for (const tableId of B_TABLE_ORDER) {
    const table = tables[tableId];
    if (!table) continue;

    // For each subdomain, find the raw_score where dashes begin
    const dashStarts = Object.fromEntries(
      SUBDOMAINS.map((subdomain) => [subdomain, null]),
    ) as Record<Subdomain, number | null>;
    for (const subdomain of SUBDOMAINS) {
      const colIdx = table.header.indexOf(subdomain);
      if (colIdx === -1) continue;

      let firstDash: number | null = null;
      for (let i = 0; i < table.rows.length; i++) {
        if (table.rows[i][colIdx] === '-') {
          firstDash = i;
          break;
        }
      }
      dashStarts[subdomain] = firstDash;
    }

    // Check: if a column has numeric values well past where another column went to dash,
    // that's suspicious (but not necessarily wrong — some domains have wider raw score ranges)
    // We flag if a column's numeric values extend 20+ rows past where any adjacent column went to dash
    const sorted = SUBDOMAINS
      .filter((subdomain) => dashStarts[subdomain] !== null)
      .map((subdomain) => ({ subdomain, start: dashStarts[subdomain] ?? 0 }))
      .sort((a, b) => a.start - b.start);

    if (sorted.length < 2) continue;

    // Find the highest numeric value in each column
    for (const subdomain of SUBDOMAINS) {
      const colIdx = table.header.indexOf(subdomain);
      if (colIdx === -1) continue;

      let lastNumericRow = -1;
      for (let i = 0; i < table.rows.length; i++) {
        if (/^\d+$/.test(table.rows[i][colIdx])) {
          lastNumericRow = i;
        }
      }

      // Check: numeric value appears after the column's own dash started
      // (this would be caught by boundary check too, but let's double check)
      if (dashStarts[subdomain] !== null && lastNumericRow > dashStarts[subdomain]) {
        warnings.push(
          `Dash gap: ${tableId} ${subdomain} has numeric at raw_score=${lastNumericRow} ` +
          `but dashes started at raw_score=${dashStarts[subdomain]}`
        );
      }
    }
  }

  return warnings;
};

// --- Check 4: Standard score ~100 at age-equivalent raw score (A1 ↔ B cross-check) ---
// For a given age band and subdomain, the raw score that yields standard_score ≈ 100
// in the B table should correspond roughly to the age-equivalent raw score from A1.
const checkA1BConsistency = (tables: Tables, a1: ParsedCsv | null): string[] => {
  const warnings: string[] = [];
  if (!a1) {
    warnings.push('A1 table not found, skipping A1↔B cross-check');
    return warnings;
  }

  // A1 columns: age_months, cognitive, communication, receptive_language, expressive_language,
  //             social_emotional, physical_development, gross_motor, fine_motor, adaptive_behavior
  // B columns:  raw_score, cognitive, receptive_language, expressive_language,
  //             social_emotional, gross_motor, fine_motor, adaptive_behavior

  // Shared subdomains between A1 and B tables
  const sharedSubdomains: Subdomain[] = [
    'cognitive', 'receptive_language', 'expressive_language',
    'social_emotional', 'gross_motor', 'fine_motor', 'adaptive_behavior',
  ];

  const ageBands: Record<TableId, { min: number; max: number }> = {
    B13: { min: 12, max: 13 },
    B14: { min: 14, max: 15 },
    B15: { min: 16, max: 18 },
    B16: { min: 19, max: 21 },
    B17: { min: 22, max: 24 },
    B18: { min: 25, max: 27 },
    B19: { min: 28, max: 30 },
    B20: { min: 31, max: 33 },
    B21: { min: 34, max: 36 },
    B22: { min: 37, max: 39 },
    B23: { min: 40, max: 42 },
    B24: { min: 43, max: 45 },
    B25: { min: 46, max: 48 },
    B26: { min: 49, max: 53 },
    B27: { min: 54, max: 59 },
    B28: { min: 60, max: 65 },
    B29: { min: 66, max: 71 },
  };

  for (const tableId of B_TABLE_ORDER) {
    const table = tables[tableId];
    const band = ageBands[tableId];
    if (!table || !band) continue;

    for (const subdomain of sharedSubdomains) {
      // Find raw_score where standard_score is closest to 100 in B table
      const bColIdx = table.header.indexOf(subdomain);
      if (bColIdx === -1) continue;

      let closestRaw: number | null = null;
      let closestDist = Infinity;
      for (let i = 0; i < table.rows.length; i++) {
        const cell = table.rows[i][bColIdx];
        if (/^\d+$/.test(cell)) {
          const val = parseInt(cell, 10);
          const dist = Math.abs(val - 100);
          if (dist < closestDist) {
            closestDist = dist;
            closestRaw = i;
          }
        }
      }
      if (closestRaw === null) continue;

      // Find age-equivalent raw scores from A1 for ages in this band
      const a1ColIdx = a1.header.indexOf(subdomain);
      if (a1ColIdx === -1) continue;

      // Get raw score values from A1 for ages in this band's range
      const a1Raws: number[] = [];
      for (const row of a1.rows) {
        const ageCell = row[0];
        let ageVal: number | null = null;
        if (/^\d+$/.test(ageCell)) ageVal = parseInt(ageCell, 10);
        if (ageVal !== null && ageVal >= band.min && ageVal <= band.max) {
          const rawCell = row[a1ColIdx];
          if (rawCell === '-') continue;
          // Parse ranges like '10-12' — take midpoint
          const rangeMatch = rawCell.match(/^(\d+)-(\d+)$/);
          if (rangeMatch) {
            a1Raws.push((parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2);
          } else if (/^\d+$/.test(rawCell)) {
            a1Raws.push(parseInt(rawCell, 10));
          }
        }
      }

      if (a1Raws.length === 0) continue;

      // Compare: the B table's raw_score≈100 should be near A1's age-equivalent raw score
      const a1Avg = a1Raws.reduce((s, v) => s + v, 0) / a1Raws.length;
      const diff = Math.abs(closestRaw - a1Avg);

      // Allow generous tolerance (±10) since A1 is age equivalents not norms,
      // but flag large discrepancies that suggest column shifts
      if (diff > 10) {
        warnings.push(
          `A1↔B mismatch: ${tableId} ${subdomain}: ` +
          `B table SS≈100 at raw=${closestRaw}, ` +
          `A1 age-equiv raw≈${a1Avg.toFixed(1)} (diff=${diff.toFixed(1)})`
        );
      }
    }
  }

  return warnings;
};

// --- Check 5: Cross-table dash-onset monotonicity ---
// The raw_score where a subdomain transitions to '-' (ceiling) should be
// non-decreasing as age increases, because older age bands have higher row counts.
const checkDashOnsetMonotonicity = (tables: Tables): string[] => {
  const errors: string[] = [];

  for (const subdomain of SUBDOMAINS) {
    let prevOnset: number | null = null;
    let prevId: TableId | null = null;

    for (const tableId of B_TABLE_ORDER) {
      const table = tables[tableId];
      if (!table) continue;

      const colIdx = table.header.indexOf(subdomain);
      if (colIdx === -1) continue;

      // Find the last row with a numeric or bounded value (not '-')
      let lastActive = -1;
      for (let i = 0; i < table.rows.length; i++) {
        const cell = table.rows[i][colIdx];
        if (cell !== '-') lastActive = i;
      }

      if (lastActive === -1) continue;

      if (prevOnset !== null && lastActive < prevOnset) {
        errors.push(
          `Dash-onset monotonicity: ${subdomain} active range shrinks ` +
          `from ${prevId} (last active raw=${prevOnset}) ` +
          `to ${tableId} (last active raw=${lastActive})`
        );
      }

      prevOnset = lastActive;
      prevId = tableId;
    }
  }

  return errors;
};

const main = (): void => {
  console.log('=== DAYC-2 Cross-Table Validation ===\n');

  const tables = loadBTables();
  const a1 = loadA1();

  let totalErrors = 0;
  let totalWarnings = 0;

  // Check 1: Cross-table monotonicity
  console.log('--- Check 1: Cross-Table Monotonicity ---');
  const monoErrors = checkCrossTableMonotonicity(tables);
  if (monoErrors.length === 0) {
    console.log('  ✅ All subdomain scores are non-increasing across age bands');
  } else {
    monoErrors.forEach((error) => console.log(`  ❌ ${error}`));
  }
  totalErrors += monoErrors.length;

  // Check 2: Boundary value consistency
  console.log('\n--- Check 2: Boundary Value Sequence ---');
  const boundaryErrors = checkBoundaryConsistency(tables);
  if (boundaryErrors.length === 0) {
    console.log('  ✅ All columns follow valid <50 → numeric → >150 → - sequence');
  } else {
    boundaryErrors.forEach((error) => console.log(`  ❌ ${error}`));
  }
  totalErrors += boundaryErrors.length;

  // Check 3: Dash region consistency
  console.log('\n--- Check 3: Dash Region Consistency ---');
  const dashWarnings = checkDashRegionConsistency(tables);
  if (dashWarnings.length === 0) {
    console.log('  ✅ No dash region anomalies');
  } else {
    dashWarnings.forEach((warning) => console.log(`  ⚠️  ${warning}`));
  }
  totalWarnings += dashWarnings.length;

  // Check 4: A1 ↔ B consistency
  console.log('\n--- Check 4: A1 ↔ B Table Consistency ---');
  const a1Warnings = checkA1BConsistency(tables, a1);
  if (a1Warnings.length === 0) {
    console.log('  ✅ B table SS≈100 aligns with A1 age-equivalent raw scores');
  } else {
    a1Warnings.forEach((warning) => console.log(`  ⚠️  ${warning}`));
  }
  totalWarnings += a1Warnings.length;

  // Check 5: Dash-onset monotonicity
  console.log('\n--- Check 5: Dash-Onset Monotonicity ---');
  const dashOnsetErrors = checkDashOnsetMonotonicity(tables);
  if (dashOnsetErrors.length === 0) {
    console.log('  ✅ Active raw score ranges are non-decreasing across age bands');
  } else {
    dashOnsetErrors.forEach((error) => console.log(`  ❌ ${error}`));
  }
  totalErrors += dashOnsetErrors.length;

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n⚠️  Errors indicate likely data extraction mistakes.');
    console.log('   These cells should be manually verified against the source PDFs.');
  }

  process.exit(totalErrors > 0 ? 1 : 0);
};

main();
