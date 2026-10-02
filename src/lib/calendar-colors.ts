// An event's color always comes from its calendar category; an event with
// no category is shown in this neutral gray. Shared by the server (which
// stores the resolved color on the event) and the event dialog.
export const NO_CATEGORY_EVENT_COLOR = '#9ca3af'

export const CALENDAR_CATEGORY_NAME_TAKEN = 'CALENDAR_CATEGORY_NAME_TAKEN'

/** Category names are compared trimmed and case-insensitively. */
export const normalizeCategoryName = (name: string) => name.trim().toLowerCase()
