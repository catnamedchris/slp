const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '../data/csv');

const SCHEMAS = {
  A1: {
    columns: ['age_months', 'cognitive', 'communication', 'receptive_language', 'expressive_language', 
              'social_emotional', 'physical_development', 'gross_motor', 'fine_motor', 'adaptive_behavior'],
    minRows: 70
  },
  B: {
    columns: ['raw_score', 'cognitive', 'receptive_language', 'expressive_language', 
              'social_emotional', 'gross_motor', 'fine_motor', 'adaptive_behavior'],
    minRows: 50
  },
  C1: {
    columns: ['standard_score_1', 'percentile_rank_1', 'standard_score_2', 'percentile_rank_2', 
              'standard_score_3', 'percentile_rank_3'],
    minRows: 30
  },
  D1: {
    columns: ['sum_range_1', 'standard_score_1', 'sum_range_2', 'standard_score_2', 
              'sum_range_3', 'standard_score_3'],
    minRows: 30
  }
};

const VALUE_PATTERN = /^$|^-$|^<\d+(\.\d+)?$|^>\d+(\.\d+)?$|^\d+$|^\d+-\d+$|^\d+\.\d+$/;

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(line => line.split(','));
  return { header, rows };
}

function getTableType(filename) {
  if (filename.includes('Table-A1')) return 'A1';
  if (filename.includes('Table-B')) return 'B';
  if (filename.includes('Table-C1')) return 'C1';
  if (filename.includes('Table-D1')) return 'D1';
  return null;
}

function validateFile(filename, content) {
  const errors = [];
  const warnings = [];
  const tableType = getTableType(filename);
  
  if (!tableType) {
    errors.push(`Unknown table type`);
    return { errors, warnings };
  }
  
  const schema = SCHEMAS[tableType];
  const { header, rows } = parseCSV(content);
  
  // Column count check
  if (header.length !== schema.columns.length) {
    errors.push(`Column count: expected ${schema.columns.length}, got ${header.length}`);
  }
  
  // Column names check
  const expectedHeader = schema.columns.join(',');
  const actualHeader = header.join(',');
  if (expectedHeader !== actualHeader) {
    errors.push(`Header mismatch:\n  expected: ${expectedHeader}\n  got:      ${actualHeader}`);
  }
  
  // Row count check
  if (rows.length < schema.minRows) {
    warnings.push(`Low row count: ${rows.length} (expected >= ${schema.minRows})`);
  }
  
  // Empty row check
  rows.forEach((row, i) => {
    if (row.every(cell => cell === '')) {
      errors.push(`Empty row at line ${i + 2}`);
    }
  });
  
  // Value pattern check
  rows.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (!VALUE_PATTERN.test(cell)) {
        errors.push(`Invalid value at row ${i + 2}, col ${j + 1} (${header[j]}): "${cell}"`);
      }
    });
  });
  
  // Table-specific checks
  if (tableType === 'B') {
    validateBTable(rows, header, errors, warnings);
  } else if (tableType === 'C1') {
    validateC1Table(rows, header, errors, warnings);
  }
  
  return { errors, warnings };
}

function validateBTable(rows, header, errors, warnings) {
  // Raw score monotonicity (should be 0, 1, 2, ...)
  rows.forEach((row, i) => {
    const rawScore = parseInt(row[0], 10);
    if (rawScore !== i) {
      errors.push(`Raw score sequence break at row ${i + 2}: expected ${i}, got ${row[0]}`);
    }
  });
  
  // Standard score range check (50-150 for numeric values)
  rows.forEach((row, i) => {
    row.slice(1).forEach((cell, j) => {
      if (/^\d+$/.test(cell)) {
        const val = parseInt(cell, 10);
        if (val < 50 || val > 150) {
          warnings.push(`Standard score out of range at row ${i + 2}, ${header[j + 1]}: ${val}`);
        }
      }
    });
  });
  
  // Standard scores should generally increase as raw scores increase (within each domain)
  for (let col = 1; col < header.length; col++) {
    let prevVal = null;
    let decreaseCount = 0;
    rows.forEach((row, i) => {
      const cell = row[col];
      if (/^\d+$/.test(cell)) {
        const val = parseInt(cell, 10);
        if (prevVal !== null && val < prevVal) {
          decreaseCount++;
          if (decreaseCount <= 2) {
            warnings.push(`${header[col]} decreases at row ${i + 2}: ${prevVal} -> ${val}`);
          }
        }
        prevVal = val;
      }
    });
    if (decreaseCount > 2) {
      warnings.push(`${header[col]}: ${decreaseCount - 2} more decreases not shown`);
    }
  }
}

function validateC1Table(rows, header, errors, warnings) {
  // Standard scores should decrease (160, 159, 158, ...)
  for (let col = 0; col < 6; col += 2) {
    let prevVal = null;
    rows.forEach((row, i) => {
      const cell = row[col];
      if (/^\d+$/.test(cell)) {
        const val = parseInt(cell, 10);
        if (prevVal !== null && val >= prevVal) {
          errors.push(`C1 standard_score_${col/2 + 1} should decrease at row ${i + 2}: ${prevVal} -> ${val}`);
        }
        prevVal = val;
      }
    });
  }
}

function validateAgeRangeCoverage() {
  const files = fs.readdirSync(CSV_DIR).filter(f => f.startsWith('Table-B'));
  const ageRanges = [];
  
  files.forEach(f => {
    const match = f.match(/Age-(\d+)-(\d+)-Months/);
    if (match) {
      ageRanges.push({ file: f, start: parseInt(match[1]), end: parseInt(match[2]) });
    }
  });
  
  ageRanges.sort((a, b) => a.start - b.start);
  
  const gaps = [];
  for (let i = 1; i < ageRanges.length; i++) {
    const prev = ageRanges[i - 1];
    const curr = ageRanges[i];
    if (curr.start !== prev.end + 1) {
      gaps.push(`Gap between ${prev.end} and ${curr.start} months`);
    }
  }
  
  return { ageRanges, gaps };
}

function main() {
  console.log('=== DAYC-2 CSV Validation ===\n');
  
  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
  let totalErrors = 0;
  let totalWarnings = 0;
  
  files.forEach(filename => {
    const content = fs.readFileSync(path.join(CSV_DIR, filename), 'utf8');
    const { errors, warnings } = validateFile(filename, content);
    
    if (errors.length || warnings.length) {
      console.log(`\n📄 ${filename}`);
      errors.forEach(e => console.log(`  ❌ ${e}`));
      warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    }
    
    totalErrors += errors.length;
    totalWarnings += warnings.length;
  });
  
  // Age range coverage check
  console.log('\n--- Age Range Coverage (B Tables) ---');
  const { ageRanges, gaps } = validateAgeRangeCoverage();
  console.log(`Found ${ageRanges.length} B tables covering ${ageRanges[0]?.start}-${ageRanges[ageRanges.length-1]?.end} months`);
  if (gaps.length) {
    gaps.forEach(g => console.log(`  ❌ ${g}`));
    totalErrors += gaps.length;
  } else {
    console.log('  ✅ No gaps in age coverage');
  }
  
  // Summary
  console.log('\n=== Summary ===');
  console.log(`Files validated: ${files.length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);
  
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
