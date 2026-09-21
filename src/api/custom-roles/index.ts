import { listCustomRoles, createCustomRole, updateCustomRole, deleteCustomRole } from './actions'

export const customRolesAPI = {
  list: listCustomRoles,
  create: createCustomRole,
  update: updateCustomRole,
  delete: deleteCustomRole,
}
