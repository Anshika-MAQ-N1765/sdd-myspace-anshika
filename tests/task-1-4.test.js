const fs = require('fs');
const path = require('path');

const loggingPath = path.resolve(__dirname, '../src/lib/logging.ts');

let failed = false;

if (!fs.existsSync(loggingPath)) {
  console.error(`Missing file: ${loggingPath}`);
  failed = true;
} else {
  const loggingContent = fs.readFileSync(loggingPath, 'utf8');
  
  if (!/export\s+function\s+createStructuredLog/.test(loggingContent)) {
    console.error('src/lib/logging.ts must export createStructuredLog function');
    failed = true;
  }
  
  if (!/export\s+function\s+redactPII/.test(loggingContent)) {
    console.error('src/lib/logging.ts must export redactPII function');
    failed = true;
  }
  
  if (!/export\s+interface\s+StructuredLogEntry/.test(loggingContent)) {
    console.error('src/lib/logging.ts must export StructuredLogEntry interface');
    failed = true;
  }
  
  if (!/actor/.test(loggingContent) && !/action/.test(loggingContent)) {
    console.error('src/lib/logging.ts must contain actor and action properties');
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
