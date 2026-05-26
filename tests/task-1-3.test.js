const fs = require('fs');
const path = require('path');

const authPath = path.resolve(__dirname, '../src/lib/auth.ts');

let failed = false;

if (!fs.existsSync(authPath)) {
  console.error(`Missing file: ${authPath}`);
  failed = true;
} else {
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  if (!/export\s+function\s+extractIdPToken/.test(authContent)) {
    console.error('src/lib/auth.ts must export extractIdPToken function');
    failed = true;
  }
  
  if (!/export\s+function\s+getEmployeeIdentity/.test(authContent)) {
    console.error('src/lib/auth.ts must export getEmployeeIdentity function');
    failed = true;
  }
  
  if (!/export\s+interface\s+EmployeeIdentity/.test(authContent)) {
    console.error('src/lib/auth.ts must export EmployeeIdentity interface');
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
