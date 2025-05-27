export const USER_ROLE = {
  superAdmin: 'superAdmin',
  client: 'client',
  provider: 'provider',
} as const;


export const usersSearchableFields = [
  'email','fullName', 'contactNo'
];

export const UserStatus = ['active', 'blocked'];
