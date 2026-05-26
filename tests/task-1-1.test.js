const fs = require('fs');
const path = require('path');

const widgetPath = path.resolve(__dirname, '../app/components/leave-widget.tsx');
const pagePath = path.resolve(__dirname, '../app/page.tsx');

let failed = false;

if (!fs.existsSync(widgetPath)) {
  console.error(`Missing file: ${widgetPath}`);
  failed = true;
}

if (!fs.existsSync(pagePath)) {
  console.error(`Missing file: ${pagePath}`);
  failed = true;
}

if (!failed) {
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  if (!/import\s+LeaveWidget/.test(pageContent) && !/import\s+\{\s*LeaveWidget\s*\}/.test(pageContent)) {
    console.error('page.tsx must import LeaveWidget from app/components/leave-widget.tsx');
    failed = true;
  }
  if (!/export\s+default\s+function\s+Page/.test(pageContent)) {
    console.error('page.tsx must export a default Page component');
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
