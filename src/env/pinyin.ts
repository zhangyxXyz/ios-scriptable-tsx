/*
 * Pinyin runtime extracted from manual/Seiun.Env.js.
 */

function createPinyinRuntime(deps: any) {
    const {globalStorage} = deps
    const pinyinGlobal = globalThis as any
    const CACHE_KEY = 'pinyin_dict_cache'
    let loadingPromise: any = null

    /**
     * 加载拼音字典（从URL加载并永久缓存）
     * @param {string} url - pinyinDict.js 的URL地址
     *
     * 使用方式：
     * await loadPinyinDict('https://your-url/pinyinDict.js')
     * const pinyin = pinyin_default.fullChar('中文')  // 'zhongwen'
     * const first = pinyin_default.firstChar('中文')  // 'zw'
     */
    async function loadPinyinDict(url: any = null) {
        const PINYIN_DICT_URL =
            url || 'https://raw.githubusercontent.com/zhangyxXyz/ios-scriptable/master/data/pinyinDict.js'

        if (pinyinGlobal.pinyinDict) return pinyinGlobal.pinyinDict
        const cachedDict = globalStorage.getStorage(CACHE_KEY, -1)
        if (cachedDict) {
            // console.log('[loadPinyinDict] Using cached pinyin dictionary')
            pinyinGlobal.pinyinDict = cachedDict
            return pinyinGlobal.pinyinDict
        }

        if (loadingPromise && !url) return loadingPromise

        try {
            loadingPromise = (async () => {
                console.log(`[loadPinyinDict] Loading pinyin dictionary from network...`)
                const data = await globalStorage.getFile(PINYIN_DICT_URL)
                const code = data.toRawString()
                eval(code)
                if (pinyinGlobal.pinyinDict) {
                    globalStorage.setStorage(CACHE_KEY, pinyinGlobal.pinyinDict)
                }
                return pinyinGlobal.pinyinDict
            })()
            return await loadingPromise
        } catch (e) {
            console.error(`[loadPinyinDict] Failed to load pinyin dictionary: ${e}`)
            throw new Error('Failed to load pinyin dictionary, please check network connection')
        } finally {
            loadingPromise = null
        }
    }

    function initPinyinUtils() {
        let dictNotone = null
        let loading = false

        function buildDict() {
            if (!pinyinGlobal.pinyinDict) {
                if (!loading) {
                    loading = true
                    loadPinyinDict()
                        .catch(() => {})
                        .finally(() => {
                            loading = false
                        })
                }
                return
            }
            if (dictNotone) return

            dictNotone = {}
            for (const pinyin in pinyinGlobal.pinyinDict) {
                const characters = pinyinGlobal.pinyinDict[pinyin]
                for (let charIndex = 0; charIndex < characters.length; charIndex++) {
                    if (!dictNotone[characters[charIndex]]) {
                        dictNotone[characters[charIndex]] = [pinyin]
                    } else {
                        dictNotone[characters[charIndex]].push(pinyin)
                    }
                }
            }
        }

        async function ensurePinyinDict(url: any = null) {
            await loadPinyinDict(url)
            buildDict()
            return Boolean(dictNotone)
        }

        function generateCombinations(arrays) {
            if (arrays.length === 0) return []
            if (arrays.length === 1) return arrays[0]

            const combinations = []
            function combine(arrayIndex, currentString) {
                if (arrayIndex === arrays.length) {
                    combinations.push(currentString)
                    return
                }
                for (const item of arrays[arrayIndex]) {
                    combine(arrayIndex + 1, currentString + item)
                }
            }
            combine(0, '')
            return combinations
        }

        return {
            getPinyin(chinese) {
                buildDict()
                if (!dictNotone) return []
                if (!chinese || /^ +$/.test(chinese)) return []

                const pinyinArrays = []
                for (let charIndex = 0; charIndex < chinese.length; charIndex++) {
                    const currentChar = chinese.charAt(charIndex)
                    const possiblePinyins = dictNotone[currentChar]
                    pinyinArrays.push(possiblePinyins || [currentChar])
                }
                return generateCombinations(pinyinArrays)
            },

            getFirstLetter(str) {
                buildDict()
                if (!dictNotone) return []
                if (!str || /^ +$/.test(str)) return []

                const pinyinArrays = []
                for (let charIndex = 0; charIndex < str.length; charIndex++) {
                    const charCode = str.charCodeAt(charIndex)
                    const currentChar = str.charAt(charIndex)

                    if (charCode >= 19968 && charCode <= 40869 && dictNotone[currentChar]) {
                        pinyinArrays.push(Array.from(new Set(dictNotone[currentChar].map(p => p.charAt(0)))))
                    } else {
                        pinyinArrays.push([currentChar])
                    }
                }
                return generateCombinations(pinyinArrays)
            },

            async firstChar(str) {
                await ensurePinyinDict()
                const results = this.getFirstLetter(str)
                return results.length > 0 ? results[0] : ''
            },

            async fullChar(str) {
                await ensurePinyinDict()
                const results = this.getPinyin(str)
                return results.length > 0 ? results[0] : ''
            },
        }
    }

    const pinyin_default = initPinyinUtils()

    return {
        pinyin_default,
    }
}

module.exports = {
    createPinyinRuntime,
}

export {}
