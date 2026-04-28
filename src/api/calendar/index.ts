import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from './actions'

export const calendarAPI = {
  list: listCalendarEvents,
  create: createCalendarEvent,
  update: updateCalendarEvent,
  delete: deleteCalendarEvent,
}