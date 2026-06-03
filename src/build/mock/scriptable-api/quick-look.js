;(function () {
    ScriptableMock.register('QuickLook', context => ({
        QuickLook: {
            present: async item => {
                context.writeLog('log', `QuickLook.present ${String(item)}`)
                return true
            },
        },
    }))
})()
