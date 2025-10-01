import express, { NextFunction, Request, Response } from 'express';
import { SubCategoryControllers } from './SubCategory.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createSubCategoryValidationSchema,
  updateSubCategoryValidationSchema
} from './SubCategory.validation';
import { uploadFileS3 } from '../../utils/UploaderS3';

const router = express.Router();

router.post(
  '/create-sub-category',
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
  validateRequest(createSubCategoryValidationSchema),
  SubCategoryControllers.createSubCategory
);

router.get('/by-category/:categoryId', SubCategoryControllers.getAllSubCategorysByCategoryId);
router.get('/:id', SubCategoryControllers.getSingleSubCategory);

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
  validateRequest(updateSubCategoryValidationSchema),
  SubCategoryControllers.updateSubCategory
);

router.delete('/:id', SubCategoryControllers.deleteSubCategory);

router.get('/', SubCategoryControllers.getAllSubCategorys);


export const SubCategoryRoutes = router;
