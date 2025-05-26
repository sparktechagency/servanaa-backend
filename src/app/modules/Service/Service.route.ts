import express from 'express';
// import express, { NextFunction, Request, Response } from 'express';
import { ServiceControllers } from './Service.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createServiceValidationSchema, updateServiceValidationSchema } from './Service.validation';
// import { uploadFileS3 } from '../../utils/UploaderS3';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.post(
  '/create-service',
  //  uploadFileS3(true).single('file'),
    // (req: Request, res: Response, next: NextFunction) => {
    //   if (req.body.data) {
    //     try {
    //       req.body = JSON.parse(req.body.data);
    //     } catch (error) {
    //       next(error);
    //     }
    //   }
    //   next();
    // },
  auth(USER_ROLE.superAdmin),
  validateRequest(createServiceValidationSchema),
  ServiceControllers.createService,
);

router.get(
  '/:id',
  ServiceControllers.getSingleService,
);

router.patch(
  '/:id',
  // uploadFileS3(true).single('file'),
  // (req: Request, res: Response, next: NextFunction) => {
  //   if (req.body.data) {
  //     try {
  //       req.body = JSON.parse(req.body.data);
  //     } catch (error) {
  //       next(error);
  //     }
  //   }
  //   next();
  // },
  auth(USER_ROLE.superAdmin),
  validateRequest(updateServiceValidationSchema),
  ServiceControllers.updateService,
);

router.delete(
  '/:id',
  auth(USER_ROLE.superAdmin),
  ServiceControllers.deleteService,
);

router.get(
  '/',
  ServiceControllers.getAllServices,
);

export const ServiceRoutes = router;
