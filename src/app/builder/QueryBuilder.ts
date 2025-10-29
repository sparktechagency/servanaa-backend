/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>,
        ),
      });
    }

    return this;
  }

  filter() {
    const queryObj = { ...this.query }; // copy
    // Filtering
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields', 'days', 'startTime', 'duration'];
    excludeFields.forEach((el) => delete queryObj[el]);
    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
    return this;
  }

  sort() {
    const sort =
      (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort as string);

    return this;
  }

  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  fields() {
    const fields =
      (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  // public aggregate(pipeline: any[]) {
  //   return this.modelQuery.model.aggregate(pipeline);
  // }
  ////
  filterSchedule(days: string[], startTime: string, duration: number) {
    if (!days || days.length === 0 || !startTime || !duration) {
      return this;
    }

    // Calculate endTime
    const endTime = this.calculateEndTime(startTime, duration);

    this.modelQuery = this.modelQuery.find({
      role: 'provider',
      approvalStatus: true,
      isDeleted: false,
      mySchedule: {
        $elemMatch: {
          day: { $in: days },
          startTime: { $lte: startTime },
          endTime: { $gte: endTime },
        },
      },
    });

    return this;
  }

  private calculateEndTime(startTime: string, duration: number): string {
    const [hourStr, minuteStr] = startTime.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    hour += duration;
    if (hour >= 24) hour = hour - 24;

    return hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
  }
  ////
  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;


