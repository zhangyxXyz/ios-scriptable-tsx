;(function () {
    ScriptableMock.register('Photos', context => {
        const {MockImage} = context
        let savedImage = null
        return {
            Photos: {
                fromLibrary: async () => {
                    const image = await context.pickImageFromBrowser?.()
                    if (image) savedImage = image
                    return image || new MockImage('photo-library')
                },
                fromCamera: async () => {
                    const image = await context.pickImageFromBrowser?.()
                    if (image) savedImage = image
                    return image || new MockImage('photo-camera')
                },
                latestPhoto: async () => savedImage || new MockImage('latest-photo'),
                latestPhotos: async count =>
                    Array.from({length: Number(count || 1)}, () => savedImage || new MockImage('latest-photo')),
                latestScreenshot: async () => new MockImage('latest-screenshot'),
                latestScreenshots: async count =>
                    Array.from({length: Number(count || 1)}, () => new MockImage('latest-screenshot')),
                removeLatestPhoto: ScriptableMock.noop,
                removeLatestPhotos: ScriptableMock.noop,
                removeLatestScreenshot: ScriptableMock.noop,
                removeLatestScreenshots: ScriptableMock.noop,
                save: image => {
                    savedImage = image
                },
            },
        }
    })
})()
