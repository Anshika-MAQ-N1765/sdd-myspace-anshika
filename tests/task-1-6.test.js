const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.example');

let failed = false;

if (!fs.existsSync(envPath)) {
  console.error(`Missing file: ${envPath}`);
  failed = true;
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredKeys = ['DATABASE_URL=', 'REDIS_URL=', 'IDP_CLIENT_ID=', 'IDP_CLIENT_SECRET=', 'NEXTAUTH_SECRET='];

  requiredKeys.forEach((key) => {
    if (!envContent.includes(key)) {
      console.error(`.env.example must include ${key}`);
      failed = true;
    }
  });
}

process.exit(failed ? 1 : 0);
