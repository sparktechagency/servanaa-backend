import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { TUserRole } from '../modules/User/user.interface';
import catchAsync from '../utils/catchAsync';
import AppError from '../errors/AppError';
import config from '../config/index';
import { User } from '../modules/User/user.model';
// import { UserStatus } from '../modules/User/user.constant';
// import config from '..\config';
// import AppError from \index.ts'../errors/AppError';
// import { TUserRole } from '..\modules\User\user.interface';
// import { User } from \index.ts'../modules/User/user.model';
// import catchAsync from '..\utils\catchAsync\index.ts';

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {


    const token = req.headers.authorization;
    // console.log(token, 'token-thisis token');    
    // checking if the token is missing
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    // checking if the given token is valid
    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string,
    ) as JwtPayload;

    const { role, userEmail, iat } = decoded;

        // console.log(decoded, 'decoded');


    // checking if the user is exist
    const user = await User.isUserExistsByCustomEmail(userEmail);

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
    }
    // checking if the user is already deleted

    const isDeleted = user?.isDeleted;

    if (isDeleted) {
      throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
    }
    // console.log(user, 'user');

    // checking if the user is blocked
    // const userStatus = user?.status;

    // if (UserStatus === 'blocked') {
    //   throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked ! !');
    // }

    if (
      user.passwordChangedAt &&
      User.isJWTIssuedBeforePasswordChanged(
        user.passwordChangedAt,
        iat as number,
      )
    ) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized !');
    }


    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You are not authorized  hi!',
      );
    }


    req.user = decoded as JwtPayload & { role: string };
    // console.log(req.user, 'req.user');

    next();
  });
};

export default auth;
