export const USER_ROLE = {
  superAdmin: 'superAdmin',
  client: 'client',
  provider: 'provider',
} as const;


export const usersSearchableFields = [
  'email','fullName'
];

export const UserStatus = ['active', 'blocked'];
