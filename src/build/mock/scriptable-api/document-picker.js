;(function () {
    ScriptableMock.register('DocumentPicker', context => ({
        DocumentPicker: {
            open: async () => [],
            openFile: async () => context.makeFileManager().documentsDirectory(),
            openFolder: async () => context.makeFileManager().documentsDirectory(),
            export: async path => [path],
            exportString: async (_content, name) => [name],
            exportImage: async (_image, name) => [name],
            exportData: async (_data, name) => [name],
        },
    }))
})()
