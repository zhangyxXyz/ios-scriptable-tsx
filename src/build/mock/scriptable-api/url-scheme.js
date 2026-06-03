;(function () {
    ScriptableMock.register('URLScheme', context => ({
        URLScheme: {
            allParameters: () => ({...(context.queryParameters || {})}),
            parameter: name => (context.queryParameters || {})[name] || null,
            forOpeningScript: () => `scriptable:///open/${encodeURIComponent(context.scriptName)}`,
            forOpeningScriptSettings: () => `scriptable:///settings/${encodeURIComponent(context.scriptName)}`,
            forRunningScript: () => `scriptable:///run/${encodeURIComponent(context.scriptName)}`,
        },
    }))
})()
