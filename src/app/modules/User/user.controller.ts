/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { UserServices } from './user.service';
import sendResponse from '../../utils/sendResponse';
import config from '../../config';

// const addMobileNumber = catchAsync(async (req, res) => {
//   const { user: userData } = req.body;
//   const result = await UserServices.addMobileNumberIntoDB(userData, req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Client is created succesfully and OTP sent',
//     data: result,
//   });
// });
const createCustomer = catchAsync(async (req, res) => {
  const userData = req.body;
  const result = await UserServices.createCustomerIntoDB(userData);
  const { refreshToken, accessToken, userCustomer: user } = result;

  // const { refreshToken, accessToken, needsPasswordChange } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: config.NODE_ENV === 'production',
    // secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 365
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer is created and otp is send succesfully!',
    data: { accessToken, user }
  });
});

const createContractor = catchAsync(async (req, res) => {
  const userData = req.body;
  const result = await UserServices.createContractorIntoDB(userData);
  const { refreshToken, accessToken, populatedContractor: user } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: config.NODE_ENV === 'production',
    // secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 365
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contractor is created and otp is send succesfully!',
    data: {
      accessToken,
      user
    }
  });
});

const getMe = catchAsync(async (req, res) => {
  const { userEmail } = req.user;

  const result = await UserServices.getMe(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User is retrieved succesfully',
    data: result
  });
});
const getSingleUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserServices.getSingleUserIntoDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User is retrieved succesfully',
    data: result
  });
});
const changeStatus = catchAsync(async (req, res) => {
  const id = req.params.id;

  const result = await UserServices.changeStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Status is updated succesfully',
    data: result
  });
});
const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users are retrieved succesfully',
    meta: result.meta,
    data: result.result
  });
});
// const getAllApprovalFalseUsers = catchAsync(async (req, res) => {
//   const result = await UserServices.getAllApprovalFalseUsersFromDB(req.query);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Users are retrieved succesfully',
//     meta: result.meta,
//     data: result.result,
//   });
// });

const getUsersMonthly = catchAsync(async (req, res) => {
  const result = await UserServices.getUsersMonthlyFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users are retrieved succesfully',
    data: result
  });
});

const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userData = req.body;
  console.log(req.body, 'user data in controller');
  const result = await UserServices.updateUserIntoDB(
    id,
    userData,
    req.file as any,
    req.user
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: req.file
      ? 'User data and profile image updated successfully'
      : 'User data updated successfully',
    data: result
  });
});
// const updateApproval = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const { User } = req.body;
//   const result = await UserServices.updateApprovalIntoDB(id, User);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: req.file ? 'User data and profile image updated successfully' : 'User data updated successfully',
//     data: result,
//   });
// });
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.deleteUserFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User is deleted successfully',
    data: result
  });
});

const getAllProviders = catchAsync(async (req, res) => {
  const result = await UserServices.getAllProvidersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Providers are retrieved succesfully',
    meta: result.meta,
    data: result.result
  });
});
// const getAllPreferedProviders = catchAsync(async (req, res) => {
//   console.log(req.query, "test");
//     const result = await UserServices.getAllPreferedProvidersFromDB(req.query);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Providers are retrieved succesfully',
//     meta: result.meta,
//     data: result.result,
//   });
// });
const getAllClients = catchAsync(async (req, res) => {
  const result = await UserServices.getAllClientsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Clients are retrieved succesfully',
    meta: result.meta,
    data: result.result
  });
});

export const UserControllers = {
  createCustomer,
  createContractor,
  getSingleUser,
  getUsersMonthly,
  deleteUser,
  updateUser,
  getMe,
  changeStatus,
  getAllUsers,
  getAllClients,
  getAllProviders
  // updateApproval,
  // getAllApprovalFalseUsers,
  // addMobileNumber,
  // createProvider,
  // getAllPreferedProviders
};
