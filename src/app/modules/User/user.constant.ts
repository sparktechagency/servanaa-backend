export const USER_ROLE = {
  superAdmin: 'superAdmin',
  customer: 'customer',
  contractor: 'contractor',
} as const;


export const usersSearchableFields = [
  'email','fullName', 'contactNo'
];

export const UserStatus = ['active', 'blocked'];
