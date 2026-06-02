;(function () {
    function createCalendarEvent(title = 'Mock event') {
        const startDate = new Date()
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
        return {
            identifier: `mock-event-${Date.now()}`,
            title,
            location: '',
            notes: '',
            startDate,
            endDate,
            isAllDay: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            calendar: ScriptableMock.createCalendar('Calendar'),
            addRecurrenceRule: ScriptableMock.noop,
            removeAllRecurrenceRules: ScriptableMock.noop,
            save: ScriptableMock.noop,
            remove: ScriptableMock.noop,
            presentEdit: async function () {
                return this
            },
        }
    }

    ScriptableMock.register('CalendarEvent', () => {
        class CalendarEvent {
            constructor() {
                Object.assign(this, createCalendarEvent())
            }
            static async presentCreate() {
                return new CalendarEvent()
            }
            static async today() {
                return []
            }
            static async tomorrow() {
                return []
            }
            static async yesterday() {
                return []
            }
            static async thisWeek() {
                return []
            }
            static async nextWeek() {
                return []
            }
            static async lastWeek() {
                return []
            }
            static async between() {
                return []
            }
        }

        return {CalendarEvent}
    })
})()
