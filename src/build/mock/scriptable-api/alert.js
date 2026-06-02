;(function () {
    ScriptableMock.register('Alert', () => {
        class Alert {
            constructor() {
                this.title = ''
                this.message = ''
                this.actions = []
                this.cancelAction = null
                this.textFields = []
            }
            addAction(title) {
                this.actions.push({title, destructive: false})
            }
            addDestructiveAction(title) {
                this.actions.push({title, destructive: true})
            }
            addCancelAction(title) {
                this.cancelAction = title
            }
            addTextField(_placeholder, text = '') {
                this.textFields.push(String(text))
            }
            addSecureTextField(_placeholder, text = '') {
                this.textFields.push(String(text))
            }
            textFieldValue(index) {
                return this.textFields[index] || ''
            }
            async present() {
                return this.presentAlert()
            }
            async presentAlert() {
                const firstTitle = this.actions[0]?.title || this.cancelAction || ''
                if (this.actions.length > 1 && /取消|cancel/i.test(firstTitle)) return 1
                return 0
            }
            async presentSheet() {
                return 0
            }
        }

        return {Alert}
    })
})()
