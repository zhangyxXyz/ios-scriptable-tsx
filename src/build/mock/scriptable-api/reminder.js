;(function () {
    function createReminder(title = 'Mock reminder') {
        return {
            identifier: `mock-reminder-${Date.now()}`,
            title,
            notes: '',
            isCompleted: false,
            isOverdue: false,
            priority: 0,
            dueDate: new Date(),
            creationDate: new Date(),
            calendar: ScriptableMock.createCalendar('Reminders'),
            addRecurrenceRule: ScriptableMock.noop,
            removeAllRecurrenceRules: ScriptableMock.noop,
            save: ScriptableMock.noop,
            remove: ScriptableMock.noop,
        }
    }

    ScriptableMock.register('Reminder', () => {
        class Reminder {
            constructor() {
                Object.assign(this, createReminder())
            }
            static async scheduled() {
                return []
            }
            static async all() {
                return []
            }
            static async allCompleted() {
                return []
            }
            static async allIncomplete() {
                return []
            }
            static async allDueToday() {
                return []
            }
            static async completedDueToday() {
                return []
            }
            static async incompleteDueToday() {
                return []
            }
            static async allDueTomorrow() {
                return []
            }
            static async completedDueTomorrow() {
                return []
            }
            static async incompleteDueTomorrow() {
                return []
            }
            static async allDueYesterday() {
                return []
            }
            static async completedDueYesterday() {
                return []
            }
            static async incompleteDueYesterday() {
                return []
            }
            static async allDueThisWeek() {
                return []
            }
            static async completedDueThisWeek() {
                return []
            }
            static async incompleteDueThisWeek() {
                return []
            }
            static async allDueNextWeek() {
                return []
            }
            static async completedDueNextWeek() {
                return []
            }
            static async incompleteDueNextWeek() {
                return []
            }
        }

        return {Reminder}
    })
})()
