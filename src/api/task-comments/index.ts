import {
  listCommentsForTask,
  createComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  toggleCommentDislike,
  listMyCommentMentionNotifications,
} from './actions'

export const taskCommentsAPI = {
  listForTask: listCommentsForTask,
  create: createComment,
  edit: editComment,
  delete: deleteComment,
  toggleLike: toggleCommentLike,
  toggleDislike: toggleCommentDislike,
  myMentionNotifications: listMyCommentMentionNotifications,
}
