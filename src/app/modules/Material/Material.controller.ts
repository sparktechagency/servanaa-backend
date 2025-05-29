import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { MaterialServices } from './Material.service';

const createMaterial = catchAsync(async (req, res) => {
    console.log(req.body, 'req.body');
  const material = req.body;
  const result = await MaterialServices.createMaterialIntoDB(material);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Material is created successfully',
    data: result,
  });
});
const updateMaterial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const material = req.body;
  const result = await MaterialServices.updateMaterialIntoDB(id,material);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Material is created successfully',
    data: result,
  });
});

const getSingleMaterial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MaterialServices.getSingleMaterialFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Material is retrieved successfully',
    data: result,
  });
});

const getAllMaterials = catchAsync(async (req, res) => {
  const result = await MaterialServices.getAllMaterialsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Materials are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const deleteMaterial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MaterialServices.deleteMaterialFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Material is deleted successfully',
    data: result,
  });
});

export const MaterialControllers = {
  createMaterial,
  getSingleMaterial, 
  getAllMaterials,
  updateMaterial,
  deleteMaterial,
};
