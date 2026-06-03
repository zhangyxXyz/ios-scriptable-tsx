;(function () {
    ScriptableMock.register('Message', context => {
        const {writeLog} = context
        class Message {
            constructor() {
                this.recipients = []
                this.body = ''
                this.attachments = []
            }
            addImageAttachment(image) {
                this.attachments.push({type: 'image', image})
            }
            addFileAttachment(filePath) {
                this.attachments.push({type: 'file', filePath})
            }
            addDataAttachment(data, uti, filename) {
                this.attachments.push({type: 'data', data, uti, filename})
            }
            async send() {
                writeLog('log', `Message.send ${this.body}`)
                return {
                    completed: true,
                    recipients: this.recipients.slice(),
                    body: this.body,
                    attachmentCount: this.attachments.length,
                }
            }
        }

        return {Message}
    })
})()
