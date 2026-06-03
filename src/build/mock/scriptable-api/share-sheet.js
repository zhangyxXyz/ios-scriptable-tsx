;(function () {
    ScriptableMock.register('ShareSheet', () => ({
        ShareSheet: {
            present: async activityItems => ({
                completed: true,
                activityType: 'com.apple.UIKit.activity.CopyToPasteboard',
                activityItems: Array.isArray(activityItems) ? activityItems : [activityItems],
            }),
        },
    }))
})()
