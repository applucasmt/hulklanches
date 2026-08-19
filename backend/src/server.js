import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importação das rotas
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import dashboardRoutes from './routes/dashboard.js';
import comboRoutes from './routes/combos.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// ============ MIDDLEWARES ============

// CORS
app.use(cors());

// JSON
app.use(express.json());

// Arquivos estáticos (imagens)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============ ROTAS ============

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// ============ WEBSOCKET ============

io.on('connection', (socket) => {
    console.log('🟢 Cliente conectado:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔴 Cliente desconectado:', socket.id);
    });
});

// Salvar io no app para usar nos controllers
app.set('io', io);

// ============ INICIAR SERVIDOR ============

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
    console.log(`📦 Conectado ao PostgreSQL: ${process.env.DB_NAME || 'hulk_lanches'}`);
    console.log(`📁 Uploads: ${path.join(__dirname, '../uploads')}`);
});

export default app;