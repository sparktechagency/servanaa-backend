/* eslint-disable @typescript-eslint/no-explicit-any */


import { ChatServices } from "./Chat.service";
import { Server, Socket } from "socket.io";
// Map for tracking socket connections
const onlineUsers = new Map();

export const initializeChatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    console.log(`${userId} connected`);
  }

  socket.on('sendMessage', async (data) => {
    console.log( 'after>>>>>', data)
    
    const message = await ChatServices.createChatIntoDB(data);

    const receiverSocketId = onlineUsers.get(data.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', message);
    }

  const senderSocketId = onlineUsers.get(data.sender);
  if (senderSocketId) {
    io.to(senderSocketId).emit('newMessage', message); // ✅ send to sender too
  }

  });



    socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`${userId} disconnected`);
  });

  });
};
