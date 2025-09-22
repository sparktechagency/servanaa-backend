export const USER_ROLE = {
  superAdmin: 'superAdmin',
  customer: 'customer',
  contractor: 'contractor'
} as const;

export const usersSearchableFields = ['email', 'fullName', 'contactNo'];

export const UserStatus = ['active', 'blocked'];

// Fields that belong to the User collection (common fields)
export const userFields = [
  'fullName',
  'email',
  'contactNo',
  'img',
  'otpVerified',
  'status'
  // add other common user fields you want to update
];

// Customer-specific fields
export const customerFields = [
  'dob',
  'gender',
  'city',
  'language',
  'location'
  // add other customer-specific fields here
];

// Contractor-specific fields
export const contractorFields = [
  'rateHourly',
  'skillsCategory',
  'dob',
  'gender',
  'city',
  'language',
  'location',
  'ratings',
  'skills',
  'certificates',
  'materials',
  'mySchedule'
  // add other contractor-specific fields here
];
