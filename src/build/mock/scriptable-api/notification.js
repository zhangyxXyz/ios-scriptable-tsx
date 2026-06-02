;(function () {
    ScriptableMock.register('Notification', context => {
        const {writeLog} = context
        const pendingNotifications = []
        const deliveredNotifications = []

        class Notification {
            constructor() {
                this.identifier = `mock-notification-${Date.now()}`
                this.title = ''
                this.subtitle = ''
                this.body = ''
                this.badge = 0
                this.threadIdentifier = ''
                this.sound = ''
                this.openURL = ''
                this.actions = []
            }
            async schedule() {
                pendingNotifications.push(this)
                writeLog('log', `Notification.schedule ${this.title || this.body || this.identifier}`)
            }
            async remove() {
                const index = pendingNotifications.indexOf(this)
                if (index >= 0) pendingNotifications.splice(index, 1)
            }
            setTriggerDate(date) {
                this.triggerDate = date
            }
            setDailyTrigger(hour, minute, repeats) {
                this.dailyTrigger = {hour, minute, repeats}
            }
            setWeeklyTrigger(weekday, hour, minute, repeats) {
                this.weeklyTrigger = {weekday, hour, minute, repeats}
            }
            addAction(title, url, destructive = false) {
                this.actions.push({title, url, destructive})
            }
            static current() {
                return new Notification()
            }
            static async allPending() {
                return pendingNotifications.slice()
            }
            static async allDelivered() {
                return deliveredNotifications.slice()
            }
            static async removeAllPending() {
                pendingNotifications.length = 0
            }
            static async removeAllDelivered() {
                deliveredNotifications.length = 0
            }
            static async removePending(identifiers) {
                identifiers.forEach(identifier => {
                    const index = pendingNotifications.findIndex(item => item.identifier === identifier)
                    if (index >= 0) pendingNotifications.splice(index, 1)
                })
            }
            static async removeDelivered(identifiers) {
                identifiers.forEach(identifier => {
                    const index = deliveredNotifications.findIndex(item => item.identifier === identifier)
                    if (index >= 0) deliveredNotifications.splice(index, 1)
                })
            }
            static resetCurrent() {}
        }
        Notification.opened = false

        return {Notification}
    })
})()
