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

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
