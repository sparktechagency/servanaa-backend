/* eslint-disable @typescript-eslint/no-explicit-any */
// middlewares/requireActiveSubscription.ts
import { Contractor } from '../modules/Contractor/Contractor.model';
import httpStatus from 'http-status';
import AppError from '../errors/AppError';
import { User } from '../modules/User/user.model';

export const requireActiveSubscription = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    const userInfo = req.user;
    const { userEmail } = userInfo;

    const userData = await User.findOne({ email: userEmail }).populate<{
      contractor: {
        subscriptionStatus: string;
        hasActiveSubscription: boolean;
      };
    }>({
      path: 'contractor',
      model: Contractor
    });

    if (!userData || !userData.contractor) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (
      userData.contractor.subscriptionStatus === 'inactive' ||
      userData.contractor.hasActiveSubscription === false
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You need an active subscription to proceed.'
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
