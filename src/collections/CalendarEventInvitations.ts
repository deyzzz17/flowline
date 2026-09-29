import type { CollectionConfig } from 'payload'

// One row per participant invited to a workspace event through the meeting
// scheduler. The event itself already lists every participant in
// `assignedTo` (so it shows in their agenda right away); this tracks each
// one's answer. Declining removes them from the event's `assignedTo`.
export const CalendarEventInvitations: CollectionConfig = {
  slug: 'calendar-event-invitations',
  admin: { useAsTitle: 'id' },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'calendar-events',
      required: true,
      index: true,
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'userId of the invited participant' },
    },
    {
      name: 'invitedBy',
      type: 'text',
      required: true,
      admin: { description: 'userId of the organizer who sent the invitation' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Declined', value: 'declined' },
      ],
    },
    { name: 'respondedAt', type: 'date', required: false },
  ],
}
