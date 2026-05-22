import {
  listFlowlineCalendarEvents,
  listGoogleCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarCategories,
  createCalendarCategory,
  updateCalendarCategory,
  deleteCalendarCategory,
  type EditScope,
  type RecurrenceRule,
  type CalendarEventData,
} from './actions'

export type { EditScope, RecurrenceRule, CalendarEventData }

export const calendarAPI = {
  listFlowline: listFlowlineCalendarEvents,
  listGoogle: listGoogleCalendarEvents,
  create: createCalendarEvent,
  update: (
    id: number,
    data: Partial<CalendarEventData>,
    scope?: EditScope,
    originalDate?: string,
  ) => updateCalendarEvent(id, data, scope, originalDate),
  delete: (id: number, scope?: EditScope, originalDate?: string) =>
    deleteCalendarEvent(id, scope, originalDate),
  categories: {
    list: listCalendarCategories,
    create: createCalendarCategory,
    update: updateCalendarCategory,
    delete: deleteCalendarCategory,
  },
}