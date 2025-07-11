import express from 'express';
import { ChatRoomControllers } from './ChatRoom.controller';
import validateRequest from '../../middlewares/validateRequest';
import {  updateChatRoomValidationSchema } from './ChatRoom.validation';
// import { createChatRoomValidationSchema, updateChatRoomValidationSchema } from './ChatRoom.validation';

const router = express.Router();

router.post(
  '/create-chat-room',
  // validateRequest(createChatRoomValidationSchema),
  ChatRoomControllers.createChatRoom,
);

router.get(
  '/:id',
  ChatRoomControllers.getSingleChatRoom,
);

router.patch(
  '/:id',
  validateRequest(updateChatRoomValidationSchema),
  ChatRoomControllers.updateChatRoom,
);

router.delete(
  '/:id',
  ChatRoomControllers.deleteChatRoom,
);

router.get(
  '/',
  ChatRoomControllers.getAllChatRooms,
);

export const ChatRoomRoutes = router;
