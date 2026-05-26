const fs = require('fs');
const path = require('path');

const cachePath = path.resolve(__dirname, '../src/lib/cache.ts');

let failed = false;

if (!fs.existsSync(cachePath)) {
  console.error(`Missing file: ${cachePath}`);
  failed = true;
} else {
  const cacheContent = fs.readFileSync(cachePath, 'utf8');

  if (!/export\s+interface\s+RedisCacheOptions/.test(cacheContent)) {
    console.error('src/lib/cache.ts must export RedisCacheOptions interface');
    failed = true;
  }

  if (!/export\s+function\s+createRedisCache/.test(cacheContent)) {
    console.error('src/lib/cache.ts must export createRedisCache function');
    failed = true;
  }

  if (!/ttl/.test(cacheContent)) {
    console.error('src/lib/cache.ts should include TTL configuration support');
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
