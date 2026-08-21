import {
  listCommentsForTask,
  createComment,
  toggleCommentLike,
  toggleCommentDislike,
} from './actions'

export const taskCommentsAPI = {
  listForTask: listCommentsForTask,
  create: createComment,
  toggleLike: toggleCommentLike,
  toggleDislike: toggleCommentDislike,
}
