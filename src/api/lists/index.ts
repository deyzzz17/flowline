import {
  createList,
  listLists,
  getListById,
  editList,
  deleteList,
  createDefaultList,
  getListBySlug,
  getListRole,
} from './actions'

export const listsAPI = {
  create: createList,
  list: listLists,
  getById: getListById,
  edit: editList,
  delete: deleteList,
  createDefault: createDefaultList,
  slug: getListBySlug,
  role: getListRole,
}
