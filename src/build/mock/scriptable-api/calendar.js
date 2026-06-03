;(function () {
    function createCalendar(title) {
        return {
            identifier: `mock-calendar-${String(title).toLowerCase().replace(/\s+/g, '-')}`,
            title,
            color: '#0a84ff',
            isSubscribed: false,
            allowsContentModifications: true,
            supportsAvailability: () => true,
            save: ScriptableMock.noop,
            remove: ScriptableMock.noop,
        }
    }

    ScriptableMock.register('Calendar', () => ({
        Calendar: {
            forReminders: async () => [createCalendar('Reminders')],
            forEvents: async () => [createCalendar('Calendar')],
            forRemindersByTitle: async title => createCalendar(title),
            forEventsByTitle: async title => createCalendar(title),
            createForReminders: async title => createCalendar(title),
            findOrCreateForReminders: async title => createCalendar(title),
            defaultForReminders: async () => createCalendar('Reminders'),
            defaultForEvents: async () => createCalendar('Calendar'),
            presentPicker: async allowMultiple =>
                allowMultiple ? [createCalendar('Calendar')] : createCalendar('Calendar'),
        },
    }))

    window.ScriptableMock.createCalendar = createCalendar
})()
