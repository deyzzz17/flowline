import {
  inviteListMember,
  acceptListInvite,
  declineListInvite,
  removeListMember,
  changeListMemberRole,
  listMembersForList,
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
  myInvites: listMyListInvites,
  listSharedWithMe: listListsSharedWithMe,
  createShared: createSharedList,
}
