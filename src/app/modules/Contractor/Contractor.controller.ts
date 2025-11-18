import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ContractorServices } from './Contractor.service';

const getSingleContractor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContractorServices.getSingleContractorFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contractor is retrieved successfully',
    data: result
  });
});

const getAllContractors = catchAsync(async (req, res) => {
  // const subCategory = req.body;
  const result = await ContractorServices.getAllContractorsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contractors are retrieved successfully',
    meta: result.meta,
    data: result.result
  });
});

const getAllAvailableContractors = catchAsync(async (req, res) => {
  // const subCategory = req.body;
  const result = await ContractorServices.getAllAvailableContractorsFromDB(
    req.query
  );
  // const result = await ContractorServices.getAllContractorsFromDB(subCategory, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contractors are retrieved successfully',
    // meta: result.meta,
    data: result.result
  });
});

const updateContractor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { Contractor } = req.body;
  const result = await ContractorServices.updateContractorIntoDB(
    id,
    Contractor
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contractor is updated successfully',
    data: result
  });
});

const deleteContractor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContractorServices.deleteContractorFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contractor is deleted successfully',
    data: result
  });
});

const createMaterials = catchAsync(async (req, res) => {
  const { userEmail } = req.user;
  const material = req.body;
  const result = await ContractorServices.createMaterials(
    userEmail,
    material
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Material create successfully',
    data: result
  });
});


const updateMaterials = catchAsync(async (req, res) => {
  const { userEmail } = req.user;
  const material = req.body;
  const result = await ContractorServices.updateMaterials(userEmail, material);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Material is updated successfully',
    data: result
  });
});
const deleteMaterials = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContractorServices.deleteMaterials(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Material is deleted successfully',
    data: result
  });
});

// ===================
const createSupport = catchAsync(async (req, res) => {
  const { userEmail } = req.user;
  const payload = req.body;
  const result = await ContractorServices.createSupport(userEmail, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Create successfully',
    data: result
  });
});


const getAllSupport = catchAsync(async (req, res) => {

  const query = req.query;
  const result = await ContractorServices.getAllSupport(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved successfully',
    data: result
  });
});

export const ContractorControllers = {
  createSupport,
  getAllSupport,
  createMaterials,
  updateMaterials,
  deleteMaterials,
  getSingleContractor,
  getAllContractors,
  updateContractor,
  deleteContractor,
  getAllAvailableContractors
};
