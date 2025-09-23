import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes/index';
// import { PaymentControllers } from './app/modules/Payment/Payment.controller';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import Stripe from 'stripe';
import config from './app/config';
import { SubscriptionControllers } from './app/modules/Subscription/Subscription.controller';
const stripe = new Stripe(config.stripe_secret_key!);

const app: Application = express();
app.post(
  '/api/v1/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  SubscriptionControllers.handleWebhook
);

// app.post(
//   '/api/v1/subscriptions/webhook',
//   (req, res, next) => {
//     console.log('🎯 Direct webhook route hit!');
//     console.log('Method:', req.method);
//     console.log('URL:', req.url);
//     console.log('Headers:', req.headers);
//     next();
//   },
//   express.raw({ type: 'application/json' }),
//   SubscriptionControllers.handleWebhook
// );

// app.post(
//   '/api/v1/payments/webhook',
//   express.raw({ type: 'application/json' }),
//   PaymentControllers.webhook
// );

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
      'http://localhost:5173'
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
app.get('/subscription/success', async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).send('<h1>❌ Error: Missing session ID</h1>');
  }

  try {
    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(
      sessionId as string
    );

    if (session.payment_status === 'paid') {
      // Success! Show confirmation
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Payment Successful!</h1>
            <h2>Thank you for your subscription!</h2>
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <p><strong>Amount:</strong> $${(
              session.amount_total! / 100
            ).toFixed(2)}</p>
            <p><strong>Status:</strong> ${session.payment_status}</p>
            <p>Your subscription has been activated and you can now receive booking requests.</p>
            <a href="/" style="background: #635bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Back to Dashboard
            </a>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <h1>⏳ Payment Pending</h1>
        <p>Payment status: ${session.payment_status}</p>
        <p>Please wait for payment confirmation.</p>
      `);
    }
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).send('<h1>❌ Error verifying payment</h1>');
  }
});

app.get('/', (req: Request, res: Response) => {
  // res.sendFile(path.join(__dirname, 'index.html'));
  res.send('Welcome To Property API!');
});

// app.use(notFound);
app.use(globalErrorHandler);

export default app;
