import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AboutServices } from './About.service';



const createAbout = catchAsync(async (req, res) => {
  const AboutData = req.body;
    console.log(AboutData)

  const result = await AboutServices.createAboutIntoDB(AboutData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'About is created successfully',
    data: result,
  });
});



const getSingleAbout = catchAsync(async (req, res) => {
  const result = await AboutServices.getSingleAboutFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'About is retrieved successfully',
    data: result,
  });
});







export const AboutControllers = {
  createAbout,
  getSingleAbout,
};
