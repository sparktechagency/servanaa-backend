/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { ChatServices } from './Chat.service';
import sendResponse from '../../utils/sendResponse';

const createChat = catchAsync(async (req, res) => {
  const ChatData = req.body;
  const result = await ChatServices.createChatIntoDB(ChatData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chat is created successfully',
    data: result,
  });
});
const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const result = await ChatServices.uploadFiletoService(req.file as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File Upload is successful',
    data: result,
  });
});

const getUnreadMessagesCount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const count = await ChatServices.getUnreadMessagesCountFromDB(id);



  sendResponse(res as any, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chats are retrieved successfully',
    data: count,
  });
};

const markAsRead = async (req: Request, res: Response) => {
  const { sender, receiver } = req.body;
  const result = await ChatServices.markMessagesAsReadIntoDB(sender, receiver);


  sendResponse(res as any, {
    statusCode: httpStatus.OK,
    success: true,
    message: '"Messages marked as read"',
    data: result,
  });
};

const getRecentChats = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const chats = await ChatServices.getRecentChatsFromDB(id);

  sendResponse(res as any, {
    statusCode: httpStatus.OK,
    success: true,
    message: '"Messages marked as read"',
    data: chats,
  });
};

const getAllChats = catchAsync(async (req, res) => {
  const { id } = req.params; 
  const result = await ChatServices.getAllChatsFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chats are retrieved successfully',
    data: result,
  });
});


const deleteChat = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ChatServices.deleteChatFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chat is deleted successfully',
    data: result,
  });
});

export const ChatControllers = {
  createChat,
  getAllChats,
  deleteChat,
  markAsRead,
  getUnreadMessagesCount,
  getRecentChats,
  uploadFile
};
