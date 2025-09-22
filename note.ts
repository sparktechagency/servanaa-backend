// 1. notification
// 2. payment and transaction earning
// 3. withdraw
// 4. support

// price 
// feature listing
// instant booking eligibilitis
// Customer Review Booster
// Support

// job categories
// Customer Branding
// insight Dashboard
// Verified Badge
// multiple staff account
// service areas

// const updateUserIntoDB = async (id: string, payload?: any, file?: any, user?: any) => {
//   console.log('id', id)
//   console.log('payload', payload)
//   console.log('file', file)
//   console.log('user', user)
//   const {userEmail} = user;
//   const exUser = await User.isUserExistsByCustomEmail(userEmail)
// if(exUser?.role === 'customer'){
//   console.log('customer')
// }else if(exUser?.role === 'contractor'){
//   console.log('contractor')
//     console.log('payload', payload)

//    const userDataToUpdate = extractFields(payload || {}, userFields);
//     console.log('userDataToUpdate', userDataToUpdate)

//   if (file && file.location) {
//     userDataToUpdate.img = file.location;
//         console.log('file.location', file.location)
//   }

//   const updatedUser = await User.findByIdAndUpdate(id, userDataToUpdate, {
//     new: true,
//     runValidators: true,
//   }).select('-password');

//   if (!updatedUser) throw new Error('User not found');
//   console.log('updatedUser', updatedUser)

//   const roleDataToUpdate:any = {};
//   let updatedRoleData = null;


//   const add = payload?.add || {};
//   const remove = payload?.remove || {};

//   if (user?.role === 'contractor') {
//     const existingContractor = await Contractor.findById({ _id:  updatedUser.contractor});
//     if (!existingContractor) throw new Error('Contractor not found');

//     // Skills
//     const existingSkills = Array.isArray(existingContractor.skills) ? existingContractor.skills : [];
//     const addedSkills = add.skills || [];
//     const removedSkills = remove.skills || [];



//     const afterAddSkills = mergeArrayField(existingSkills, addedSkills);
//     const finalSkills = removeArrayItems(afterAddSkills, removedSkills);

//     if (addedSkills.length || removedSkills.length) {
//       roleDataToUpdate.skills = finalSkills;
//     }

//     // Certificates
//     const existingCertificates = existingContractor.certificates || [];
//     const addedCerts = add.certificates || [];
//     const removedCerts = remove.certificates || [];

//     const afterAddCerts = mergeArrayField(existingCertificates, addedCerts);
//     const finalCerts = removeArrayItems(afterAddCerts, removedCerts);

//     if (addedCerts.length || removedCerts.length) {
//       roleDataToUpdate.certificates = finalCerts;
//     }

//     // mySchedule
//     const existingSchedule = existingContractor.mySchedule || [];
//     const addedSchedule = add.mySchedule || [];
//     const removedSchedule = remove.mySchedule || [];

//     const afterAddSchedule = [...existingSchedule, ...addedSchedule];
//     const finalSchedule = removeArrayItems(afterAddSchedule, removedSchedule, 'day'); // assuming 'day' is unique

//     if (addedSchedule.length || removedSchedule.length) {
//       roleDataToUpdate.mySchedule = finalSchedule;
//     }

//     updatedRoleData = await Contractor.findOneAndUpdate(
//       { userId: id },
//       roleDataToUpdate,
//       { new: true, runValidators: true }
//     );
//   }

//   return {
//     user: updatedUser,
//     roleData: updatedRoleData,
//   };

// }else{
//   console.log('superAdmin')

// }
//   return
 
// };