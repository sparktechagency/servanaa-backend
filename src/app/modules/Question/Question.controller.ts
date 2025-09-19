import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FaqServices } from './Question.service';

const createFaq = catchAsync(async (req, res) => {
  const question = req.body;
  const result = await FaqServices.createFaqIntoDB(question);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Faq is created successfully',
    data: result,
  });
});

const getSingleFaq = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FaqServices.getSingleFaqFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Faq is retrieved successfully',
    data: result,
  });
});

const getAllFaqs = catchAsync(async (req, res) => {

  

  const result = await FaqServices.getAllFaqsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Faqs are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateFaq = catchAsync(async (req, res) => {
  const { id } = req.params;
  const question = req.body;
  const result = await FaqServices.updateFaqIntoDB(id, question);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Faq is updated successfully',
    data: result,
  });
});

const deleteFaq = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FaqServices.deleteFaqFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Faq is deleted successfully',
    data: result,
  });
});

export const FaqControllers = {
  createFaq,
  getSingleFaq,
  getAllFaqs,
  updateFaq,
  deleteFaq,
};
