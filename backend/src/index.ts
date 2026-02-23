import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import newsletterRoutes from './routes/newsletter.js'; // 👈 Use import, não require

dotenv.config();

const app = express();
const port = process.env['PORT'] || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/newsletters', newsletterRoutes);

// Rota de teste
app.get('/', (_, res) => {
  res.json({ message: 'API funcionando!' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});