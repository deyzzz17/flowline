import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarCategories,
  createCalendarCategory,
  updateCalendarCategory,
  deleteCalendarCategory,
} from './actions'

export const calendarAPI = {
  list: listCalendarEvents,
  create: createCalendarEvent,
  update: updateCalendarEvent,
  delete: deleteCalendarEvent,
  categories: {
    list: listCalendarCategories,
    create: createCalendarCategory,
    update: updateCalendarCategory,
    delete: deleteCalendarCategory,
  },
}
