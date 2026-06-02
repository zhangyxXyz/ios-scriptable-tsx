/*
 * Storage and cache runtime extracted from manual/Seiun.Env.js.
 */

declare const MODULE: any

function createStorageRuntime(deps: any) {
    const {fm, hash, isHttpUrl} = deps

    // DataStorage
    function setStorageDirectory(dirPath: any) {
        return {
            setStorage(key: any, value: any) {
                const hashKey = hash(key)
                const filePath = FileManager.local().joinPath(dirPath, hashKey)
                if (value instanceof Image) {
                    FileManager.local().writeImage(filePath, value)
                    return
                }
                if (value instanceof Data) {
                    FileManager.local().write(filePath, value)
                }
                Keychain.set(hashKey, JSON.stringify(value))
            },
            getStorage(key: any) {
                const hashKey = hash(key)
                const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey)
                if (FileManager.local().fileExists(filePath)) {
                    const image = Image.fromFile(filePath)
                    const file = Data.fromFile(filePath)
                    return image ? image : file ? file : null
                }
                if (Keychain.contains(hashKey)) {
                    return JSON.parse(Keychain.get(hashKey))
                } else {
                    return null
                }
            },
            removeStorage(key: any) {
                const hashKey = hash(key)
                const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey)
                if (FileManager.local().fileExists(filePath)) {
                    FileManager.local().remove(hashKey)
                }
                if (Keychain.contains(hashKey)) {
                    Keychain.remove(hashKey)
                }
            },

            getStorageAt(key: any) {
                const hashKey = hash(key)
                const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey)
                return FileManager.local().creationDate(filePath)
            },
        }
    }
    const setStorage = setStorageDirectory(fm().libraryDirectory()).setStorage
    const getStorage = setStorageDirectory(FileManager.local().libraryDirectory()).getStorage
    const getStorageAt = setStorageDirectory(FileManager.local().libraryDirectory()).getStorageAt
    const removeStorage = setStorageDirectory(FileManager.local().libraryDirectory()).removeStorage

    const setCache = setStorageDirectory(FileManager.local().temporaryDirectory()).setStorage
    const getCache = setStorageDirectory(FileManager.local().temporaryDirectory()).getStorage
    const getCacheAt = setStorageDirectory(FileManager.local().temporaryDirectory()).getStorageAt
    const removeCache = setStorageDirectory(FileManager.local().temporaryDirectory()).removeStorage

    // Storage
    class Storage {
        [key: string]: any

        constructor(namespace: any, expirationMinutes: any = 30, useICloud: any = true) {
            this._nameSpace = namespace || `${MODULE.filename}`
            this._expirationMinutes = expirationMinutes
            this._cacheTimeMap = new Map()
            this._fm = useICloud ? FileManager.iCloud() : FileManager.local()

            const baseStoragePath = this._fm.joinPath(this._fm.documentsDirectory(), 'storage')
            const namespacePath = namespace ? this._fm.joinPath(baseStoragePath, namespace) : baseStoragePath

            this._imagesPath = this._fm.joinPath(namespacePath, 'images')
            this._dataPath = this._fm.joinPath(namespacePath, 'datas')
            this._urlMapPath = this._fm.joinPath(namespacePath, 'url-map.json')

            if (!this._fm.fileExists(this._imagesPath)) {
                this._fm.createDirectory(this._imagesPath, true)
            }
            if (!this._fm.fileExists(this._dataPath)) {
                this._fm.createDirectory(this._dataPath, true)
            }

            this._urlMap = this._loadUrlMap()
        }

        _loadUrlMap() {
            if (this._fm.fileExists(this._urlMapPath)) {
                try {
                    const data = this._fm.readString(this._urlMapPath)
                    return JSON.parse(data)
                } catch (e) {
                    console.error(`[Storage][_loadUrlMap] Failed to load URL mapping: ${e}`)
                    return {}
                }
            }
            return {}
        }

        _saveUrlMap() {
            try {
                this._fm.writeString(this._urlMapPath, JSON.stringify(this._urlMap, null, 2))
            } catch (e) {
                console.error(`[Storage][_saveUrlMap] Failed to save URL mapping: ${e}`)
            }
        }

        setCache(key: any, value: any) {
            const fullKey = `${this._nameSpace}${key}`
            this._cacheTimeMap[hash(fullKey)] = new Date()
            setCache(fullKey, value)
        }

        getCache(key: any, expirationMinutes: any) {
            const fullKey = `${this._nameSpace}${key}`
            if (expirationMinutes !== undefined && expirationMinutes !== null && expirationMinutes !== -1) {
                if (expirationMinutes === 0) {
                    return null
                }
                const createdAt = getCacheAt(fullKey) || this._cacheTimeMap[hash(fullKey)]
                if (!createdAt || new Date().getTime() - new Date(createdAt).getTime() > expirationMinutes * 60000) {
                    removeCache(fullKey)
                    return null
                }
            }
            return getCache(fullKey)
        }

        getCacheTime(key: any) {
            const fullKey = `${this._nameSpace}${key}`
            return getCacheAt(fullKey) || this._cacheTimeMap[hash(fullKey)] || null
        }

        removeCache(key: any) {
            removeCache(`${this._nameSpace}${key}`)
        }

        setStorage(key: any, value: any) {
            const fullKey = `${this._nameSpace}${key}`
            setStorage(fullKey, value)
            if (this._expirationMinutes) {
                this._cacheTimeMap[hash(fullKey)] = new Date()
            }
        }

        getStorage(key: any, expirationMinutes: any, isDelStorageWhenTimeExceed: any) {
            const fullKey = `${this._nameSpace}${key}`
            if (expirationMinutes !== undefined && expirationMinutes !== null && expirationMinutes !== -1) {
                if (expirationMinutes === 0) {
                    return null
                }
                const createdAt = getStorageAt(fullKey) || this._cacheTimeMap[hash(fullKey)]
                if (!createdAt || new Date().getTime() - new Date(createdAt).getTime() > expirationMinutes * 60000) {
                    if (isDelStorageWhenTimeExceed) {
                        removeStorage(fullKey)
                    }
                    return null
                }
            }
            return getStorage(fullKey)
        }

        getStorageTime(key: any) {
            const fullKey = `${this._nameSpace}${key}`
            return getStorageAt(fullKey) || this._cacheTimeMap[hash(fullKey)] || null
        }

        removeStorage(key: any) {
            removeStorage(`${this._nameSpace}${key}`)
        }

        clearAllStorage() {
            try {
                const baseStoragePath = this._fm.joinPath(this._fm.documentsDirectory(), 'storage')
                const namespacePath = this._nameSpace
                    ? this._fm.joinPath(baseStoragePath, this._nameSpace)
                    : baseStoragePath

                if (this._fm.fileExists(namespacePath)) {
                    this._fm.remove(namespacePath)
                    console.log(`[Storage] 已清空目录: ${namespacePath}`)
                }

                this._cacheTimeMap.clear()

                this._urlMap = {}
            } catch (e) {
                console.error(`[Storage][clearAllStorage] 清空失败: ${e}`)
            }
        }

        _getBase64Signature(base64Data: any) {
            const len = base64Data.length
            const head = base64Data.substring(0, Math.min(16, len))
            const tail = len > 16 ? base64Data.substring(len - 16) : ''
            const signatureStr = `${len}_${head}_${tail}`
            let h = 0
            for (let i = 0; i < signatureStr.length; i++) {
                h = ((h << 5) - h + signatureStr.charCodeAt(i)) | 0
            }
            return `${len}_${Math.abs(h).toString(36)}`
        }

        _getFileName(key: any, isWrite: any = false) {
            if (isHttpUrl(key)) {
                const urlPath = key.split('?')[0]

                if (this._urlMap[urlPath]) {
                    return this._urlMap[urlPath]
                }

                const originalName = urlPath.split('/').pop() || 'file'

                if (!isWrite) {
                    return originalName
                }

                let fileName = originalName
                const nameParts = originalName.split('.')
                const ext = nameParts.length > 1 ? nameParts.pop() : ''
                const baseName = nameParts.join('.')

                const existingUrls = Object.keys(this._urlMap)
                const existingFileNames = Object.values(this._urlMap)
                let counter = 1

                while (existingFileNames.includes(fileName)) {
                    fileName = ext ? `${baseName}_${counter}.${ext}` : `${baseName}_${counter}`
                    counter++
                }

                this._urlMap[urlPath] = fileName
                this._saveUrlMap()

                return fileName
            }

            if (key.startsWith('base64:')) {
                const parts = key.substring(7).split(':')
                const dataSignature = parts[0]
                const cacheKey = parts[1] || 'base64_image'
                const mapKey = `base64:${dataSignature}`

                if (this._urlMap[mapKey]) {
                    const existingFileName = this._urlMap[mapKey]
                    const expectedPrefix = (cacheKey.includes('.') ? cacheKey.split('.')[0] : cacheKey) + '_'

                    if (!existingFileName.startsWith(expectedPrefix)) {
                        throw new Error(
                            `Base64 签名冲突！签名 [${dataSignature}] 已被文件 [${existingFileName}] 占用。请为当前图片使用不同的 cacheKey（当前: ${cacheKey}）`,
                        )
                    }

                    return existingFileName
                }

                if (!isWrite) {
                    return cacheKey
                }

                const signatureSuffix = dataSignature.split('_')[1] || dataSignature
                const originalName = cacheKey.includes('.') ? cacheKey : `${cacheKey}.png`
                const nameParts = originalName.split('.')
                const ext = nameParts.pop()
                const baseName = nameParts.join('.')

                let fileName = `${baseName}_${signatureSuffix}.${ext}`
                const existingFileNames = Object.values(this._urlMap)
                let counter = 1

                while (existingFileNames.includes(fileName)) {
                    fileName = `${baseName}_${signatureSuffix}_${counter}.${ext}`
                    counter++
                }

                this._urlMap[mapKey] = fileName
                this._saveUrlMap()

                return fileName
            }

            return key || 'file'
        }

        _getFilePath(key: any, useImagesPath: any = false) {
            const fileName = this._getFileName(key)
            const basePath = useImagesPath ? this._imagesPath : this._dataPath
            return this._fm.joinPath(basePath, fileName)
        }

        _getImageExtRegex() {
            return /\.(png|jpg|jpeg|gif|webp|bmp|ico|tiff|tif|heic|heif)$/i
        }

        _hasImageExtension(fileName: any) {
            return this._getImageExtRegex().test(fileName)
        }

        _isImageFile(fileName: any) {
            return this._hasImageExtension(fileName) || fileName.endsWith('.base64img')
        }

        setFile(key: any, value: any) {
            const isImageValue = value instanceof Image || (typeof value === 'string' && value.startsWith('data:image'))
            const fileName = this._getFileName(key, true)
            const isImageFile = this._isImageFile(fileName)
            const isImage = isImageValue || isImageFile
            const basePath = isImage ? this._imagesPath : this._dataPath
            let filePath = this._fm.joinPath(basePath, fileName)
            try {
                if (value instanceof Image) {
                    if (!this._hasImageExtension(filePath)) {
                        filePath = filePath + '.png'
                    }
                    this._fm.writeImage(filePath, value)
                } else if (value instanceof Data) {
                    this._fm.write(filePath, value)
                } else {
                    const str = typeof value === 'string' ? value : JSON.stringify(value)
                    if (str.startsWith('data:image')) {
                        filePath = filePath.replace(this._getImageExtRegex(), '') + '.base64img'
                    }
                    const data = Data.fromString(str)
                    this._fm.write(filePath, data)
                }
            } catch (e) {
                console.error(`[Storage][setFile] Storage setFile error: ${e}`)
            }
        }

        async getFile(key: any, useCache: any = true, logable: any = true) {
            const isUrl = isHttpUrl(key)
            const urlPath = isUrl ? key.split('?')[0] : key
            const fileName = this._getFileName(urlPath)
            const isImage = this._isImageFile(fileName)
            const basePath = isImage ? this._imagesPath : this._dataPath
            const filePath = this._fm.joinPath(basePath, fileName)

            if (useCache) {
                if (this._fm.fileExists(filePath)) {
                    try {
                        if (logable)
                            console.log(`[Storage][getFile] Using cached ${isImage ? 'image' : 'file'}: ${fileName}`)
                        return isImage ? Image.fromFile(filePath) : this._fm.read(filePath)
                    } catch (e) {
                        console.error(`[Storage][getFile] Storage getFile error: ${e}`)
                    }
                }

                if (isImage && !this._hasImageExtension(fileName)) {
                    const filePathWithExt = filePath + '.png'
                    if (this._fm.fileExists(filePathWithExt)) {
                        try {
                            if (logable) console.log(`[Storage][getFile] Using cached image: ${fileName}.png`)
                            return Image.fromFile(filePathWithExt)
                        } catch (e) {
                            console.error(`[Storage][getFile] Storage getFile error: ${e}`)
                        }
                    }
                }

                if (!isImage) {
                    const base64Path = filePath.replace(this._getImageExtRegex(), '') + '.base64img'
                    if (this._fm.fileExists(base64Path)) {
                        try {
                            if (logable) console.log(`[Storage][getFile] Using cached base64 image: ${fileName}`)
                            return this._fm.read(base64Path)
                        } catch (e) {
                            console.error(`[Storage][getFile] Storage getFile error: ${e}`)
                        }
                    }
                }

                if (!isImage && !isUrl) {
                    const imageFilePath = this._fm.joinPath(this._imagesPath, fileName)
                    if (this._fm.fileExists(imageFilePath)) {
                        try {
                            if (logable) console.log(`[Storage][getFile] Using cached image: ${fileName}`)
                            return Image.fromFile(imageFilePath)
                        } catch (e) {
                            console.error(`[Storage][getFile] Storage getFile error: ${e}`)
                        }
                    }
                    const imageFilePathWithExt = imageFilePath + '.png'
                    if (this._fm.fileExists(imageFilePathWithExt)) {
                        try {
                            if (logable) console.log(`[Storage][getFile] Using cached image: ${fileName}.png`)
                            return Image.fromFile(imageFilePathWithExt)
                        } catch (e) {
                            console.error(`[Storage][getFile] Storage getFile error: ${e}`)
                        }
                    }
                }
            }

            if (!isUrl) {
                return null
            }

            try {
                if (logable)
                    console.log(`[Storage][getFile] Downloading ${isImage ? 'image' : 'file'} online: ${fileName}`)
                const req = new Request(key)
                if (isImage) {
                    const imgData = await req.load()
                    // SVG 文件不支持，直接返回 null
                    if (fileName.toLowerCase().endsWith('.svg')) {
                        if (logable) console.error(`[Storage][getFile] SVG format not supported: ${fileName}`)
                        return null
                    }
                    try {
                        const img = Image.fromData(imgData)
                        if (img) {
                            this.setFile(urlPath, img)
                            return img
                        }
                    } catch (e) {
                        console.error(`[Storage][getFile] Image.fromData failed: ${e}`)
                    }
                    return null
                } else {
                    const data = await req.load()
                    this.setFile(urlPath, data)
                    return data
                }
            } catch (e) {
                console.error(`[Storage][getFile] File download failed: ${e}`)
                if (useCache) {
                    if (this._fm.fileExists(filePath)) {
                        try {
                            if (logable)
                                console.log(
                                    `[Storage][getFile] Using cached ${isImage ? 'image' : 'file'}: ${fileName}`,
                                )
                            return isImage ? Image.fromFile(filePath) : this._fm.read(filePath)
                        } catch (e2) {
                            console.error(`[Storage][getFile] Storage getFile error: ${e2}`)
                        }
                    }
                }
                throw e
            }
        }

        removeFile(key: any, useImagesPath: any = false) {
            const isUrl = isHttpUrl(key)
            const urlPath = isUrl ? key.split('?')[0] : key
            const fileName = this._getFileName(urlPath)
            const basePath = useImagesPath ? this._imagesPath : this._dataPath
            const filePath = this._fm.joinPath(basePath, fileName)

            let removed = false
            if (this._fm.fileExists(filePath)) {
                try {
                    this._fm.remove(filePath)
                    removed = true
                } catch (e) {
                    console.error(`[Storage][removeFile] Storage removeFile error: ${e}`)
                }
            }

            if (!this._hasImageExtension(fileName)) {
                const filePathWithExt = filePath + '.png'
                if (this._fm.fileExists(filePathWithExt)) {
                    try {
                        this._fm.remove(filePathWithExt)
                        removed = true
                    } catch (e) {
                        console.error(`[Storage][removeFile] Storage removeFile error: ${e}`)
                    }
                }
            }

            const base64Path = filePath.replace(this._getImageExtRegex(), '') + '.base64img'
            if (this._fm.fileExists(base64Path)) {
                try {
                    this._fm.remove(base64Path)
                    removed = true
                } catch (e) {
                    console.error(`[Storage][removeFile] Storage removeFile error: ${e}`)
                }
            }

            if (removed && isUrl && this._urlMap[urlPath]) {
                delete this._urlMap[urlPath]
                this._saveUrlMap()
            }

            return removed
        }

        async getImage(
            key: any,
            returnImage: any = false,
            useCache: any = true,
            logable: any = true,
            cacheKey: any = null,
        ) {
            const isUrl = isHttpUrl(key)
            const isBase64 = key.startsWith('data:image')
            const urlPath = isUrl ? key.split('?')[0] : key
            const fileName = this._getFileName(urlPath)

            if (isBase64) {
                const imageFormat = key.split(';')[0].split('/')[1] || 'png'

                if (!cacheKey) {
                    try {
                        const base64Data = key.split(',')[1]
                        const imgData = Data.fromBase64String(base64Data)
                        const img = Image.fromData(imgData)
                        if (logable) console.log(`[Storage][getImage] Converting base64 image (no cache)`)
                        return returnImage ? img : this.imageToBase64(img, `temp.${imageFormat}`)
                    } catch (e) {
                        console.error(`[Storage][getImage] Base64 image conversion failed: ${e}`)
                        return null
                    }
                }

                try {
                    const base64Data = key.split(',')[1]
                    const dataSignature = this._getBase64Signature(base64Data)
                    const finalCacheKey = cacheKey.includes('.') ? cacheKey : `${cacheKey}.${imageFormat}`
                    const base64Key = `base64:${dataSignature}:${finalCacheKey}`

                    if (useCache) {
                        const cachedData = await this.getFile(base64Key, true, false)
                        if (cachedData) {
                            if (logable) console.log(`[Storage][getImage] Using cached base64 image: ${finalCacheKey}`)
                            try {
                                const img = cachedData instanceof Image ? cachedData : Image.fromData(cachedData)
                                return returnImage ? img : this.imageToBase64(img, finalCacheKey)
                            } catch (e) {
                                console.error(`[Storage][getImage] Base64 cache conversion failed: ${e}`)
                            }
                        }
                    }

                    const imgData = Data.fromBase64String(base64Data)
                    const img = Image.fromData(imgData)

                    this.setFile(base64Key, img)
                    if (logable)
                        console.log(
                            `[Storage][getImage] Converted and cached base64 image: ${finalCacheKey} [${dataSignature}]`,
                        )
                    return returnImage ? img : this.imageToBase64(img, finalCacheKey)
                } catch (e) {
                    console.error(`[Storage][getImage] Base64 image conversion failed: ${e}`)
                    return null
                }
            }

            if (useCache) {
                const cachedData = await this.getFile(key, true, false)
                if (cachedData) {
                    if (logable) console.log(`[Storage][getImage] Using cache: ${fileName}`)
                    try {
                        const img = cachedData instanceof Image ? cachedData : Image.fromData(cachedData)
                        return returnImage ? img : this.imageToBase64(img, fileName + '.png')
                    } catch (e) {
                        console.error(`[Storage][getImage] Cached image conversion failed: ${e}`)
                    }
                }
            }

            if (!isUrl) {
                return null
            }

            try {
                if (logable) console.log(`[Storage][getImage] Online request: ${fileName}`)
                const img = await this.getFile(key, false, false)
                if (!img) {
                    if (logable) console.log(`[Storage][getImage] Image download failed, returning null: ${fileName}`)
                    return null
                }
                return returnImage ? img : this.imageToBase64(img, fileName)
            } catch (e) {
                console.error(`[Storage][getImage] Image loading failed: ${e}`)
                const cachedData = await this.getFile(key, true, false)
                if (cachedData) {
                    if (logable) console.log(`[Storage][getImage] Using cached image: ${fileName}`)
                    try {
                        const img = cachedData instanceof Image ? cachedData : Image.fromData(cachedData)
                        return returnImage ? img : this.imageToBase64(img, fileName)
                    } catch (e2) {
                        console.error(`[Storage][getImage] Cached image conversion failed: ${e2}`)
                    }
                }
                if (logable)
                    console.log(`[Storage][getImage] Image loading completely failed, no cache available: ${fileName}`)
                return null
            }
        }

        deleteImage(imageUrl: any) {
            const result = this.removeFile(imageUrl, true)
            if (result) {
                const urlPath = imageUrl.split('?')[0]
                const fileName = urlPath.split('/').pop() || 'icon.png'
                console.log(`[Storage][deleteImage] Deleted icon cache: ${fileName}`)
            }
            return result
        }

        imageToBase64(img: any, fileName: any) {
            const ext = fileName.split('.').pop().toLowerCase()
            if (ext === 'png') {
                return `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`
            } else if (ext === 'jpg' || ext === 'jpeg') {
                return `data:image/jpeg;base64,${Data.fromJPEG(img).toBase64String()}`
            } else {
                return `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`
            }
        }
    }

    return {
        Storage,
        setStorage,
        getStorage,
        getStorageAt,
        removeStorage,
        setCache,
        getCache,
        getCacheAt,
        removeCache,
    }
}

module.exports = {
    createStorageRuntime,
}

export {}
