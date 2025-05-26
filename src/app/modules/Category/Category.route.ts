import express, { NextFunction, Request, Response } from 'express';
import { CategoryControllers } from './Category.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createCategoryValidationSchema, updateCategoryValidationSchema } from './Category.validation';
import { uploadFileS3 } from '../../utils/UploaderS3';

const router = express.Router();

router.post(
  '/create-category',
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
  validateRequest(createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

router.get(
  '/:id',
  CategoryControllers.getSingleCategory,
);

router.patch(
  '/:id',
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
  validateRequest(updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);

router.delete(
  '/:id',
  CategoryControllers.deleteCategory,
);

router.get(
  '/',
  CategoryControllers.getAllCategorys,
);

export const CategoryRoutes = router;
