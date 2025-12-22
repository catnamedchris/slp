# AGENTS.md

## Code Style

* ALWAYS use arrow functions over `function` declarations

```ts
// ✓ Good
const parseValue = (raw: string): number => {
  return parseInt(raw, 10);
};

// ✗ Bad
function parseValue(raw: string): number {
  return parseInt(raw, 10);
}
```

* ALWAYS use TypeScript for new scripts (`.ts` files)

```ts
// ✓ Good: src/dayc2/types.ts
export interface ParsedScore {
  value: number;
  bound?: 'lt' | 'gt';
}

// ✗ Bad: src/dayc2/types.js
module.exports = { ... }
```

## Development Process

* ALWAYS use test-driven development (write tests first, then implementation)

## Commands

* TypeScript compile: `npx tsc`
* Run TypeScript: `npx ts-node <file.ts>`
* Run tests: `npm test`

## Project Structure

* Source code: `src/`
* DAYC-2 conversion: `src/dayc2/`
* CSV data: `data/csv/`
* JSON data: `data/json/`
* Output spreadsheets: `dist/`
