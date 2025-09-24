// import { Request, Response } from 'express';
// import Stripe from 'stripe';
// import config from '../../config';

// const stripe = new Stripe(config.stripe_secret_key as string, {
//   apiVersion: '2022-11-15',
// });

// // Webhook handler function
// export const handleStripeWebhook = async (req: Request, res: Response) => {
//   const sig = req.headers['stripe-signature'] as string;
//   const endpointSecret = config.stripe_webhook_secret; // Ensure this is set in your config

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(req['rawBody'], sig, endpointSecret);
//   } catch (err) {
//     console.error('Webhook signature verification failed.', err);
//     return res.status(400).send(`Webhook Error: ${err}`);
//   }

//   // Handle specific events
//   switch (event.type) {
//     case 'payment_intent.succeeded':
//       const paymentIntent = event.data.object as Stripe.PaymentIntent;
//       console.log('PaymentIntent was successful!', paymentIntent);
//       // Store or process the balanceTransactionId, paymentIntent.id, and other details in your database
//       break;

//     case 'transfer.created':
//       const transfer = event.data.object as Stripe.Transfer;
//       console.log('Transfer created!', transfer);
//       // Store or process the transfer details here
//       break;

//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }

//   res.json({ received: true });
// };
