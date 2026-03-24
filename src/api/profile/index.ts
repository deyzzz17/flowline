import { deleteAccount, getCloudinarySignature, updateProfile } from './actions'

export const profileAPI = {
  getSignature: getCloudinarySignature,
  update: updateProfile,
  delete: deleteAccount,
}
