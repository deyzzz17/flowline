import { listUserTags, createUserTag, deleteUserTag, updateUserTag } from './actions'

export const tagsAPI = {
  tags: listUserTags,
  create: createUserTag,
  delete: deleteUserTag,
  update: updateUserTag,
}
