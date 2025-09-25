/* eslint-disable @typescript-eslint/no-explicit-any */
// import { TErrorSources, TGenericErrorResponse } from '..\interface\error\index.ts';

import { TErrorSources, TGenericErrorResponse } from '../interface/error';

const handleDuplicateError = (err: any): TGenericErrorResponse => {
  // Extract value within double quotes using regex
  let path = '';
  let value = '';

  if (err?.keyValue) {
    // Use MongoDB native duplicate error structure
    path = Object.keys(err.keyValue)[0];
    value = err.keyValue[path];
  }

  const errorSources: TErrorSources = [
    {
      path,
      message: value
        ? `A record with ${path} "${value}" already exists.`
        : 'A record with this value already exists.'
    }
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: 'Duplicate entry error',
    errorSources
  };
};

export default handleDuplicateError;
