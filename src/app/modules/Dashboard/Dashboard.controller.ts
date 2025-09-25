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
    .populate<{ userId: typeof User }>({
      path: 'userId',
      select: 'fullName email contactNo img status'
    })
    .skip(skip)
    .limit(limit);

  const total = await Contractor.countDocuments();

  // Format table data
  const table = contractors.map((contractor, idx) => ({
    serial: `#${contractor._id.toString().substring(0, 5)}`, // or your real serial logic
    photo: contractor.userId?.image,
    name: contractor.userId?.fullName,
    email: contractor.userId?.email,
    contactNumber: contractor.userId?.contactNo,
    location: contractor.location,
    status: contractor.userId?.status,
    message: 'Message', // UI label, backend can facilitate button
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

export const getCustomerTableData = catchAsync(async (req, res) => {
  // Support pagination/search
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || '';

  // Find customers and their user profiles
  const customers = await Customer.find({})
    .populate({
      path: 'userId',
      select: 'fullName email contactNo img status'
    })
    .skip(skip)
    .limit(limit);

  const total = await Customer.countDocuments();

  // Format table rows
  const table = customers.map((customer, idx) => ({
    serial: `#${customer._id.toString().substring(0, 5)}`,
    photo: customer.userId?.img,
    name: customer.userId?.fullName,
    email: customer.userId?.email,
    contactNumber: customer.userId?.contactNo,
    location: customer.location,
    status: customer.userId?.status,
    message: 'Message',
    action: customer.userId?.status === 'active' ? '✔' : '✗'
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer management table loaded',
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
    image: cat.img, // assumes your model has img/url
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
  const services = await Service.find({}).populate('subCategoryId', 'name');
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

function timeAgo (date: Date) {
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
