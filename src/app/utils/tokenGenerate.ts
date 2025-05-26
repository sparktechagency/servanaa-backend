// import { createToken } from "../modules/Auth/auth.utils";

// const  getToken = async (userEmail: string, userRole: string) => {

//   //create token and sent to the  client
//   const jwtPayload:any = {
//     userEmail: user.email,
//     role: user.role,
//   };

//   const accessToken = createToken(
//     jwtPayload,
//     config.jwt_access_secret as string,
//     config.jwt_access_expires_in as string,
//   );

//   const refreshToken = createToken(
//     jwtPayload,
//     config.jwt_refresh_secret as string,
//     config.jwt_refresh_expires_in as string,
//   );

//   return {
//     accessToken,
//     refreshToken,
//     // needsPasswordChange: user?.needsPasswordChange,
//   };
// };

// export default getToken