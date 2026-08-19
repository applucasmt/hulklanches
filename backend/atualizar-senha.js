import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';
import bcrypt from 'bcryptjs';

const dataDir = join(process.cwd(), '../data');
const dbPath = join(dataDir, 'hulk.db');

console.log('📂 Conectando ao banco...');

const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
});

// Gerar novo hash para "admin123"
const novaSenha = 'admin123';
const hash = await bcrypt.hash(novaSenha, 10);
console.log('🔑 Novo hash gerado:', hash);

// Atualizar a senha do admin
await db.run(
    `UPDATE users SET password = ? WHERE email = 'admin@hulk.com'`,
    [hash]
);

console.log('✅ Senha do admin atualizada!');

// Verificar se a senha funciona
const admin = await db.get('SELECT * FROM users WHERE email = "admin@hulk.com"');
const testHash = await bcrypt.compare(novaSenha, admin.password);
console.log('🔑 Teste de senha:', testHash ? '✅ Válida' : '❌ Inválida');

console.log('\n📊 Dados do admin:');
console.log('ID:', admin.id);
console.log('Nome:', admin.name);
console.log('Email:', admin.email);
console.log('Role:', admin.role);

await db.close();
console.log('\n🎉 Concluído! Agora tente fazer login novamente.');
