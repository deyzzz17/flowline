import { deleteAccount, updateProfile, uploadAvatar } from './actions'

export const profileAPI = {
  uploadAvatar,
  update: updateProfile,
  delete: deleteAccount,
}
