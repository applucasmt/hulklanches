-- Inserir usuário admin (senha: admin123)
INSERT OR REPLACE INTO users (id, name, email, password, role) 
VALUES (1, 'Administrador', 'admin@hulk.com', '$2a$10$XKm.8QZ.3tJ4Y5Z6W7X8Y9Z0W1X2Y3Z4W5X6Y7Z8W9X0Y1Z2W3X4Y5Z6W7X8', 'admin');

-- Verificar se foi inserido
SELECT id, name, email, role FROM users WHERE email = 'admin@hulk.com';
