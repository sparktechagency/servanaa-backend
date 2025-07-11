/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CHATROOM_SEARCHABLE_FIELDS } from './ChatRoom.constant';
import mongoose from 'mongoose';
import { ChatRoom } from './ChatRoom.model';

const createChatRoomIntoDB = async (
  payload: any,
) => {

    const { contractorId, customerId } = payload;

  let room = await ChatRoom.findOne({
    participants: { $all: [contractorId, customerId] },
  });

  if (!room) {
    room = await ChatRoom.create({ participants: [contractorId, customerId] });
  }

  
  if (!room) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create ChatRoom');
  }

  return room;
};

const getAllChatRoomsFromDB = async (query: Record<string, unknown>) => {
  const ChatRoomQuery = new QueryBuilder(
    ChatRoom.find(),
    query,
  )
    .search(CHATROOM_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ChatRoomQuery.modelQuery;
  const meta = await ChatRoomQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleChatRoomFromDB = async (id: string) => {
  const result = await ChatRoom.findById(id);

  return result;
};

const updateChatRoomIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('chatrooms')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('ChatRoom not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted ChatRoom');
  }

  const updatedData = await ChatRoom.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('ChatRoom not found after update');
  }

  return updatedData;
};

const deleteChatRoomFromDB = async (id: string) => {
  const deletedService = await ChatRoom.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete ChatRoom');
  }

  return deletedService;
};

export const ChatRoomServices = {
  createChatRoomIntoDB,
  getAllChatRoomsFromDB,
  getSingleChatRoomFromDB,
  updateChatRoomIntoDB,
  deleteChatRoomFromDB,
};
