;(function () {
    ScriptableMock.register('Photos', context => {
        const {MockImage} = context
        function createSampleImage(label = 'playground-photo') {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#f2f6ff"/><circle cx="500" cy="130" r="70" fill="#ffd166"/><path d="M0 370L160 240L260 320L390 190L640 380V480H0Z" fill="#4f9d69"/><path d="M0 410L180 300L300 380L430 260L640 420V480H0Z" fill="#2f6f4e"/></svg>`
            const image = new MockImage(label, 'mock-photo', `data:image/svg+xml;base64,${btoa(svg)}`)
            image.size = {width: 640, height: 480}
            return image
        }
        let savedImage = createSampleImage('latest-photo')
        return {
            Photos: {
                fromLibrary: async () => {
                    const image = await context.pickImageFromBrowser?.()
                    if (image) savedImage = image
                    return image || savedImage
                },
                fromCamera: async () => {
                    const image = await context.pickImageFromBrowser?.()
                    if (image) savedImage = image
                    return image || createSampleImage('photo-camera')
                },
                latestPhoto: async () => savedImage,
                latestPhotos: async count =>
                    Array.from({length: Number(count || 1)}, (_, index) => savedImage || createSampleImage(`latest-photo-${index}`)),
                latestScreenshot: async () => createSampleImage('latest-screenshot'),
                latestScreenshots: async count =>
                    Array.from({length: Number(count || 1)}, (_, index) => createSampleImage(`latest-screenshot-${index}`)),
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
