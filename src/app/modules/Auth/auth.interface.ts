export type TLoginUser = {
  email: string;
  password: string;
  requestRole: 'customer' | 'superAdmin' | 'contractor';
};
