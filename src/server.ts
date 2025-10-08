import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import mongoose from 'mongoose';
import seedSuperAdmin from './app/DB/index';
import config from './app/config/index';
import { initializeChatSocket } from './app/modules/Chat/chat.socket';
import seedSubscriptionPlans from './app/DB/subscription.seed';
// let server: Server;
const server = http.createServer(app);
async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    const port = config.port || 3000;

    await seedSuperAdmin();
    await seedSubscriptionPlans();

    const io = new Server(server, {
      cors: {
        origin: "*",
        // origin: [
        //   'http://localhost:5173',
        //   'http://localhost:3000',
        //   'https://your-production-url.com'
        // ],
        methods: ['GET', 'POST']
      }
    });

    initializeChatSocket(io);

    server.listen(port, () => {
      console.log(`🚀 Server is running on http://192.168.0.114:${port}`);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
}

main();

process.on('unhandledRejection', err => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err.message);
  // console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing server...');
  server.close(() => console.log('Server closed.'));
});



