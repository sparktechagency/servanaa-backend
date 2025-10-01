import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SubCategoryServices } from './SubCategory.service';

const createSubCategory = catchAsync(async (req, res) => {
  const subcategory = req.body;
  const result = await SubCategoryServices.createSubCategoryIntoDB(subcategory, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory is created successfully',
    data: result,
  });
});

const getSingleSubCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubCategoryServices.getSingleSubCategoryFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory is retrieved successfully',
    data: result,
  });
});

const getAllSubCategorys = catchAsync(async (req, res) => {
  const result = await SubCategoryServices.getAllSubCategorysFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategorys are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateSubCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const subcategory = req.body;
  const result = await SubCategoryServices.updateSubCategoryIntoDB(id, subcategory, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory is updated successfully',
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubCategoryServices.deleteSubCategoryFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategory is deleted successfully',
    data: result,
  });
});

const getAllSubCategorysByCategoryId = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await SubCategoryServices.getAllSubCategorysByCategoryIdFromDB(categoryId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SubCategories are retrieved successfully',
    // meta: result.meta,
    data: result,
  });
});

export const SubCategoryControllers = {
  createSubCategory,
  getSingleSubCategory,
  getAllSubCategorys,
  updateSubCategory,
  deleteSubCategory,
  getAllSubCategorysByCategoryId
};
