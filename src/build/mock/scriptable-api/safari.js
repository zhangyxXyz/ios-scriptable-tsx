;(function () {
    ScriptableMock.register('Safari', context => ({
        Safari: {
            open: ScriptableMock.createLog(context.writeLog, 'Safari.open'),
            openInApp: async url => context.writeLog('log', `Safari.openInApp ${url}`),
        },
    }))
})()
