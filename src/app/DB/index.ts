

import config from "../config/index";
import { USER_ROLE } from "../modules/User/user.constant";
import { User } from "../modules/User/user.model";

const superUser = {
  fullName: 'Super Admin',
  userName: 'superadmin',
  email:  config.super_admin_email || 'ahmadmusa9805@gmail.com',
  password: config.super_admin_password || 'superAdmin12345',
  location: 'sdgsdg',
  contactNo: "+4407823878152",
  role: USER_ROLE.superAdmin,
  otpVerified: true,
  dob: '2000-01-01',
  approvalStatus:true,
  isDeleted: false,
};

const seedSuperAdmin = async () => {
  //when database is connected, we will check is there any user who is super admin
  const isSuperAdminExits = await User.findOne({ role: USER_ROLE.superAdmin });

  if (!isSuperAdminExits) {
    await User.create(superUser);
  }
};

export default seedSuperAdmin;
