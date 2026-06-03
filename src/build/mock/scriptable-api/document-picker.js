;(function () {
    ScriptableMock.register('DocumentPicker', context => {
        const fm = context.makeFileManager()
        const sampleFile = `${fm.documentsDirectory()}/Playground Sample.txt`
        return {
            DocumentPicker: {
                open: async () => [sampleFile],
                openFile: async () => sampleFile,
                openFolder: async () => fm.documentsDirectory(),
                export: async path => [path || sampleFile],
                exportString: async (_content, name = 'Exported Text.txt') => [`${fm.documentsDirectory()}/${name}`],
                exportImage: async (_image, name = 'Exported Image.png') => [`${fm.documentsDirectory()}/${name}`],
                exportData: async (_data, name = 'Exported Data.bin') => [`${fm.documentsDirectory()}/${name}`],
            },
        }
    })
})()
