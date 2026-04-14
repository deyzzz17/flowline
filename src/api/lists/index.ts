import {
  createList,
  listLists,
  getListById,
  editList,
  deleteList,
  createDefaultList,
  getListBySlug,
} from './actions'

export const listsAPI = {
  create: createList,
  list: listLists,
  getById: getListById,
  edit: editList,
  delete: deleteList,
  createDefault: createDefaultList,
  slug: getListBySlug,
}
