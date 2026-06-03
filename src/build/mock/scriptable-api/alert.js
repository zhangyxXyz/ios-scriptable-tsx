;(function () {
    ScriptableMock.register('Alert', context => {
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
            addTextField(placeholder = '', text = '') {
                this.textFields.push({placeholder: String(placeholder), value: String(text), secure: false})
            }
            addSecureTextField(placeholder = '', text = '') {
                this.textFields.push({placeholder: String(placeholder), value: String(text), secure: true})
            }
            textFieldValue(index) {
                return this.textFields[index]?.value || ''
            }
            async present() {
                return this.presentAlert()
            }
            async presentAlert() {
                if (context.presentAlert) {
                    const result = await context.presentAlert({
                        title: this.title,
                        message: this.message,
                        actions: this.actions,
                        cancelAction: this.cancelAction,
                        textFields: this.textFields,
                    })
                    if (result?.textFields) {
                        result.textFields.forEach((value, index) => {
                            if (this.textFields[index]) this.textFields[index].value = String(value ?? '')
                        })
                    }
                    return typeof result?.index === 'number' ? result.index : -1
                }
                return this.actions.length > 0 ? 0 : -1
            }
            async presentSheet() {
                return this.presentAlert()
            }
        }

        return {Alert}
    })
})()
