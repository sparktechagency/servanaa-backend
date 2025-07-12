import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import mongoose from 'mongoose';
import seedSuperAdmin from './app/DB/index';
import config from './app/config/index';
import { initializeChatSocket } from './app/modules/Chat/chat.socket';
// let server: Server;
const server = http.createServer(app);
async function main() {
  try {
    // await mongoose.connect('mongodb://127.0.0.1:27017/servana');
    // await mongoose.connect('mongodb://localhost:27017/servana');
    await mongoose.connect(config.database_url as string);
    const port = config.port || 3000; // Default to 3000 if undefined

    await seedSuperAdmin();

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        //   origin: "*", // Replace with frontend URL
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://your-production-url.com',
        ], // Ensure this is correct for Next.js frontend
        methods: ['GET', 'POST'],
      },
    });

    // Attach chat socket handlers
    initializeChatSocket(io);

    // Start the server
    server.listen(port, () => {
      console.log(`🚀 Server is running on http://10.0.60.52:${port}`);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
}

// Handle server shutdown gracefully
main();

process.on('unhandledRejection', (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  // if (server) {
  //   server.close(() => {
  //     process.exit(1);
  //   });
  // }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing server...');
  server.close(() => console.log('Server closed.'));
});
