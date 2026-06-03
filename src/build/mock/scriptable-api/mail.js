;(function () {
    ScriptableMock.register('Mail', context => {
        const {writeLog} = context
        class Mail {
            constructor() {
                this.toRecipients = []
                this.ccRecipients = []
                this.bccRecipients = []
                this.subject = ''
                this.body = ''
                this.isBodyHTML = false
                this.preferredSendingEmailAddress = ''
                this.attachments = []
            }
            addImageAttachment(image) {
                this.attachments.push({type: 'image', image})
            }
            addFileAttachment(filePath) {
                this.attachments.push({type: 'file', filePath})
            }
            addDataAttachment(data, mimeType, filename) {
                this.attachments.push({type: 'data', data, mimeType, filename})
            }
            async send() {
                writeLog('log', `Mail.send ${this.subject}`)
                return {
                    completed: true,
                    toRecipients: this.toRecipients.slice(),
                    subject: this.subject,
                    attachmentCount: this.attachments.length,
                }
            }
        }

        return {Mail}
    })
})()
