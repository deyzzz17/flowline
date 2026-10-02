// An event's color always comes from its calendar category; an event with
// no category is shown in this neutral gray. Shared by the server (which
// stores the resolved color on the event) and the event dialog.
export const NO_CATEGORY_EVENT_COLOR = '#9ca3af'

// "No category" is not stored anywhere: it's a virtual entry shown first in
// every calendar category list (so every account has it, old or new), used
// to show/hide events that have no category. Real category ids start at 1.
export const NO_CATEGORY_FILTER_ID = 0
export const NO_CATEGORY_LABEL = 'No category'

export const CALENDAR_CATEGORY_NAME_TAKEN = 'CALENDAR_CATEGORY_NAME_TAKEN'

/** Category names are compared trimmed and case-insensitively. */
export const normalizeCategoryName = (name: string) => name.trim().toLowerCase()
