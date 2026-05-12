import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function measureLatency() {
  const db = await getDb();
  if (!db) {
    console.log("DB nao disponivel");
    process.exit(1);
  }

  const results: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const elapsed = Date.now() - start;
    results.push(elapsed);
    console.log(`Tentativa ${i + 1}: ${elapsed}ms`);
  }

  const average = results.reduce((a, b) => a + b, 0) / results.length;
  const maximum = Math.max(...results);
  const minimum = Math.min(...results);

  console.log(`\n--- Resultados ---`);
  console.log(`Media: ${average.toFixed(0)}ms`);
  console.log(`Max: ${maximum}ms`);
  console.log(`Min: ${minimum}ms`);
  console.log(`\nPrimeira chamada (cold): ${results[0]}ms`);
  console.log(`Demais (warm): ${results.slice(1).join(", ")}ms`);

  if (results[0] > 2000 && average < 500) {
    console.log(`\n>>> DIAGNOSTICO: Cold start do pool de conexoes.`);
    console.log(`    A primeira conexao leva ${results[0]}ms (TLS handshake + auth).`);
    console.log(`    Conexoes subsequentes sao rapidas (media warm: ${(results.slice(1).reduce((a, b) => a + b, 0) / (results.length - 1)).toFixed(0)}ms).`);
  } else if (average > 500) {
    console.log(`\n>>> DIAGNOSTICO: Latencia alta persistente.`);
    console.log(`    Possivel problema de rede ou DB sobrecarregado.`);
  } else {
    console.log(`\n>>> DIAGNOSTICO: Latencia normal.`);
  }

  process.exit(0);
}

measureLatency().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
