// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: smile-wink;

const MODULE = module

function fm() {
    return FileManager[MODULE.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local']()
}

function setStorageDirectory(dirPath) {
    return {
        setStorage(key, value) {
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
        getStorage(key) {
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
        removeStorage(key) {
            const hashKey = hash(key)
            const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey)
            if (FileManager.local().fileExists(filePath)) {
                FileManager.local().remove(hashKey)
            }
            if (Keychain.contains(hashKey)) {
                Keychain.remove(hashKey)
            }
        },

        getStorageAt(key) {
            const hashKey = hash(key)
            const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey)
            return FileManager.local().creationDate(filePath)
        }
    }
}
var setStorage = setStorageDirectory(fm().libraryDirectory()).setStorage
var getStorage = setStorageDirectory(FileManager.local().libraryDirectory()).getStorage
var getStorageAt = setStorageDirectory(FileManager.local().libraryDirectory()).getStorageAt
var removeStorage = setStorageDirectory(FileManager.local().libraryDirectory()).removeStorage

var setCache = setStorageDirectory(FileManager.local().temporaryDirectory()).setStorage
var getCache = setStorageDirectory(FileManager.local().temporaryDirectory()).getStorage
var getCacheAt = setStorageDirectory(FileManager.local().temporaryDirectory()).getStorageAt
var removeCache = setStorageDirectory(FileManager.local().temporaryDirectory()).removeStorage

function hash(string) {
    let hash2 = 0,
        i,
        chr
    for (i = 0; i < string.length; i++) {
        chr = string.charCodeAt(i)
        hash2 = (hash2 << 5) - hash2 + chr
        hash2 |= 0
    }
    return `hash_${hash2}`
}

class Cache {
    constructor(nameSpace, expirationMinutes) {
        this._nameSpace = nameSpace || `${MODULE.filename}`
        this._expirationMinutes = expirationMinutes || 30
        this._cacheTimeMap = new Map()
    }

    setCache(key, value) {
        this._cacheTimeMap[hash(key)] = new Date()
        setCache(`${this._nameSpace}${key}`, value)
    }

    getCache(key, expirationMinutes) {
        const createdAt = getCacheAt(key) || this._cacheTimeMap[hash(key)]
        if (!createdAt || new Date() - createdAt > (expirationMinutes || this._expirationMinutes) * 60000) {
            removeCache(`${this._nameSpace}${key}`)
            return null
        }
        return getCache(`${this._nameSpace}${key}`)
    }

    removeCache(key) {
        removeCache(`${this._nameSpace}${key}`)
    }
}

class Storage {
    constructor(nameSpace, expirationMinutes) {
        this._nameSpace = nameSpace || `${MODULE.filename}`
        this._expirationMinutes = expirationMinutes
        this._cacheTimeMap = new Map()
    }

    setStorage(key, value) {
        setStorage(`${this._nameSpace}${key}`, value)
        if (this._expirationMinutes) {
            this._cacheTimeMap[hash(key)] = new Date()
        }
    }

    getStorage(key, expirationMinutes, isDelStorageWhenTimeExceed) {
        if (expirationMinutes || this._expirationMinutes) {
            const createdAt = getStorageAt(key) || this._cacheTimeMap[hash(key)]
            if (!createdAt || new Date() - createdAt > (expirationMinutes || this._expirationMinutes) * 60000) {
                if (isDelStorageWhenTimeExceed) {
                    removeStorage(`${this._nameSpace}${key}`)
                }
                return null
            }
        }
        return getStorage(`${this._nameSpace}${key}`)
    }

    removeStorage(key) {
        removeStorage(`${this._nameSpace}${key}`)
    }
}

// class Cache {
//     constructor(name, expirationMinutes) {
//         this.fm = FileManager.iCloud();
//         this.rootDir = this.fm.joinPath(this.fm.documentsDirectory(), 'CacheFiles');
//         if (!this.fm.fileExists(this.rootDir)) {
//             this.fm.createDirectory(this.rootDir)
//         }

//         this.cachePath = this.fm.joinPath(this.rootDir, name);
//         this.expirationMinutes = expirationMinutes;

//         if (!this.fm.fileExists(this.cachePath)) {
//             this.fm.createDirectory(this.cachePath)
//         }
//     }

//     async read(key, expirationMinutes) {
//         try {
//             const path = this.fm.joinPath(this.cachePath, key);
//             await this.fm.downloadFileFromiCloud(path);
//             const createdAt = this.fm.creationDate(path);

//             if (this.expirationMinutes || expirationMinutes) {
//                 if ((new Date()) - createdAt > ((this.expirationMinutes || expirationMinutes) * 60000)) {
//                     this.fm.remove(path);
//                     return null;
//                 }
//             }

//             const value = this.fm.readString(path);

//             try {
//                 return JSON.parse(value);
//             } catch (error) {
//                 return value;
//             }
//         } catch (error) {
//             return null;
//         }
//     };

//     write(key, value) {
//         const path = this.fm.joinPath(this.cachePath, key.replace('/', '-'));
//         console.log(`Caching to ${path}...`);

//         if (typeof value === 'string' || value instanceof String) {
//             this.fm.writeString(path, value);
//         } else {
//             this.fm.writeString(path, JSON.stringify(value));
//         }
//     }
// }

module.exports = {
    Cache,
    Storage
}
