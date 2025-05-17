import express from 'express';
import cors from 'cors';
import agentRoutes from './routes/agentRoutes.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment check:');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Set (first 10 chars: ' + process.env.OPENROUTER_API_KEY.substring(0, 10) + '...)' : 'MISSING');
console.log('OPENROUTER_MODEL:', process.env.OPENROUTER_MODEL || 'MISSING');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/agent', agentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
