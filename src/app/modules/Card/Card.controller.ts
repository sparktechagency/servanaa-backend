import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CardServices } from './Card.service';

const createCard = catchAsync(async (req, res) => {
  // const { card: CardData } = req.body;
  // const CardData = { userId, paymentMethodId };
    // const { userId, paymentMethodId } = req.body;
  console.log( "musa controller");
  const result = await CardServices.createCardIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Card is created successfully',
    data: result,
  });
});

const getSingleCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CardServices.getSingleCardFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Card is retrieved successfully',
    data: result,
  });
});

const getAllCards = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CardServices.getAllCardsFromDB(req.query, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cards are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { card } = req.body;
  const result = await CardServices.updateCardIntoDB(id, card);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Card is updated successfully',
    data: result,
  });
});

const deleteCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CardServices.deleteCardFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Card is deleted successfully',
    data: result,
  });
});

export const CardControllers = {
  createCard,
  getSingleCard,
  getAllCards,
  updateCard,
  deleteCard,
};
