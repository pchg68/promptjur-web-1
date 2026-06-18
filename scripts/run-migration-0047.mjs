import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '..', 'drizzle', '0047_ontologia_juridica.sql');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(dbUrl);

const sql = readFileSync(sqlPath, 'utf8');

// Separar por ; mas ignorar comentários e linhas vazias
const stmts = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 5 && !s.startsWith('--') && !s.startsWith('/*'));

let ok = 0;
let fail = 0;

for (const stmt of stmts) {
  try {
    await conn.execute(stmt);
    ok++;
    console.log('OK:', stmt.substring(0, 60).replace(/\n/g, ' '));
  } catch (e) {
    if (
      e.message.includes('already exists') ||
      e.message.includes('Duplicate key name') ||
      e.message.includes('Table') && e.message.includes('already exists')
    ) {
      ok++;
      console.log('SKIP (already exists):', stmt.substring(0, 60).replace(/\n/g, ' '));
    } else {
      console.error('FAIL:', e.message.substring(0, 120));
      console.error('  stmt:', stmt.substring(0, 80).replace(/\n/g, ' '));
      fail++;
    }
  }
}

await conn.end();
console.log(`\nResultado: ${ok} OK, ${fail} FAIL`);
if (fail > 0) process.exit(1);
