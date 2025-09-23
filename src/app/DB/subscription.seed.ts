import config from '../config/index';
import Stripe from 'stripe';
import { SubscriptionPlan } from '../modules/Subscription/Subscription.model';

const stripe = new Stripe(config.stripe_secret_key!);

export default async function initializeDefaultPlans () {
  // Check if plans already exist
  const existingPlans = await SubscriptionPlan.find();
  if (existingPlans.length > 0) {
    return { message: 'Plans already exist', plans: existingPlans };
  }

  const plans = [
    {
      name: 'Basic Plan',
      type: 'basic' as const,
      duration: 1,
      price: 49,
      features: [
        'Basic stats only',
        'Standard email support',
        'Optional custom branding ($19/month)'
      ],
      serviceAreas: 5,
      featuredListing: false,
      instantBookingEligibility: false,
      multipleStaffAccounts: false,
      jobCategories: 2,
      verifiedBadge: true,
      insightsDashboard: 'basic',
      support: 'standard',
      customerReviewBooster: false,
      customBranding: false,
      customBrandingPrice: 19
    },
    {
      name: 'Premium Plan',
      type: 'premium' as const,
      duration: 1,
      price: 99,
      features: [
        'Unlimited regions & cities',
        'Higher ranking in search & categories',
        'Eligible for auto-accept jobs',
        'Multiple staff accounts',
        'Access to all available categories',
        'Verified badge plus premium badge highlight',
        'Full access to bookings, earnings, and review breakdown',
        'Priority support + phone line',
        'Automated follow-ups to boost 5-star reviews',
        'Custom branding included (Business logo & name displayed)',
        'NEW CUSTOMERS GET FREE ACCESS FOR FIRST 6 MONTHS'
      ],
      serviceAreas: -1,
      featuredListing: true,
      instantBookingEligibility: true,
      multipleStaffAccounts: true,
      jobCategories: -1,
      verifiedBadge: true,
      premiumBadge: true,
      insightsDashboard: 'full',
      support: 'priority',
      customerReviewBooster: true,
      customBranding: true,
      customBrandingPrice: 0,
      newCustomerFreeMonths: 6
    }
  ];

  const createdPlans = [];

  for (const planData of plans) {
    // Create Stripe price
    const stripePrice = await stripe.prices.create({
      unit_amount: planData.price * 100,
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: planData.duration
      },
      product_data: {
        name: planData.name
      }
    });

    // Create plan in database
    const plan = await SubscriptionPlan.create({
      ...planData,
      stripePriceId: stripePrice.id,
      isActive: true
    });

    createdPlans.push(plan);
  }

  return { message: 'Plans created successfully', plans: createdPlans };
}
