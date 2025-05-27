/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { NextFunction, Response, Request } from 'express';
import { UserControllers } from './user.controller';
import { USER_ROLE } from './user.constant';
import auth from '../../middlewares/auth';
import { uploadFileS3 } from '../../utils/UploaderS3';

// import express from 'express';
// import validateRequest from '../../middlewares/validateRequest';
// import { upladFileS3 } from '..\..\utils\UploaderS3';

const router = express.Router();
router.post(
  '/create-customer', 
   UserControllers.createCustomer,
);
router.post(
  '/create-contractor', 
    UserControllers.createContractor,
);

router.get(
  '/me',
  auth(USER_ROLE.superAdmin,  USER_ROLE.customer,  USER_ROLE.contractor),
  UserControllers.getMe,
);

router.post(
  '/change-status/:id',
  auth(USER_ROLE.superAdmin),
  // validateRequest(UserValidation.changeStatusValidationSchema),
  UserControllers.changeStatus,
);

router.patch(
  '/:id',
  auth(USER_ROLE.superAdmin,  USER_ROLE.customer,  USER_ROLE.contractor),
  uploadFileS3(true).single('file'),
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
  // validateRequest(UserValidation.updateUserValidationSchema),
  UserControllers.updateUser,
);
// router.post(
//   '/add-mobile-number',
//   auth(USER_ROLE.superAdmin,  USER_ROLE.client,  USER_ROLE.provider), 
//   validateRequest(UserValidation.checkUserDataValidationSchema),
//     UserControllers.addMobileNumber,
// ); 


// router.post(
//   '/create-provider',
//   // auth(USER_ROLE.superAdmin),
//   validateRequest(UserValidation.createUserValidationSchema),
//     UserControllers.createProvider,
// );


// router.patch(
//   '/approval/:id',
//   // auth(USER_ROLE.superAdmin, USER_ROLE.admin, USER_ROLE.client, USER_ROLE.supervisor, USER_ROLE.technician),
//   // uploadFileS3(true).single('file'),
//   // (req: Request, res: Response, next: NextFunction) => {
//   //   if (req.body.data) {
//   //     try {
//   //       req.body = JSON.parse(req.body.data);
//   //     } catch (error) {
//   //       next(error);
//   //     }
//   //   }
//   //   next();
//   // },
//   // validateRequest(UserValidation.updateUserValidationSchema),
//   UserControllers.updateApproval,
// );

// router.get(
//   '/users-monthly',
//   auth(USER_ROLE.superAdmin),
//   UserControllers.getUsersMonthly,
// );

// router.delete(
//   '/:id',
//   auth(USER_ROLE.superAdmin),
//   UserControllers.deleteUser,
// );

// router.get(
//   '/',
//   auth(USER_ROLE.superAdmin),
//   UserControllers.getAllUsers,
// );
// router.get(
//   '/get-providers',
//   auth(USER_ROLE.superAdmin, USER_ROLE.client),
//   UserControllers.getAllProviders,
// );
// router.get(
//   '/prefered-providers',
//   auth(USER_ROLE.superAdmin, USER_ROLE.client),
//   UserControllers.getAllPreferedProviders,
// );

// router.get(
//   '/approval-false',
//   // auth(USER_ROLE.superAdmin),
//   UserControllers.getAllApprovalFalseUsers,
// );


// router.get(
//   '/clients',
//   auth(USER_ROLE.superAdmin),
//   UserControllers.getAllClients,
// );

// router.get(
//   '/:id',
//   auth(USER_ROLE.superAdmin, USER_ROLE.client),
//   UserControllers.getSingleUser,
// );


export const UserRoutes = router;
