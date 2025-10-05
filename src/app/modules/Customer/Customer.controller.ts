import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CustomerServices } from './Customer.service';

const createCustomer = catchAsync(async (req, res) => {
  const { Customer: CustomerData } = req.body;
  const result = await CustomerServices.createCustomerIntoDB(CustomerData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer is created successfully',
    data: result
  });
});

const getSingleCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CustomerServices.getSingleCustomerFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer is retrieved successfully',
    data: result
  });
});

const getAllCustomers = catchAsync(async (req, res) => {
  const result = await CustomerServices.getAllCustomersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customers are retrieved successfully',
    meta: result.meta,
    data: result.result
  });
});

const updateCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { Customer } = req.body;
  const result = await CustomerServices.updateCustomerIntoDB(id, Customer);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer is updated successfully',
    data: result
  });
});

const deleteCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CustomerServices.deleteCustomerFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer is deleted successfully',
    data: result
  });
});

const getMyNotifications = catchAsync(async (req, res) => {
  const { userEmail } = req.user;
  const result = await CustomerServices.getCustomerNotificationsFromDB(
    userEmail
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result
  });
});

export const CustomerControllers = {
  createCustomer,
  getSingleCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  getMyNotifications
};
