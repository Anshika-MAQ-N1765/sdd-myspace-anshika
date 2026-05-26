const fs = require('fs');
const path = require('path');

const prismaClientPath = path.resolve(__dirname, '../src/lib/prisma.ts');
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

let failed = false;

if (!fs.existsSync(prismaClientPath)) {
  console.error(`Missing file: ${prismaClientPath}`);
  failed = true;
}

if (!fs.existsSync(schemaPath)) {
  console.error(`Missing file: ${schemaPath}`);
  failed = true;
}

if (!failed) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  if (!/datasource\s+db\s+\{/.test(schemaContent)) {
    console.error('prisma/schema.prisma must define a datasource named db');
    failed = true;
  }
  if (!/generator\s+client\s+\{/.test(schemaContent)) {
    console.error('prisma/schema.prisma must define a generator client block');
    failed = true;
  }
  if (!/model\s+Employee\s+\{/.test(schemaContent)) {
    console.error('prisma/schema.prisma must include an Employee model placeholder');
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
