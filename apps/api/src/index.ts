import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import operacaoRoutes from './routes/operacaoRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', operacaoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
