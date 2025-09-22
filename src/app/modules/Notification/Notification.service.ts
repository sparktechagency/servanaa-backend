/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { NOTIFICATION_SEARCHABLE_FIELDS } from './Notification.constant';
import mongoose from 'mongoose';
import { TNotification } from './Notification.interface';
import { Notification } from './Notification.model';
import { User } from '../User/user.model';

const createNotificationIntoDB = async (
  payload: any,
) => {

  

  const result = await Notification.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Notification');
  }

  return result;
};

const getAllNotificationsFromDB = async (query: Record<string, any>, user: any) => {
  const { userEmail } = user;
  const usr =  await User.findOne({email: userEmail});
    if (!usr) throw new Error('User not found');

// console.log(usr, 'usr');

  // Base filter: exclude deleted notifications
  const filter: any = { isDeleted: false };

    // Get the user's joinedDate (in case it's used for filtering in all cases)
  // const joinedDate = new Date(usr.joinedDate);

  // Apply role-based filtering rules
  if (usr?.role === 'contractor') {
    
  console.log( 'admin', usr);
    // Admin sees only notifications of type 'newRequest'
    filter.type = 'newRequest';
    // Apply the filter for joinedDate (i.e., show only notifications after the user's joinedDate)
    // filter.createdAt = { $gte: joinedDate };

  } else if (usr?.role === 'customer') {
    // console.log( 'member', usr);
    // if (!usr.familyName) throw new Error('familyName is required for member role');

    // const safeFamilyName = typeof usr.familyName === 'string' ? usr.familyName : String(usr.familyName);

    // console.log("safeFamilyName", safeFamilyName)

// Ensure the user is only seeing notifications after they joined
    // const joinedDate = new Date(usr.joinedDate);

    //   filter.$or = [
    //   // { type: 'newEvent' },
    //    { type: 'newEvent', createdAt: { $gte: joinedDate } },
    //   {
    //     type: 'newJoined',
    //     targetFamilyName: { $regex: `^${safeFamilyName}$`, $options: 'i' },
    //     createdAt: { $gte: joinedDate } // Only show newJoined notifications after joinedDate
    //   }
    // ];
    } else {
     return {
       result: [],
       meta: {
        unreadCount: 0,
        total: 0,
        page: 1,
        limit: 10,
        totalPage: 0
       }
     };
   }

  // Query the database using the filter
  // Sorting by latest createdAt first, limit 10 (you can implement pagination if needed)
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(10);


  // For each notification, check if the current userId exists in readBy array
      const result = notifications.map(n => {
      // const isRead = Array.isArray(n.readBy) && n.readBy.some(id => id.toString() === usr?._id.toString()); // ✅ safe check
      // const isRead = Array.isArray(n.readBy) && n.readBy.some(id => id.toString() === userId); // ✅ safe check


    // Return notification object with new isRead flag
    return {
      ...n.toObject(),
      // isRead,
    };
  });

  // Count how many notifications are unread
  const unreadCount = result.filter(n => !n.isRead).length;

  // Meta info about pagination + unread count
  const meta = {
    total: result.length,  // total notifications returned
    unreadCount,          // how many are unread
    page: 1,
    limit: 10,
    totalPage: 1,
  };

  // Return notifications + meta info
  return { result, meta };
};
// const getAllNotificationsFromDB = async (query: Record<string, unknown>) => {
//   const NotificationQuery = new QueryBuilder(
//     Notification.find(),
//     query,
//   )
//     .search(NOTIFICATION_SEARCHABLE_FIELDS)
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await NotificationQuery.modelQuery;
//   const meta = await NotificationQuery.countTotal();
//   return {
//     result,
//     meta,
//   };
// };

const getSingleNotificationFromDB = async (id: string) => {
  const result = await Notification.findById(id);

  return result;
};

const updateNotificationIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('notifications')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
    );

  if (!isDeletedService) {
    throw new Error('Notification not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Notification');
  }

  const updatedData = await Notification.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Notification not found after update');
  }

  return updatedData;
};

const deleteNotificationFromDB = async (id: string) => {
  const deletedService = await Notification.findByIdAndDelete(
    id,
    { isDeleted: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Notification');
  }

  return deletedService;
};

export const NotificationServices = {
  createNotificationIntoDB,
  getAllNotificationsFromDB,
  getSingleNotificationFromDB,
  updateNotificationIntoDB,
  deleteNotificationFromDB,
};
