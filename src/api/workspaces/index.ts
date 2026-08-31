import {
  listWorkspaces,
  createWorkspace,
  switchWorkspace,
  updateWorkspaceName,
  deleteWorkspace,
  listWorkspaceMembers,
  searchUserForWorkspaceInvite,
  listMyWorkspaceInvites,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
} from './actions'

export const workspacesAPI = {
  list: listWorkspaces,
  create: createWorkspace,
  switch: switchWorkspace,
  updateName: updateWorkspaceName,
  delete: deleteWorkspace,
  listMembers: listWorkspaceMembers,
  searchInvite: searchUserForWorkspaceInvite,
  listMyInvites: listMyWorkspaceInvites,
  acceptInvite: acceptWorkspaceInvite,
  declineInvite: declineWorkspaceInvite,
}
