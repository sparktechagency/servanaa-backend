/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';

import AppError from '../../errors/AppError';
import mongoose from 'mongoose';

import { Notification } from './Notification.model';
import { User } from '../User/user.model';

const createNotificationIntoDB = async (payload: any) => {
  const result = await Notification.create(payload);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Notification');
  }

  return result;
};

const getAllNotificationsFromDB = async (
  query: Record<string, any>,
  user: any
) => {
  const { userId } = query;
  const usr = await User.findById(userId);
  if (!usr) throw new Error('User not found');

  const filter: any = { userId: usr._id, isDeleted: false };

  // Role-based filtering
  if (usr?.role === 'contractor') {
    filter.type = { $in: ['bookingRequest', 'paymentTransferred'] };
  } else if (usr?.role === 'customer') {
    filter.type = { $in: ['bookingAccepted', 'bookingRejected'] };
  } else if (usr?.role === 'superAdmin') {
    filter.type = { $in: ['bookingRequest', 'workCompleted'] };
  } else {
    return {
      result: [],
      meta: { unreadCount: 0, total: 0, page: 1, limit: 10, totalPage: 0 }
    };
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(10);

  const result = notifications.map(n => {
    const notificationObj = n.toObject();
    return {
      ...notificationObj,
      isReadByUser: n.isRead.includes(usr._id) // Add convenience field
    };
  });

  const unreadCount = result.filter(
    //@ts-ignore
    n => !n.isRead.includes(usr._id.toString())
  ).length;

  return {
    result,
    meta: {
      total: result.length,
      unreadCount,
      page: 1,
      limit: 10,
      totalPage: 1
    }
  };
};

const getSingleNotificationFromDB = async (id: string) => {
  const result = await Notification.findById(id);

  return result;
};

const updateNotificationIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('notifications')
    .findOne({ _id: new mongoose.Types.ObjectId(id) });

  if (!isDeletedService) {
    throw new Error('Notification not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Notification');
  }

  const updatedData = await Notification.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true }
  );

  if (!updatedData) {
    throw new Error('Notification not found after update');
  }

  return updatedData;
};

const deleteNotificationFromDB = async (id: string) => {
  const deletedService = await Notification.findByIdAndDelete(id, {
    isDeleted: true
  });

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Notification');
  }

  return deletedService;
};

// In Notification.service.ts
const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  // Add userId to isRead array if not already present
  if (!notification.isRead.includes(userId as any)) {
    notification.isRead.push(userId as any);
    await notification.save();
  }

  return notification;
};

const markAllAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    {
      userId: userId,
      isRead: { $ne: userId }, // Only update notifications not already read by this user
      isDeleted: false
    },
    {
      $addToSet: { isRead: userId } // Add userId to isRead array if not already present
    }
  );

  return result;
};

export const NotificationServices = {
  createNotificationIntoDB,
  getAllNotificationsFromDB,
  getSingleNotificationFromDB,
  updateNotificationIntoDB,
  deleteNotificationFromDB,
  markAsRead,
  markAllAsRead
};
