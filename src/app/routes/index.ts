import { Router } from 'express';
import { UserRoutes } from '../modules/User/user.route';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { OtpRoutes } from '../modules/Otp/otp.route';
import { ChatRoutes } from '../modules/Chat/Chat.route';
import { UploadRoutes } from '../modules/Upload/Upload.route';
import { ServiceRoutes } from '../modules/Service/Service.route';
import { RoleRoutes } from '../modules/Role/Role.route';
import { AboutRoutes } from '../modules/About/About.route';
import { TermRoutes } from '../modules/Term/Term.route';
import { PrivacyRoutes } from '../modules/Privacy/Privacy.route';
import { FaqRoutes } from '../modules/Faq/Faq.route';
import { CardRoutes } from '../modules/Card/Card.route';
import { AddressRoutes } from '../modules/Address/Address.route';
import { PreferenceRoutes } from '../modules/Preference/Preference.route';
import { ReviewRoutes } from '../modules/Review/Review.route';
import { FavouriteRoutes } from '../modules/Favourite/Favourite.route';
import { BookingRoutes } from '../modules/Booking/Booking.route';
import { ExperienceRoutes } from '../modules/Experience/Experience.route';
import { CategoryRoutes } from '../modules/Category/Category.route';
import { PaymentRoutes } from '../modules/Payment/Payment.route';

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
    path: '/roles',
    route: RoleRoutes,
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
    path: '/faqs',
    route: FaqRoutes,
  },
  {
    path: '/cards',
    route: CardRoutes,
  },
  {
    path: '/addresses',
    route: AddressRoutes,
  },
  {
    path: '/preferences',
    route: PreferenceRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/favourites',
    route: FavouriteRoutes,
  },
  {
    path: '/bookings',
    route: BookingRoutes,
  },
  {
    path: '/experiences',
    route: ExperienceRoutes, //Routes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
