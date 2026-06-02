;(function () {
    const factories = []

    function register(name, factory) {
        factories.push({name, factory})
    }

    function createLog(writeLog, label) {
        return function (...args) {
            writeLog('log', `${label} ${args.map(item => String(item)).join(' ')}`.trim())
        }
    }

    function noop() {}

    function createScriptableHostMocks(context) {
        const runMode = context.runMode || 'widget'
        const result = {
            config: {
                runsInWidget: runMode === 'widget',
                runsInApp: runMode === 'app',
                widgetFamily: context.family,
            },
            args: {
                widgetParameter: context.parameter || '',
                queryParameters: context.queryParameters || {},
            },
            mockMeta: {
                appearance: context.appearance,
                family: context.family,
                runMode,
            },
        }

        factories.forEach(({factory}) => Object.assign(result, factory(context, result)))
        return result
    }

    const api = {
        register,
        createLog,
        noop,
    }

    window.ScriptableMock = api
    globalThis.ScriptableMock = api
    window.createScriptableHostMocks = createScriptableHostMocks
    globalThis.createScriptableHostMocks = createScriptableHostMocks
})()
