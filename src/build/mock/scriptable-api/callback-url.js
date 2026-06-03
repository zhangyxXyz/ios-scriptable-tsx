;(function () {
    ScriptableMock.register('CallbackURL', context => {
        class CallbackURL {
            constructor(baseURL) {
                this.baseURL = baseURL
                this.params = new URLSearchParams()
            }
            addParameter(name, value) {
                this.params.set(name, value)
            }
            getURL() {
                const query = this.params.toString()
                return query ? `${this.baseURL}${this.baseURL.includes('?') ? '&' : '?'}${query}` : this.baseURL
            }
            async open() {
                context.writeLog('log', `CallbackURL.open ${this.getURL()}`)
                return {
                    success: '1',
                    url: this.getURL(),
                    source: 'playground',
                }
            }
        }

        return {CallbackURL}
    })
})()
