import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';


import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import userRoutes from './routes/user.routes.js';
import unitRoutes from './routes/unit.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import operatorRoutes from './routes/operator.routes.js';
import serviceRoutes from './routes/service.routes.js';
import communicationRoutes from './routes/communication.routes.js';
import requisitionRoutes from './routes/requisition.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Temp Debug
import { listUsers, runSeed } from './controllers/DebugController.js';
app.get('/api/debug/users', listUsers);
app.post('/api/debug/seed', runSeed);

// @ts-ignore
app.use(helmet());
app.use(cors());
app.use(express.json());



app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/requisitions', requisitionRoutes);

app.get('/', (req, res) => {
    res.send('Events ERP API is running');
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

// Handle client-side routing
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

export default app;
