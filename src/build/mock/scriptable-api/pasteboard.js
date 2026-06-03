;(function () {
    ScriptableMock.register('Pasteboard', () => {
        const pasteboard = {
            string: 'https://scriptable.app',
            image: null,
        }
        return {
            Pasteboard: {
                copy: value => {
                    pasteboard.string = String(value)
                },
                paste: () => pasteboard.string,
                copyString: value => {
                    pasteboard.string = String(value)
                },
                pasteString: () => pasteboard.string,
                copyImage: image => {
                    pasteboard.image = image
                },
                pasteImage: () => pasteboard.image,
            },
        }
    })
})()
