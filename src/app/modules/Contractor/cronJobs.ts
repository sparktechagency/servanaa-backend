/* eslint-disable no-constant-condition */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import mongoose from 'mongoose';
import { Subscription } from '../Subscription/Subscription.model';
import { Contractor } from '../Contractor/Contractor.model';

const cronLocks = new Map<string, boolean>();

export const initializeCronJobs = () => {
  cron.schedule(
    '0 1 * * *',
    async () => {
      const jobName = 'subscription-expiry-check';

      if (cronLocks.get(jobName)) {
        console.log(
          '⚠️ Subscription expiry check already running, skipping...'
        );
        return;
      }

      cronLocks.set(jobName, true);

      try {
        const result = await processExpiredSubscriptions();
        console.log(result);
      } catch (error) {
        console.error('❌ Fatal error in subscription expiry check:', error);
      } finally {
        cronLocks.delete(jobName);
      }
    },
    {
      timezone: 'UTC'
    }
  );

  // Weekly reminder for subscriptions expiring in 7 days (Mondays at 9:00 AM)
  cron.schedule(
    '0 9 * * 1',
    async () => {
      const jobName = 'subscription-reminder';

      if (cronLocks.get(jobName)) {
        console.log(
          '⚠️ Subscription reminder job already running, skipping...'
        );
        return;
      }

      cronLocks.set(jobName, true);

      try {
        console.log('📧 Starting subscription expiry reminder...');
        const result = await sendSubscriptionReminders();
        console.log(
          `✅ Subscription reminder completed. Sent: ${result.sent}, Failed: ${result.failed}`
        );
      } catch (error) {
        console.error('❌ Error in subscription reminder job:', error);
      } finally {
        cronLocks.delete(jobName);
      }
    },
    {
      timezone: 'UTC'
    }
  );

  console.log('🚀 Cron jobs initialized successfully');
};

// FIXED: Process expired subscriptions with proper transaction management and batching
async function processExpiredSubscriptions () {
  const batchSize = 100; // Process in batches to avoid memory issues
  let processed = 0;
  let failed = 0;
  let skip = 0;

  // Get current time in configured timezone
  const currentTime = new Date();
  console.log(
    `📅 Checking subscriptions expired before: ${currentTime.toISOString()}`
  );

  while (true) {
    // FIXED: Use pagination to avoid memory issues
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lte: currentTime },
      isDeleted: false
    })
      .select('_id contractorId endDate planType')
      .limit(batchSize)
      .skip(skip);

    if (expiredSubscriptions.length === 0) {
      break;
    }

    console.log(
      `🔄 Processing batch: ${expiredSubscriptions.length} expired subscriptions`
    );

    for (const subscription of expiredSubscriptions) {
      const session = await mongoose.startSession();

      try {
        session.startTransaction();
        await Subscription.findByIdAndUpdate(
          subscription._id,
          { status: 'expired' },
          { session }
        );

        await Contractor.findByIdAndUpdate(
          subscription.contractorId,
          {
            hasActiveSubscription: false,
            subscriptionStatus: 'expired'
          },
          { session }
        );

        await session.commitTransaction();
        processed++;

        console.log(
          `✅ Expired subscription for contractor: ${subscription.contractorId}, plan: ${subscription.planType}`
        );
      } catch (error) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }

        failed++;
        console.error(
          `❌ Failed to expire subscription ${subscription._id}:`,
          error
        );

        // Continue processing other subscriptions instead of failing the entire batch
      } finally {
        await session.endSession();
      }
    }

    skip += batchSize;

    if (expiredSubscriptions.length === batchSize) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { processed, failed };
}

async function sendSubscriptionReminders () {
  let sent = 0;
  let failed = 0;

  try {
    // FIXED: More precise date calculation with timezone consideration
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999); // End of day

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    oneDayFromNow.setHours(0, 0, 0, 0); // Start of day

    console.log(
      `📅 Finding subscriptions expiring between ${oneDayFromNow.toISOString()} and ${sevenDaysFromNow.toISOString()}`
    );

    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      endDate: {
        $gte: oneDayFromNow,
        $lte: sevenDaysFromNow
      },
      isDeleted: false
    })
      .populate({
        path: 'contractorId',
        select: 'userId', // Only get userId field
        populate: {
          path: 'userId',
          select: 'email fullName' // Only get email and name
        }
      })
      .select('endDate planType contractorId')
      .limit(500);

    console.log(
      `📧 Found ${expiringSubscriptions.length} subscriptions requiring reminders`
    );

    for (const subscription of expiringSubscriptions) {
      try {
        const contractor = subscription.contractorId as any;
        const user = contractor?.userId;

        if (!user?.email) {
          console.warn(
            `⚠️ No email found for contractor ${contractor?._id}, skipping reminder`
          );
          continue;
        }

        const daysUntilExpiry = Math.ceil(
          (subscription.endDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );

        console.log(
          `📧 Would send reminder to ${user.email} for ${subscription.planType} plan expiring in ${daysUntilExpiry} days`
        );

        sent++;
      } catch (error) {
        failed++;
        console.error(
          `❌ Failed to send reminder for subscription ${subscription._id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error('❌ Error in sendSubscriptionReminders:', error);
    throw error;
  }

  return { sent, failed };
}

export const cleanupOrphanedSubscriptions = async () => {
  console.log('🧹 Starting cleanup of orphaned subscriptions...');

  try {
    const orphanedSubscriptions = await Subscription.aggregate([
      {
        $lookup: {
          from: 'contractors',
          localField: 'contractorId',
          foreignField: '_id',
          as: 'contractor'
        }
      },
      {
        $match: {
          contractor: { $size: 0 },
          isDeleted: false
        }
      },
      {
        $project: { _id: 1, contractorId: 1 }
      }
    ]);

    if (orphanedSubscriptions.length > 0) {
      console.log(
        `🗑️ Found ${orphanedSubscriptions.length} orphaned subscriptions`
      );

      const orphanedIds = orphanedSubscriptions.map(sub => sub._id);
      await Subscription.updateMany(
        { _id: { $in: orphanedIds } },
        { isDeleted: true }
      );

      console.log(
        `✅ Cleaned up ${orphanedSubscriptions.length} orphaned subscriptions`
      );
    } else {
      console.log('✅ No orphaned subscriptions found');
    }
  } catch (error) {
    console.error('❌ Error in cleanup job:', error);
  }
};

export { processExpiredSubscriptions, sendSubscriptionReminders };
