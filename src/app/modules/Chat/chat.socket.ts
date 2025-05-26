/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from "socket.io";
import { ChatServices } from "./Chat.service";

const connectedUsers: any = {}; // Store userId -> socketId
const userStatus: any = {}; // Store userId -> socketId

// Helper function to generate a unique roomId
const generateRoomId = (userId: string, otherUserId: string): string => {
  return [userId, otherUserId].sort().join("_"); // Unique room ID
};

export const initializeChatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {

    // Register user
    socket.on("register", ({ userId, name }) => {
      if (!userId) return;
      connectedUsers[userId] = socket.id; // Map userId to socket ID
      socket.data = { userId, name }; // Store user details in socket

      userStatus[userId] = true    ; // Mark user as online

      // Notify other users that this user is onlinesection 
      socket.broadcast.emit("userStatusChange", { userId, status: "online" });
    });

    // Join room
    socket.on("joinChat", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
    });

    // Handle chat messages
    socket.on("chatMessage", async (data) => {
      const { sender, receiver, fileUrl, message } = data;

      if (!sender || !receiver) return; // Validate data
      const roomId = generateRoomId(sender, receiver);

      // Save message to the database
      const chatMessage = await ChatServices.createChatIntoDB({
        sender,
        receiver,
        message,
        image: fileUrl,
        isRead: false,
      });

      console.log("📤 Sending message to frontend:", chatMessage.toObject());

      // Emit the message to the room
      io.to(roomId).emit("receiveMessage", chatMessage.toObject());
    });

    // Mark messages as read
    socket.on("markAsRead", async ({ sender, receiver }) => {
      await ChatServices.markMessagesAsReadIntoDB(sender, receiver);
      const roomId = generateRoomId(sender, receiver);
      io.to(roomId).emit("messagesRead", { sender, receiver });
      console.log(`Messages marked as read for room ${roomId}`);
    });

    // Handle disconnection
    // socket.on("disconnect", () => {
    //   console.log(`User Disconnected: ${socket.id}`);
    //   Object.keys(connectedUsers).forEach((key) => {
    //     if (connectedUsers[key] === socket.id) {
    //       // Mark user as offline when they disconnect
    //       userStatus[key] = false;
    //       delete connectedUsers[key];

    //           // Notify other users that this user is offline
    //           socket.broadcast.emit("userStatusChange", { userId: key, status: "offline" });
    //     }
    //   });
    // });


    socket.on("disconnect", () => {
      console.log(`User Disconnected: ${socket.id}`);
      Object.keys(connectedUsers).forEach((key) => {
        if (connectedUsers[key] === socket.id) {
          // Mark user as offline when they disconnect
          userStatus[key] = false;
          delete connectedUsers[key];
    
          // Notify other users that this user is offline
          socket.broadcast.emit("userStatusChange", { userId: key, status: "offline" });
        }
      });
    });



  });
};
