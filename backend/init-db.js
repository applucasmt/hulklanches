import { getDatabase } from './src/config/database.js';

try {
    const db = await getDatabase();
    console.log('✅ Banco de dados inicializado com sucesso!');
    
    // Verificar se o admin foi criado
    const admin = await db.get('SELECT * FROM users WHERE email = "admin@hulk.com"');
    if (admin) {
        console.log('✅ Usuário admin encontrado:', admin.name);
    } else {
        console.log('⚠️ Usuário admin NÃO encontrado!');
    }
    
    process.exit(0);
} catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    process.exit(1);
}
