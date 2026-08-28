import { listWorkspaces, createWorkspace, switchWorkspace } from './actions'

export const workspacesAPI = {
  list: listWorkspaces,
  create: createWorkspace,
  switch: switchWorkspace,
}
