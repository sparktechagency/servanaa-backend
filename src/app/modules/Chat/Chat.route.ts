import express, { NextFunction, Request, Response } from 'express';
// import { upload } from '../../utils/upload.ts';
import { ChatControllers } from './Chat.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createChatValidationSchema } from './Chat.validation';


const router = express.Router();

router.get("/upload", 
  // upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        next(error);
      }
    }
    next();
  },

ChatControllers.uploadFile
);


router.get("/:id", ChatControllers.getRecentChats);

router.get("/unread/:id", ChatControllers.getUnreadMessagesCount);
router.post("/read", ChatControllers.markAsRead);



router.post(
  '/create-Chat',
  validateRequest(createChatValidationSchema),
  ChatControllers.createChat,
);

router.delete(
  '/:id',
  ChatControllers.deleteChat,
);

router.get(
  '/:id/messages',
  ChatControllers.getAllChats,
);

export const ChatRoutes = router;
