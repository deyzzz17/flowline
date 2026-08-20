import {
  inviteListMember,
  acceptListInvite,
  declineListInvite,
  removeListMember,
  changeListMemberRole,
  listMembersForList,
  listMemberProfiles,
  listMyListInvites,
  listListsSharedWithMe,
  createSharedList,
} from './actions'

export const listMembersAPI = {
  invite: inviteListMember,
  accept: acceptListInvite,
  decline: declineListInvite,
  remove: removeListMember,
  changeRole: changeListMemberRole,
  listForList: listMembersForList,
  memberProfiles: listMemberProfiles,
  myInvites: listMyListInvites,
  listSharedWithMe: listListsSharedWithMe,
  createShared: createSharedList,
}
