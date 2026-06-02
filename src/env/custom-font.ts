/*
 * Custom font runtime extracted from manual/Seiun.Env.js.
 */

function createCustomFontRuntime(deps: any) {
    const {globalStorage, isHttpUrl} = deps

    /**
     * 绘制自定义字体文本
     * @param {string} fontUrl ttf字体url
     * @param {string} text 文本
     * @param {number} fontSize 文本字体大小
     * @param {Color} textColor 文本颜色
     * @param {string} align 文本对齐
     * @param {number} lineLimit 行数
     * @param {number} rowSpacing 行间距
     * @returns 绘制的文字图片
     */
    async function drawTextWithCustomFont(
        fontUrl,
        text,
        fontSize,
        textColor,
        align = 'center',
        lineLimit = 1,
        rowSpacing = 5,
    ) {
        const font = new CustomFont(new WebView(), {
            fontFamily: 'customFont', // 字体名称
            fontUrl: fontUrl, // 字体地址
            timeout: 60000, // 加载字体的超时时间
        }) // 创建字体
        await font.load() // 加载字体
        const image = await font.drawText(text, {
            fontSize: fontSize, // 字体大小
            textWidth: 0, // 文本宽度
            align: align, // left、right、center
            lineLimit: lineLimit, // 文本行数限制
            rowSpacing: rowSpacing, // 文本行间距
            textColor: textColor, // 文本颜色
            scale: 2, // 缩放因子
        })
        return image
    }

    /**
     * 自定义字体渲染 'https://mashangkaifa.coding.net/p/coding-code-guide/d/coding-code-guide/git/raw/master/jf-openhuninn-1.0.ttf'
     */
    class CustomFont {
        [key: string]: any

        constructor(webview, config) {
            this.webview = webview || new WebView()
            this.fontFamily = config.fontFamily || 'customFont'
            this.fontUrl = config.fontUrl
            this.timeout = config.timeout || 60000
        }

        async load() {
            let fontSrc = this.fontUrl
            if (typeof fontSrc === 'string' && isHttpUrl(fontSrc)) {
                const data = await globalStorage.getFile(fontSrc, true, false)
                const base64 = data.toBase64String()
                fontSrc = `data:font/ttf;base64,${base64}`
            }
            const fontFaceSrc = `url(${fontSrc})`
            return await this.webview.evaluateJavaScript(`
                const customFont = new FontFace("${this.fontFamily}", "${fontFaceSrc}");
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                let baseHeight, extendHeight;
                console.log('[FontLoader][load] loading font.');
                customFont.load().then((font) => {
                    document.fonts.add(font);
                    console.log('[FontLoader][load] load font successfully.');
                    completion(true);
                });
                setTimeout(() => {
                    console.log('[FontLoader][load] load font failed: timeout.');
                    completion(false);
                }, ${this.timeout});
                null
            `)
        }

        async drawText(text, config) {
            // 配置
            const fontSize = config.fontSize || 20
            const textWidth = config.textWidth || 300
            const align = config.align || 'left' // left、right、center
            const lineLimit = config.lineLimit || 99
            const rowSpacing = config.rowSpacing || 0
            const textColor = config.textColor || 'white'

            const textArray = await this.cutText(text, fontSize, textWidth)
            const scale = config.scale || 1

            let script = ''
            for (const i in textArray) {
                const index = Number(i)
                let content = textArray[i].str
                const length = textArray[i].len

                if (index >= lineLimit) break
                if (index == lineLimit - 1 && index < textArray.length - 1) content = content.replace(/(.{1})$/, '…')

                let x = 0,
                    y = index * fontSize
                if (rowSpacing > 0 && index > 0) y = y + rowSpacing
                if (index > 0) {
                    if (align === 'right') {
                        x = textWidth - length
                    } else if (align === 'center') {
                        x = (textWidth - length) / 2
                    }
                }
                script = script + `ctx.fillText("${content}", ${x}, ${y});`
            }

            const realWidth = textArray.length > 1 ? textWidth : textArray[0].len
            const lineCount = lineLimit < textArray.length ? lineLimit : textArray.length
            const returnValue = await this.webview.evaluateJavaScript(`
                canvas.width = ${realWidth} * ${scale};
                ctx.font = "${fontSize}px ${this.fontFamily}";
                ctx.textBaseline = "hanging";
                baseHeight = ${(fontSize + rowSpacing) * (lineCount - 1)};
                extendHeight = ctx.measureText('qypgj').actualBoundingBoxDescent;
                canvas.height = (baseHeight + extendHeight) * ${scale};
                ctx.scale(${scale}, ${scale});
                ctx.font = "${fontSize}px ${this.fontFamily}";
                ctx.fillStyle = "${textColor}";
                ctx.textBaseline = "hanging";
                ${script}
                canvas.toDataURL()
            `)

            const imageDataString = returnValue.slice(22)
            const imageData = Data.fromBase64String(imageDataString)
            return Image.fromData(imageData)
        }

        async cutText(text, fontSize, textWidth) {
            // 处理文本
            return await this.webview.evaluateJavaScript(`
                function cutText(textWidth, text) {
                    ctx.font = "${fontSize}px ${this.fontFamily}";
                    ctx.textBaseline = "hanging";
    
                    let textArray = [];
                    let len = 0, str = '';
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        const width = ctx.measureText(char).width;
                        if (len < textWidth) {
                            str = str + char;
                            len = len + width;
                        }
                        if (len == textWidth) {
                            textArray.push({ str: str, len: len });
                            str = '';
                            len = 0;
                        }
                        if (len > textWidth) {
                            textArray.push({
                                str: str.substring(0, str.length - 1),
                                len: len - width,
                            });
                            str = char;
                            len = width;
                        }
                        if (i == text.length - 1 && str) {
                            textArray.push({ str: str, len: len });
                        }
                    }
                    return textArray;
                }
                cutText(${textWidth}, ${JSON.stringify(text)})
            `)
        }
    }

    return {
        drawTextWithCustomFont,
    }
}

module.exports = {
    createCustomFontRuntime,
}

export {}
