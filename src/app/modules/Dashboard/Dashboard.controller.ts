/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
// src/app/modules/Dashboard/Dashboard.controller.ts

import { User } from '../User/user.model';
import {
  Subscription,
  SubscriptionPlan
} from '../Subscription/Subscription.model';
import { Contractor } from '../Contractor/Contractor.model';
import { Booking } from '../Booking/Booking.model';
import catchAsync from '../../utils/catchAsync';
import httpStatus from 'http-status';
import sendResponse from '../../utils/sendResponse';
import { Customer } from '../Customer/Customer.model';
import { Category } from '../Category/Category.model';
import { SubCategory } from '../SubCategory/SubCategory.model';
import { Service } from 'aws-sdk';
import { Notification } from '../Notification/Notification.model';
import moment from 'moment';
import { Banner, CostAdmin } from './Dashboard.model';
import { Transaction } from '../Transaction/transaction.model';
import AppError from '../../errors/AppError';

export const getDashboardData = catchAsync(async (req, res) => {
  const totalUser = await User.countDocuments({ isDeleted: false });
  const totalIncomeResult = await Subscription.aggregate([
    { $match: { status: 'active', isDeleted: false } },
    { $group: { _id: null, sum: { $sum: '$price' } } }
  ]);
  const totalIncome = totalIncomeResult[0]?.sum || 0;

  const incomeByPlan = await Subscription.aggregate([
    { $match: { status: 'active', isDeleted: false } },
    {
      $group: { _id: '$planType', sum: { $sum: '$price' }, count: { $sum: 1 } }
    }
  ]);
  // Map plan stats to Basic/Premium
  const plans = ['basic', 'premium'];
  const planStatsArray = await Promise.all(
    plans.map(async plan => {
      const found = incomeByPlan.find(p => p._id === plan);
      const income = found?.sum || 0;
      const userCount = await Contractor.countDocuments({
        subscriptionStatus: 'active',
        planType: plan,
        isDeleted: false
      });
      return { plan, income, userCount };
    })
  );

  const planStats: { [key: string]: { income: number; userCount: number } } =
    {};
  for (const stat of planStatsArray) {
    planStats[stat.plan] = { income: stat.income, userCount: stat.userCount };
  }

  // 4. Daily Service Usage (Booking count by day, for last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }).reverse();

  const dailyService = await Promise.all(
    last7Days.map(async (day, idx) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = await Booking.countDocuments({
        bookingDate: { $gte: day, $lt: nextDay },
        isDeleted: false
      });
      return { day: idx + 1, count };
    })
  );

  // 5. Most Frequently Booked Service (by subCategoryId name)
  const mostUsedServiceAgg = await Booking.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$subCategoryId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  // Lookup subCategory names (assuming subCategoryId is populated elsewhere)
  const mostUsedServices = await Promise.all(
    mostUsedServiceAgg.map(async svc => {
      // In practice, populate subCategory name via DB call
      // Replace with your actual subCategory model query
      // const name = await SubCategory.findById(svc._id).select('name');
      return { name: svc._id, count: svc.count }; // Replace with real name
    })
  );

  // 6. Contractor breakdown (by plan)
  const contractorCounts: { [key: string]: number } = {};
  for (const plan of plans) {
    contractorCounts[plan] = await Contractor.countDocuments({
      subscriptionStatus: 'active',
      planType: plan,
      isDeleted: false
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard summary data loaded successfully',
    data: {
      totalUser,
      totalIncome,
      planStats,
      dailyService,
      mostUsedServices,
      contractorCounts
    }
  });
});

