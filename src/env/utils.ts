/*
 * Utility runtime extracted from manual/Seiun.Env.js.
 */

function createUtilsRuntime(deps: any) {
    const {isEmpty, pinyin_default, drawTextWithCustomFont} = deps

    function time(fmt, ts = null) {
        const date = ts ? new Date(ts) : new Date()
        const o = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'H+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds(),
            'q+': Math.floor((date.getMonth() + 3) / 3),
            S: date.getMilliseconds(),
        }
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
        for (const k in o)
            if (new RegExp('(' + k + ')').test(fmt))
                fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
        return fmt
    }

    function randomColor16() {
        let r = Math.floor(Math.random() * 256)
        if (r + 50 < 255) {
            r = r + 50
        }
        if (r > 230 && r < 255) {
            r = r - 50
        }
        let g = Math.floor(Math.random() * 256)
        if (g + 50 < 255) {
            g = g + 50
        }
        if (g > 230 && g < 255) {
            g = g - 50
        }
        let b = Math.floor(Math.random() * 256)
        if (b + 50 < 255) {
            b = b + 50
        }
        if (b > 230 && b < 255) {
            b = b - 50
        }
        const color = '#' + r.toString(16) + g.toString(16) + b.toString(16)
        return color
    }

    async function renderUnsupport(w = null) {
        const widget = w || new ListWidget()
        const text = widget.addText('暂不支持')
        text.font = Font.systemFont(20)
        text.textColor = Color.red()
        text.centerAlignText()
    }

    const Utils = {
        time,
        randomColor16,
        isEmpty,
        renderUnsupport,
        char2PinFirstChar: (value: any) => pinyin_default.firstChar(value),
        char2PinFullChar: (value: any) => pinyin_default.fullChar(value),
        drawTextWithCustomFont,
    }

    return {
        Utils,
        time,
        randomColor16,
        renderUnsupport,
    }
}

module.exports = {
    createUtilsRuntime,
}

export {}
