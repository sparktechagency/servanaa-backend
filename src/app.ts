import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes/index';
import { PaymentControllers } from './app/modules/Payment/Payment.controller';
import globalErrorHandler from './app/middlewares/globalErrorhandler';

const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://192.168.12.63:5173', 'http://192.168.12.63:3001', 'http://34.233.41.57:3000', 'http://localhost:3000','http://localhost:5174', 'http://localhost:5173'],
    // origin:"*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// Serve static files
app.use("/uploads", express.static("uploads"));


// WEBHOOK route *must come before* any JSON or URL-encoded parsers
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }), // raw parser for exact body
  PaymentControllers.webhook,
);


// app.use(express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Routes
app.use('/api/v1', router);




app.get('/', (req: Request, res: Response) => {
  // res.sendFile(path.join(__dirname, 'index.html'));
  res.send('Welcome To Property API!');

});

// app.use(notFound);
app.use(globalErrorHandler);

export default app;












