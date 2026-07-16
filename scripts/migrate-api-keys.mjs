import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const conn = await createConnection(process.env.DATABASE_URL);

try {
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`api_keys\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`keyHash\` varchar(128) NOT NULL,
    \`keyPrefix\` varchar(16) NOT NULL,
    \`name\` varchar(64) NOT NULL DEFAULT 'Default',
    \`tier\` varchar(16) NOT NULL DEFAULT 'basic',
    \`requestsToday\` int NOT NULL DEFAULT 0,
    \`requestsTotal\` int NOT NULL DEFAULT 0,
    \`lastUsedAt\` timestamp NULL,
    \`revokedAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`api_keys_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`api_keys_keyHash_unique\` UNIQUE(\`keyHash\`)
  )`);
  console.log('✓ api_keys table created');

  // Add FK constraint (ignore if already exists)
  try {
    await conn.execute('ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action');
    console.log('✓ FK constraint added');
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME' || e.message.includes('Duplicate')) {
      console.log('  FK constraint already exists');
    } else throw e;
  }

  // Add indexes (ignore if already exist)
  for (const sql of [
    'CREATE INDEX `idx_api_keys_user` ON `api_keys` (`userId`)',
    'CREATE INDEX `idx_api_keys_hash` ON `api_keys` (`keyHash`)',
  ]) {
    try {
      await conn.execute(sql);
      console.log('✓ Index created');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.message.includes('Duplicate')) {
        console.log('  Index already exists');
      } else throw e;
    }
  }

  console.log('\n✅ Migration complete: api_keys table ready');
} finally {
  await conn.end();
}
