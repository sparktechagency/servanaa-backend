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
    let token = req.headers.authorization;

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    if (token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string
    ) as JwtPayload;

    const { role, userEmail, iat } = decoded;

    console.log(role, 'role');
    console.log(userEmail, 'userEmail');
    console.log(iat, 'iat');

    // console.log(decoded, 'decoded');

    //  console.log('userEmail', userEmail)
    // checking if the user is exist
    const user = await User.isUserExistsByCustomEmail(userEmail);

    //  console.log('user', user)

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
    }

    const isDeleted = user?.isDeleted;

    if (isDeleted) {
      throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
    }

    if (
      user.passwordChangedAt &&
      User.isJWTIssuedBeforePasswordChanged(
        user.passwordChangedAt,
        iat as number
      )
    ) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized !');
    }

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You are not authorized  hi!'
      );
    }

    req.user = decoded as JwtPayload & { role: string };

    next();
  });
};

export default auth;
