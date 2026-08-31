import {
  listWorkspaces,
  createWorkspace,
  switchWorkspace,
  listWorkspaceMembers,
} from './actions'

export const workspacesAPI = {
  list: listWorkspaces,
  create: createWorkspace,
  switch: switchWorkspace,
  listMembers: listWorkspaceMembers,
}
