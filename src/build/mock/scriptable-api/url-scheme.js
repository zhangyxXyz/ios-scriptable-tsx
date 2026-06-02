;(function () {
    ScriptableMock.register('URLScheme', context => ({
        URLScheme: {
            allParameters: () => ({}),
            parameter: () => null,
            forOpeningScript: () => `scriptable:///open/${encodeURIComponent(context.scriptName)}`,
            forOpeningScriptSettings: () => `scriptable:///settings/${encodeURIComponent(context.scriptName)}`,
            forRunningScript: () => `scriptable:///run/${encodeURIComponent(context.scriptName)}`,
        },
    }))
})()
