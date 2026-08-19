import {
  inviteListMember,
  acceptListInvite,
  declineListInvite,
  removeListMember,
  changeListMemberRole,
  listMembersForList,
  listMyListInvites,
  listListsSharedWithMe,
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
}
