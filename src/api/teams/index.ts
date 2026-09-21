import {
  getTeamsAccess,
  listTeams,
  createTeam,
  getTeamOverview,
  listTeamRoles,
  createTeamRole,
  updateTeamRole,
  deleteTeamRole,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from './actions'

export const teamsAPI = {
  getAccess: getTeamsAccess,
  list: listTeams,
  create: createTeam,
  getOverview: getTeamOverview,
  listRoles: listTeamRoles,
  createRole: createTeamRole,
  updateRole: updateTeamRole,
  deleteRole: deleteTeamRole,
  addMember: addTeamMember,
  updateMemberRole: updateTeamMemberRole,
  removeMember: removeTeamMember,
}
