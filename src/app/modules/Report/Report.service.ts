/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { REPORT_SEARCHABLE_FIELDS } from './Report.constant';
import { TReport } from './Report.interface';
import { Report } from './Report.model';
import { User } from '../User/user.model';

const createReportIntoDB = async (
  payload: TReport,
  user: any
) => {

const usr =  await User.findOne({email:user.userEmail});

if (!usr) {
  throw new AppError(httpStatus.NOT_FOUND, 'User not found');
}
payload.userId = usr?._id;
const result = await Report.create(payload);

  return result;
};

const getAllReportsFromDB = async (query: Record<string, unknown>) => {
  const ReportQuery = new QueryBuilder(
    Report.find().populate('userId', 'fullName email'),
    query,
  )
    .search(REPORT_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ReportQuery.modelQuery;
  const meta = await ReportQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleReportFromDB = async (id: string) => {
  const result = await Report.findById(id);

  return result;
};

const updateReportIntoDB = async (id: string, payload: any) => {

  const report = await Report.findById(id);

  if (!report) {
    throw new Error('Report not found');
  }

  // Update nested field
  report.feedback.adminText = payload.feedback.adminText;

  const updatedData = await report.save();

  return updatedData;
};

const deleteReportFromDB = async (id: string) => {
  const deletedService = await Report.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Report');
  }

  return deletedService;
};

export const ReportServices = {
  createReportIntoDB,
  getAllReportsFromDB,
  getSingleReportFromDB,
  updateReportIntoDB,
  deleteReportFromDB,
};
