import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';
import fs from 'fs';

const dataDir = join(process.cwd(), '../data');
const dbPath = join(dataDir, 'hulk.db');

console.log('📂 Verificando banco em:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.log('❌ Banco de dados NÃO encontrado!');
    process.exit(1);
}

console.log('✅ Banco encontrado!');

const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
});

// Verificar usuários
const users = await db.all('SELECT id, name, email, role FROM users');
console.log('\n📊 Usuários no banco:', users);

if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado!');
} else {
    // Verificar admin especificamente
    const admin = await db.get('SELECT * FROM users WHERE email = "admin@hulk.com"');
    if (admin) {
        console.log('✅ Admin encontrado:', admin);
        console.log('🔑 Hash da senha:', admin.password.substring(0, 20) + '...');
    } else {
        console.log('❌ Admin NÃO encontrado!');
    }
}

await db.close();
