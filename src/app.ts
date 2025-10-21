import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes/index';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import { SubscriptionControllers } from './app/modules/Subscription/Subscription.controller';

const app: Application = express();
app.post(
  '/api/v1/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  SubscriptionControllers.handleWebhook
);



// Middleware
app.use(helmet()); // Security headers
app.use(cookieParser());
app.use(
  cors({
    origin: [
      'http://192.168.12.63:5173',
      'http://192.168.12.63:3001',
      'http://34.233.41.57:3000',
      'http://localhost:3000',
      'http://localhost:5174',
      'http://localhost:4173',
      "http://10.10.20.24:4173"
    ],
    // origin:"*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);

// Serve static files
app.use('/uploads', express.static('uploads'));
// app.use(express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Routes
app.use('/api/v1', router);
// Add this to your main app.ts or create a new route file

app.get('/', (req: Request, res: Response) => {
  // res.sendFile(path.join(__dirname, 'index.html'));
  console.log('Welcome To Property API!');
  res.send('Welcome To Property API!');
});

// app.use(notFound);
app.use(globalErrorHandler);

export default app;
