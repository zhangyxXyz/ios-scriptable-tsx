;(function () {
    ScriptableMock.register('Speech', context => ({
        Speech: {
            speak: text => context.writeLog('log', `Speech.speak ${text}`),
        },
    }))
})()