export const getAllSubscriptionPlansTable = catchAsync(async (req, res) => {
  // Fetch all subscription plans, active or all (update filter as necessary)
  const plans = await SubscriptionPlan.find({
    /* isActive: true */
  }).sort({ createdAt: 1 });

  // Build table data format
  const tableData = plans.map((plan, idx) => ({
    slNo: idx + 1,
    subscriptionPlan: plan.name,
    price: `$${plan.price.toFixed(2)}`,
    duration:
      plan.duration === 1
        ? 'Monthly'
        : plan.duration === 6
          ? '06 Month'
          : plan.duration === 12
            ? 'Yearly'
            : `${plan.duration} Month(s)`,
    contractorFeePerMonth: '$50', // If static, else fetch from plan field
    action: 'Edit' // This would be a frontend action based on plan._id
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan table data loaded successfully',
    data: tableData
  });
});

export const getContractorTableData = catchAsync(async (req, res) => {
  // Support pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Search & filter support (optional)
  const search = (req.query.search as string) || '';

  // Find contractors with user info
  const contractors = await Contractor.find({})
    .populate({
      path: 'userId',
      select: 'fullName email contactNo img status'
    })
    .skip(skip)
    .limit(limit)
    .lean();

  console.log('Contractor table data: ', contractors);

  const total = await Contractor.countDocuments();

  // Format table data
  const table = contractors.map((contractor: any, idx: number) => ({
    serial: `#${contractor._id.toString().substring(0, 5)}`,
    photo: contractor.userId?.img ?? '', // <-- FIXED: img not image
    name: contractor.userId?.fullName ?? '',
    email: contractor.userId?.email ?? '',
    contactNumber: contractor.userId?.contactNo ?? '',
    location: contractor.location ?? '',
    status: contractor.userId?.status ?? '',
    message: 'Message',
    action: contractor.userId?.status === 'active' ? '✔' : '✗'
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contractor management table loaded',
    data: {
      table,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

export const getCategoryTable = catchAsync(async (req, res) => {
  const categories = await Category.find({});
  const data = categories.map((cat, idx) => ({
    serial: idx + 1,
    name: cat.name,
    image: cat.img,
    action: 'edit'
  }));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category table loaded',
    data
  });
});

export const getSubCategoryTable = catchAsync(async (req, res) => {
  const subcategories = await SubCategory.find({}).populate(
    'categoryId',
    'name'
  );
  const data = subcategories.map((sub, idx) => ({
    serial: idx + 1,
    name: sub.name,
    // @ts-ignore
    category: sub.categoryId?.name ?? '',
    image: sub.img,
    action: 'edit'
  }));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subcategory table loaded',
    data
  });
});

export const getServiceTable = catchAsync(async (req, res) => {
  // @ts-ignore
  const services = await Service.find({}).populate('subCategoryId', 'name');
  // @ts-ignore
  const data = services.map((srv, idx) => ({
    serial: idx + 1,
    name: srv.name,
    subCategory: srv.subCategoryId?.name ?? '',
    action: 'edit'
  }));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service table loaded',
    data
  });
});

export const getAllAdminNotifications = catchAsync(async (req, res) => {
  // Pagination support
  const page = parseInt(String(req.query.page || '1'));
  const limit = parseInt(String(req.query.limit || '10'));
  const skip = (page - 1) * limit;

  // Find all (non-deleted) admin notifications
  const filter = { isDeleted: false };
  // Only admin-type notifications (e.g., new user, system events)
  // Optionally filter: filter.type = { $in: ["..."] };

  const total = await Notification.countDocuments(filter);

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Map to UI fields
  const data = notifications.map(n => ({
    message: n.message,
    // @ts-ignore
    timeAgo: timeAgo(n.createdAt)
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All admin notifications loaded',
    data: {
      total,
      notifications: data,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

function timeAgo(date: Date) {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);

  return `${days} days ago`;
}

export const getTransactionHistoryTable = catchAsync(async (req, res) => {
  // Support pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Properly populate contractor and user reference
  const subscriptions = await Subscription.find({
    status: {
      $in: [
        'active',
        'paid',
        'completed',
        'failed',
        'cancelled',
        'expired',
        'pending',
        'processing'
      ]
    },
    isDeleted: false
  })
    .populate({
      path: 'contractorId',
      populate: { path: 'userId', select: 'fullName img' }
    })
    .populate({
      path: 'planType' // or use logic below to read from plan collection
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // use lean for plain objects to avoid TypeScript confusion

  // Fetch all SubscriptionPlans for mapping plan prices if needed
  const allPlans = await SubscriptionPlan.find({}).lean();

  const tableData = subscriptions.map((sub: any, idx: number) => {
    // Defensive checks
    const contractor = sub.contractorId || {};
    const user = contractor.userId || {};
    const planType = sub.planType || '';
    // Find plan price by planType
    const planDetails = allPlans.find(p => p.type === planType);
    const paidAmount = planDetails ? planDetails.price : 0;
    // Format paymentStatus
    let paymentStatus = 'Failed';
    if (sub.status === 'active') paymentStatus = 'Paid';
    else if (['pending', 'processing'].includes(sub.status))
      paymentStatus = 'Accept';

    return {
      serial: `#${sub._id.toString().substring(0, 5)}`,
      photo: user.img ?? '',
      name: user.fullName ?? '',
      contractorType: planType.charAt(0).toUpperCase() + planType.slice(1),
      dateOfPayment: sub.updatedAt
        ? moment(sub.updatedAt).format('MM/DD/YY')
        : '',
      paymentType: 'Online Payment',
      paymentStatus,
      paidAmount: `$${paidAmount.toFixed(2)}`
    };
  });

  const total = await Subscription.countDocuments({
    status: {
      $in: [
        'active',
        'paid',
        'completed',
        'failed',
        'cancelled',
        'expired',
        'pending',
        'processing'
      ]
    },
    isDeleted: false
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Transaction history loaded',
    data: {
      table: tableData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// ✅ Create a new subscription
export const createSubscription = catchAsync(async (req, res) => {
  try {

    const newSub = await SubscriptionPlan.create(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Subscription create successfully.',
      data: newSub
    });

  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const updateSubscription = catchAsync(async (req, res) => {
  try {
    const updatedSub = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedSub)
      return res.status(404).json({ success: false, message: 'Not found' });
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Subscription update successfully.',
      data: updatedSub
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const deleteSubscription = catchAsync(async (req, res) => {
  try {
    const deleted = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!deleted)
      return res.status(404).json({ success: false, message: 'Not found' });
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Subscription delete successfully.',
      data: deleted
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =======================
// CREATE BANNER
// =======================
export const createBannerIntoDB = catchAsync(async (req, res) => {
  try {

    const newBanner = await Banner.create(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Banner created successfully.',
      data: newBanner,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =======================
// GET ALL BANNERS
// =======================
export const getAllBannersFromDB = catchAsync(async (req, res) => {
  const banners = await Banner.find()
    .populate('category', 'name')
    .populate('subCategory', 'name')
    .sort({ createdAt: -1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banners retrieved successfully.',
    data: banners,
  });
});

// =======================
// UPDATE BANNER
// =======================
export const updateBannerIntoDB = catchAsync(async (req, res) => {
  const { id } = req.params;

  const updatedBanner = await Banner.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedBanner) {
    return res.status(404).json({
      success: false,
      message: 'Banner not found.',
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner updated successfully.',
    data: updatedBanner,
  });
});

// =======================
// DELETE BANNER
// =======================
export const deleteBannerFromDB = catchAsync(async (req, res) => {
  const { id } = req.params;

  const deletedBanner = await Banner.findByIdAndDelete(id);

  if (!deletedBanner) {
    return res.status(404).json({
      success: false,
      message: 'Banner not found.',
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner deleted successfully.',
    data: deletedBanner,
  });
});

// =======================
// DELETE BANNER
// =======================
export const totalCounts = catchAsync(async (req, res) => {

  const totalContractor = await Contractor.countDocuments();
  const totalCustomer = await Customer.countDocuments();
  const totalBooking = await Booking.countDocuments();
  const totalIncome = await Transaction.aggregate([
    { $match: { isDeleted: false, paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalActiveBooking = await Booking.countDocuments({ status: 'ongoing' });


  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Totals fetched successfully.',
    data: {
      totalContractor,
      totalCustomer,
      totalBooking,
      totalActiveBooking,
      totalIncome: totalIncome[0]?.total || 0,
    },
  });
});

export const getBookingStatsByCategory = catchAsync(async (req, res) => {
  const bookings = await Booking.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$subCategoryId',
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'subcategories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        categoryName: '$category.name',
        count: 1,
      },
    },
  ]);

  const totalBookings = bookings.reduce((sum, b) => sum + b.count, 0);

  const result = bookings.map((b) => ({
    categoryName: b.categoryName,
    count: b.count,
    percentage: ((b.count / totalBookings) * 100).toFixed(2),
  }));

  res.status(200).json({
    success: true,
    message: 'Category-wise booking stats',
    data: result,
  });
});

export const getDailyBooking = catchAsync(async (req, res) => {

  const dailyBookings = await Booking.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' }
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } } // Sort by date ascending
  ]);


  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily bookings fetched successfully.',
    data: dailyBookings
  });
});

export const createUpdateCost = catchAsync(async (req, res) => {
  const { cost } = req.body;

  if (!cost && cost !== 0) {
    throw new AppError(400, 'Cost is required.');
  }

  let costRecord = await CostAdmin.findOne();

  if (costRecord) {
    costRecord.cost = cost;
    await costRecord.save();
  } else {
    costRecord = await CostAdmin.create({ cost });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cost updated successfully.',
    data: costRecord,
  });
});

// Get Cost or Percentage
export const getPercent = catchAsync(async (req, res) => {
  const costRecord = await CostAdmin.findOne().sort({ createdAt: -1 });

  if (!costRecord) {
    throw new Error('No cost record found.');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cost fetched successfully.',
    data: { cost: costRecord.cost },
  });
});

export const approvedContactor = catchAsync(async (req, res) => {
  const { userId, status } = req.query as { userId: string; status: "approved" | "rejected" };

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { adminAccept: status },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError(404, 'User not found.');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User status updated successfully.',
    data: { user: updatedUser },
  });
});

