import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ChatRoomServices } from './ChatRoom.service';

const createChatRoom = catchAsync(async (req, res) => {
  // const { contractorId, customerId } = req.body;
  const result = await ChatRoomServices.createChatRoomIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChatRoom is created successfully',
    data: result,
  });
});

const getSingleChatRoom = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ChatRoomServices.getSingleChatRoomFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChatRoom is retrieved successfully',
    data: result,
  });
});

const getAllMyChatRooms = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ChatRoomServices.getAllMyChatRoomsFromDB(id, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChatRooms are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});
const getAllChatRooms = catchAsync(async (req, res) => {
  const result = await ChatRoomServices.getAllChatRoomsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChatRooms are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateChatRoom = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { ChatRoom } = req.body;
  const result = await ChatRoomServices.updateChatRoomIntoDB(id, ChatRoom);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChatRoom is updated successfully',
    data: result,
  });
});

const deleteChatRoom = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ChatRoomServices.deleteChatRoomFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChatRoom is deleted successfully',
    data: result,
  });
});

export const ChatRoomControllers = {
  createChatRoom,
  getSingleChatRoom,
  getAllChatRooms,
  updateChatRoom,
  deleteChatRoom,
  getAllMyChatRooms
};
