import { Router } from 'express';
import { UserRoutes } from '../modules/User/user.route';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { OtpRoutes } from '../modules/Otp/otp.route';
import { ChatRoutes } from '../modules/Chat/Chat.route';
import { UploadRoutes } from '../modules/Upload/Upload.route';
import { ServiceRoutes } from '../modules/Service/Service.route';
import { AboutRoutes } from '../modules/About/About.route';
import { TermRoutes } from '../modules/Term/Term.route';
import { PrivacyRoutes } from '../modules/Privacy/Privacy.route';
import {  QuestionRoutes } from '../modules/Question/Question.route';
import { CardRoutes } from '../modules/Card/Card.route';
import { ReviewRoutes } from '../modules/Review/Review.route';
import { BookingRoutes } from '../modules/Booking/Booking.route';
import { CategoryRoutes } from '../modules/Category/Category.route';
import { PaymentRoutes } from '../modules/Payment/Payment.route';
import { SubCategoryRoutes } from '../modules/SubCategory/SubCategory.route';
import { MaterialRoutes } from '../modules/Material/Material.route';
import { CancelRoutes } from '../modules/Cancel/Cancel.route';
import { NotificationRoutes } from '../modules/Notification/Notification.route';
import { HelpRoutes } from '../modules/Help/Help.route';
import { ContractorRoutes } from '../modules/Contractor/Contractor.route';
import { MyScheduleRoutes } from '../modules/MySchedule/MySchedule.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/otps',
    route: OtpRoutes,
  },
  {
    path: '/services',
    route: ServiceRoutes,
  },
  {
    path: '/chats',
    route: ChatRoutes,
  },
  {
    path: '/upload',
    route: UploadRoutes,
  },
  {
    path: '/abouts',
    route: AboutRoutes,
  },
  {
    path: '/terms',
    route: TermRoutes,
  },
  {
    path: '/privacies',
    route: PrivacyRoutes,
  },
  {
    path: '/questions',
    route: QuestionRoutes,
  },
  {
    path: '/cards',
    route: CardRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/bookings',
    route: BookingRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/sub-categories',
    route: SubCategoryRoutes,
  },
  {
    path: '/materials',
    route: MaterialRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
  {
    path: '/cancels',
    route: CancelRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/helps',
    route: HelpRoutes,
  },
  {
    path: '/contractors',
    route: ContractorRoutes,
  },
  {
    path: '/availabilities',
    route: MyScheduleRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
