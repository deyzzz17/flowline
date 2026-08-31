import {
  listWorkspaces,
  createWorkspace,
  switchWorkspace,
  switchWorkspaceAndGetToday,
} from './actions'

export const workspacesAPI = {
  list: listWorkspaces,
  create: createWorkspace,
  switch: switchWorkspace,
  switchAndGetToday: switchWorkspaceAndGetToday,
}
