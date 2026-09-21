import {
  getTeamsAccess,
  listTeams,
  createTeam,
  getTeamOverview,
  listTeamRoles,
  createTeamRole,
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
  deleteRole: deleteTeamRole,
  addMember: addTeamMember,
  updateMemberRole: updateTeamMemberRole,
  removeMember: removeTeamMember,
}
