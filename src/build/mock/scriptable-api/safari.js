;(function () {
    ScriptableMock.register('Safari', context => ({
        Safari: {
            open: async url => {
                context.writeLog('log', `Safari.open ${url}`)
                return true
            },
            openInApp: async url => {
                context.writeLog('log', `Safari.openInApp ${url}`)
                return true
            },
        },
    }))
})()
