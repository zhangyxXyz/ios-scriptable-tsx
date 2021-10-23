// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: greater-than;

/**
 *
 * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
 *    :$.time('yyyyMMddHHmmssS')
 *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
 *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
 * @param {*} fmt 格式化参数
 * @param {*} ts 时间戳 13位
 */
function time(fmt, ts = null) {
    const date = ts ? new Date(ts) : new Date()
    let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'H+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds()
    }
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    for (let k in o)
        if (new RegExp('(' + k + ')').test(fmt))
            fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    return fmt
}

function randomColor16() {
    var r = Math.floor(Math.random() * 256)
    if (r + 50 < 255) {
        r = r + 50
    }
    if (r > 230 && r < 255) {
        r = r - 50
    }
    var g = Math.floor(Math.random() * 256)
    if (g + 50 < 255) {
        g = g + 50
    }
    if (g > 230 && g < 255) {
        g = g - 50
    }
    var b = Math.floor(Math.random() * 256)
    if (b + 50 < 255) {
        b = b + 50
    }
    if (b > 230 && b < 255) {
        b = b - 50
    }
    var color = '#' + r.toString(16) + g.toString(16) + b.toString(16)
    return color
}

async function renderUnsupport(w = null) {
    const widget = w || new ListWidget()
    const text = widget.addText('暂不支持')
    text.font = Font.systemFont(20)
    text.textColor = Color.red()
    text.centerAlignText()
}

module.exports = {
    time,
    randomColor16,
    renderUnsupport
}
