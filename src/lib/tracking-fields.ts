// Limits of a "list" habit tracking field (Pro): its options are chosen from
// each time the habit is completed. Shared by the server validation
// (api/habits/actions.ts) and the habit form.
export const TRACKING_LIST_MIN_OPTIONS = 2
export const TRACKING_LIST_MAX_OPTIONS = 20
export const TRACKING_LIST_OPTION_MAX_LENGTH = 40
