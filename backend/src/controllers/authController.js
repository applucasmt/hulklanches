import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        console.log('🔍 Tentando login:', email);
        
        const user = await User.findByEmail(email);
        if (!user) {
            console.log('❌ Usuário não encontrado:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        console.log('✅ Usuário encontrado:', user.email);
        
        const isValid = await User.comparePassword(password, user.password);
        if (!isValid) {
            console.log('❌ Senha incorreta para:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        console.log('✅ Login bem-sucedido para:', email);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;
        console.log('📝 Registrando usuário:', email);
        
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const db = await import('../config/database.js').then(m => m.getDatabase());
        
        const result = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role || 'funcionario']
        );
        
        const user = result.rows[0];
        console.log('✅ Usuário criado:', user.email);
        
        res.status(201).json(user);
    } catch (error) {
        console.error('❌ Erro no registro:', error);
        res.status(500).json({ error: error.message });
    }
}