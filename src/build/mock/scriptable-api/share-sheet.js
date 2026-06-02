;(function () {
    ScriptableMock.register('ShareSheet', () => ({
        ShareSheet: {
            present: async activityItems => ({completed: true, activityItems}),
        },
    }))
})()
