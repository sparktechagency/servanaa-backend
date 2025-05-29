import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CategoryServices } from './Category.service';

const createCategory = catchAsync(async (req, res) => {
  const category = req.body;
  const result = await CategoryServices.createCategoryIntoDB(category, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category is created successfully',
    data: result,
  });
});

const getSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.getSingleCategoryFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category is retrieved successfully',
    data: result,
  });
});

const getAllCategorys = catchAsync(async (req, res) => {
  const result = await CategoryServices.getAllCategorysFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categorys are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const  category = req.body;
  const result = await CategoryServices.updateCategoryIntoDB(id, category, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category is updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.deleteCategoryFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category is deleted successfully',
    data: result,
  });
});

export const CategoryControllers = {
  createCategory,
  getSingleCategory,
  getAllCategorys,
  updateCategory,
  deleteCategory,
};
