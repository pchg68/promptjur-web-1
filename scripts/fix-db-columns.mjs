import mysql from 'mysql2/promise';

async function fix() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Verificar colunas atuais na tabela users
  const [cols] = await conn.query('DESCRIBE users');
  const colNames = cols.map(r => r.Field);
  console.log('Colunas atuais:', colNames.join(', '));

  // Adicionar bonusCredits se não existir
  if (!colNames.includes('bonusCredits')) {
    await conn.query('ALTER TABLE users ADD COLUMN bonusCredits INT NOT NULL DEFAULT 0');
    console.log('✓ Coluna bonusCredits adicionada');
  } else {
    console.log('- bonusCredits já existe');
  }

  // Verificar tabelas de referral
  const [tables] = await conn.query("SHOW TABLES LIKE 'referral%'");
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('Tabelas referral:', tableNames.join(', ') || 'nenhuma');

  if (!tableNames.includes('referral_codes')) {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        code VARCHAR(32) NOT NULL UNIQUE,
        totalUses INT NOT NULL DEFAULT 0,
        totalCreditsEarned INT NOT NULL DEFAULT 0,
        isActive TINYINT(1) NOT NULL DEFAULT 1,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabela referral_codes criada');
  } else {
    console.log('- referral_codes já existe');
  }

  if (!tableNames.includes('referrals')) {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referralCodeId INT NOT NULL,
        referrerId INT NOT NULL,
        referredId INT NOT NULL,
        creditsGivenToReferrer INT NOT NULL DEFAULT 5,
        creditsGivenToReferred INT NOT NULL DEFAULT 5,
        status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'completed',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabela referrals criada');
  } else {
    console.log('- referrals já existe');
  }

  // Verificar colunas finais
  const [finalCols] = await conn.query('DESCRIBE users');
  console.log('\nColunas finais na tabela users:');
  finalCols.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));

  await conn.end();
  console.log('\n✅ Banco de dados sincronizado com sucesso!');
}

fix().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
