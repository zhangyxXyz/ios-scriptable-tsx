// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: cogs;

/*
 * author   :  yx.zhang
 * date     :  2021/11/13
 * desc     :  Scriptable Widget env scripts, 基于2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module
var URLSchemeFrom
;(function (URLSchemeFrom2) {
    URLSchemeFrom2['WIDGET'] = 'widget'
})(URLSchemeFrom || (URLSchemeFrom = {}))

function fm() {
    return FileManager[MODULE.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local']()
}

class WidgetBase {
    constructor(arg) {
        this.arg = arg
        try {
            this.init()
        } catch (error) {
            console.log(error)
        }
        this.isNight = Device.isUsingDarkAppearance()
    }

    _actions = {}
    BACKGROUND_NIGHT_KEY
    widgetColor
    backGroundColor
    useBoxJS = true
    isNight
    _actionsIcon = {}

    // 组件当前设置
    _extraSettings = {}
    // 组件附加设置
    currentSettings = {}
    // currentSettings = {
    //     basicSettings: {
    //         urlJumpType: { val: '跳转到浏览器', type: this.settingValTypeString }
    //     }
    // }

    // 无分类分类名称（未指定分类的当前设置存放在 this.settings[this.noneCategoryName]）下
    noneCategoryName = 'noneCategory'
    settingValTypeString = 'string'
    stttingValTypeStringEmptyCheck = 'stringecheck' // 如果是空字符 赋值为 null
    settingValTypeInt = 'int'
    settingValTypeFloat = 'float'
    settingValTypeBool = 'bool'

    // 获取 Request 对象
    getRequest = (url = '') => {
        return new Request(url)
    }

    // 发起请求
    http = async (options = { headers: {}, url: '' }, type = 'JSON') => {
        try {
            let request
            if (type !== 'IMG') {
                request = this.getRequest()
                Object.keys(options).forEach(key => {
                    request[key] = options[key]
                })
                request.headers = { ...this.defaultHeaders, ...options.headers }
            } else {
                request = this.getRequest(options.url)
                return (await request.loadImage()) || SFSymbol.named('photo').image
            }
            if (type === 'JSON') {
                return await request.loadJSON()
            }
            if (type === 'STRING') {
                return await request.loadString()
            }
            return await request.loadJSON()
        } catch (e) {
            console.log('error:' + e)
            if (type === 'IMG') return SFSymbol.named('photo').image
        }
    }

    //request 接口请求
    $request = {
        get: async (url = '', options = {}, type = 'JSON') => {
            let params = { ...options, method: 'GET' }
            if (typeof url === 'object') {
                params = { ...params, ...url }
            } else {
                params.url = url
            }
            let _type = type
            if (typeof options === 'string') _type = options
            return await this.http(params, _type)
        },
        post: async (url = '', options = {}, type = 'JSON') => {
            let params = { ...options, method: 'POST' }
            if (typeof url === 'object') {
                params = { ...params, ...url }
            } else {
                params.url = url
            }
            let _type = type
            if (typeof options === 'string') _type = options
            return await this.http(params, _type)
        }
    }

    // 获取 boxJS 缓存
    getCache = async key => {
        try {
            const url = 'http://' + this.prefix + '/query/boxdata'
            const boxdata = await this.$request.get(url)
            console.log(boxdata.datas[key])
            if (key) return boxdata.datas[key]
            return boxdata.datas
        } catch (e) {
            console.log(e)
            return false
        }
    }

    transforJSON = str => {
        if (typeof str == 'string') {
            try {
                return JSON.parse(str)
            } catch (e) {
                console.log(e)
                return str
            }
        }
        console.log('It is not a string!')
    }

    // 选择图片并缓存
    chooseImg = async () => {
        return await Photos.fromLibrary()
    }

    // 设置 widget 背景图片
    getWidgetBackgroundImage = async widget => {
        const backgroundImage = this.getBackgroundImage()
        if (backgroundImage) {
            const opacity = Device.isUsingDarkAppearance() ? Number(this.settings.darkOpacity) : Number(this.settings.lightOpacity)
            widget.backgroundImage = await this.shadowImage(backgroundImage, '#000', opacity)
            return true
        } else {
            if (this.backGroundColor.colors) {
                widget.backgroundGradient = this.backGroundColor
            } else {
                widget.backgroundColor = this.backGroundColor
            }
            return false
        }
    }

    /**
     * 验证图片尺寸： 图片像素超过 1000 左右的时候会导致背景无法加载
     * @param img Image
     */
    verifyImage = async img => {
        try {
            const { width, height } = img.size
            const direct = true
            if (width > 1000) {
                const options = ['取消', '打开图像处理']
                const message =
                    '您的图片像素为' +
                    width +
                    ' x ' +
                    height +
                    '\n' +
                    '请将图片' +
                    (direct ? '宽度' : '高度') +
                    '调整到 1000 以下\n' +
                    (!direct ? '宽度' : '高度') +
                    '自动适应'
                const index = await this.generateAlert(message, options)
                if (index === 1) Safari.openInApp('https://www.sojson.com/image/change.html', false)
                return false
            }
            return true
        } catch (e) {
            return false
        }
    }

    /**
     * 获取截图中的组件剪裁图
     * 可用作透明背景
     * 返回图片image对象
     * 代码改自：https://gist.github.com/mzeryck/3a97ccd1e059b3afa3c6666d27a496c9
     * @param {string} title 开始处理前提示用户截图的信息，可选（适合用在组件自定义透明背景时提示）
     */
    async getWidgetScreenShot(title = null) {
        // Crop an image into the specified rect.
        function cropImage(img, rect) {
            let draw = new DrawContext()
            draw.size = new Size(rect.width, rect.height)

            draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y))
            return draw.getImage()
        }

        // Pixel sizes and positions for widgets on all supported phones.
        function phoneSizes() {
            return {
                // 12 Pro Max
                2778: {
                    small: 510,
                    medium: 1092,
                    large: 1146,
                    left: 96,
                    right: 678,
                    top: 246,
                    middle: 882,
                    bottom: 1518
                },

                // 12 and 12 Pro
                2532: {
                    small: 474,
                    medium: 1014,
                    large: 1062,
                    left: 78,
                    right: 618,
                    top: 231,
                    middle: 819,
                    bottom: 1407
                },

                // 11 Pro Max, XS Max
                2688: {
                    small: 507,
                    medium: 1080,
                    large: 1137,
                    left: 81,
                    right: 654,
                    top: 228,
                    middle: 858,
                    bottom: 1488
                },

                // 11, XR
                1792: {
                    small: 338,
                    medium: 720,
                    large: 758,
                    left: 54,
                    right: 436,
                    top: 160,
                    middle: 580,
                    bottom: 1000
                },

                // 11 Pro, XS, X, 12 mini
                2436: {
                    x: {
                        small: 465,
                        medium: 987,
                        large: 1035,
                        left: 69,
                        right: 591,
                        top: 213,
                        middle: 783,
                        bottom: 1353
                    },

                    mini: {
                        small: 465,
                        medium: 987,
                        large: 1035,
                        left: 69,
                        right: 591,
                        top: 231,
                        middle: 801,
                        bottom: 1371
                    }
                },

                // Plus phones
                2208: {
                    small: 471,
                    medium: 1044,
                    large: 1071,
                    left: 99,
                    right: 672,
                    top: 114,
                    middle: 696,
                    bottom: 1278
                },

                // SE2 and 6/6S/7/8
                1334: {
                    small: 296,
                    medium: 642,
                    large: 648,
                    left: 54,
                    right: 400,
                    top: 60,
                    middle: 412,
                    bottom: 764
                },

                // SE1
                1136: {
                    small: 282,
                    medium: 584,
                    large: 622,
                    left: 30,
                    right: 332,
                    top: 59,
                    middle: 399,
                    bottom: 399
                },

                // 11 and XR in Display Zoom mode
                1624: {
                    small: 310,
                    medium: 658,
                    large: 690,
                    left: 46,
                    right: 394,
                    top: 142,
                    middle: 522,
                    bottom: 902
                },

                // Plus in Display Zoom mode
                2001: {
                    small: 444,
                    medium: 963,
                    large: 972,
                    left: 81,
                    right: 600,
                    top: 90,
                    middle: 618,
                    bottom: 1146
                }
            }
        }

        let message = title || '开始之前，请先前往桌面，截取空白界面的截图。然后回来继续'
        let exitOptions = ['我已截图', '前去截图 >']
        let shouldExit = await this.generateAlert(message, exitOptions)
        if (shouldExit) return

        // Get screenshot and determine phone size.
        let img = await Photos.fromLibrary()
        let height = img.size.height
        let phone = phoneSizes()[height]
        if (!phone) {
            message = '好像您选择的照片不是正确的截图，请先前往桌面'
            await this.generateAlert(message, ['我已知晓'])
            return
        }

        // Extra setup needed for 2436-sized phones.
        if (height === 2436) {
            const files = this.FILE_MGR_LOCAL
            let cacheName = 'mz-phone-type'
            let cachePath = files.joinPath(files.libraryDirectory(), cacheName)

            // If we already cached the phone size, load it.
            if (files.fileExists(cachePath)) {
                let typeString = files.readString(cachePath)
                phone = phone[typeString]
                // Otherwise, prompt the user.
            } else {
                message = '您的📱型号是?'
                let types = ['iPhone 12 mini', 'iPhone 11 Pro, XS, or X']
                let typeIndex = await this.generateAlert(message, types)
                let type = typeIndex === 0 ? 'mini' : 'x'
                phone = phone[type]
                files.writeString(cachePath, type)
            }
        }

        // Prompt for widget size and position.
        message = '截图中要设置透明背景组件的尺寸类型是？'
        let sizes = ['小尺寸', '中尺寸', '大尺寸']
        let size = await this.generateAlert(message, sizes)
        let widgetSize = sizes[size]

        message = '要设置透明背景的小组件在哪个位置？'
        message += height === 1136 ? ' （备注：当前设备只支持两行小组件，所以下边选项中的「中间」和「底部」的选项是一致的）' : ''

        // Determine image crop based on phone size.
        let crop = { w: '', h: '', x: '', y: '' }
        if (widgetSize === '小尺寸') {
            crop.w = phone.small
            crop.h = phone.small
            let positions = ['左上角', '右上角', '中间左', '中间右', '左下角', '右下角']
            let _posotions = ['Top left', 'Top right', 'Middle left', 'Middle right', 'Bottom left', 'Bottom right']
            let position = await this.generateAlert(message, positions)

            // Convert the two words into two keys for the phone size dictionary.
            let keys = _posotions[position].toLowerCase().split(' ')
            crop.y = phone[keys[0]]
            crop.x = phone[keys[1]]
        } else if (widgetSize === '中尺寸') {
            crop.w = phone.medium
            crop.h = phone.small

            // Medium and large widgets have a fixed x-value.
            crop.x = phone.left
            let positions = ['顶部', '中间', '底部']
            let _positions = ['Top', 'Middle', 'Bottom']
            let position = await this.generateAlert(message, positions)
            let key = _positions[position].toLowerCase()
            crop.y = phone[key]
        } else if (widgetSize === '大尺寸') {
            crop.w = phone.medium
            crop.h = phone.large
            crop.x = phone.left
            let positions = ['顶部', '底部']
            let position = await this.generateAlert(message, positions)

            // Large widgets at the bottom have the "middle" y-value.
            crop.y = position ? phone.middle : phone.top
        }

        // Crop image and finalize the widget.
        return cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h))
    }

    setLightAndDark = async (title, desc, val) => {
        try {
            const a = new Alert()
            a.title = title
            a.message = desc
            a.addTextField('', `${this.settings[val]}`)
            a.addAction('确定')
            a.addCancelAction('取消')
            const id = await a.presentAlert()
            if (id === -1) return
            this.settings[val] = a.textFieldValue(0)
            this.saveSettings()
        } catch (e) {
            console.log(e)
        }
    }

    /**
     * 弹出输入框
     * @param title 标题
     * @param desc  描述
     * @param opt   属性
     * @param category 属性分类
     * @param isSave 是否保存设置
     * @returns {Promise<void>}
     */
    setAlertInput = async (title, desc, opt = {}, category = null, isSave = true) => {
        const a = new Alert()
        a.title = title
        a.message = !desc ? '' : desc
        Object.keys(opt).forEach(key => {
            const curCategory = category || this.noneCategoryName
            a.addTextField(
                opt[key],
                curCategory !== this.noneCategoryName
                    ? this.settings.hasOwnProperty(curCategory) && this.settings[curCategory].hasOwnProperty(key)
                        ? this.settings[curCategory][key] || ''
                        : ''
                    : this.settings[key]
            )
        })
        a.addAction('确定')
        a.addCancelAction('取消')
        const id = await a.presentAlert()
        if (id === -1) return
        const data = {}
        Object.keys(opt).forEach((key, index) => {
            data[key] = a.textFieldValue(index)
            const curCategory = category || this.noneCategoryName
            if (this.currentSettings.hasOwnProperty(curCategory) && this.currentSettings[curCategory].hasOwnProperty(key)) {
                this.updateCurrentSettings(this.currentSettings[curCategory][key], data[key])
            }
        })
        // 保存到本地
        if (isSave) {
            if (category) {
                Object.keys(data).forEach(key => {
                    this.settings[category] = this.settings[category] || {}
                    this.settings[category][key] = data[key]
                })
            } else {
                this.settings = { ...this.settings, ...data }
            }
            return this.saveSettings()
        }
        return data
    }

    /**
     * 弹出选择框
     * @param title 标题
     * @param desc  描述
     * @param settingKey 设置项key
     * @param menu   菜单
     * @param category 属性分类
     * @param isSave 是否保存设置
     * @returns {Promise<void>}
     */
    setAlertSelect = async (title, desc, settingKey, menu = [], category = null, isSave = true) => {
        const a = new Alert()
        a.title = title
        a.message = !desc ? '' : desc
        a.addCancelAction('取消')
        Object.keys(menu).forEach(key => {
            a.addAction(menu[key])
        })
        const id = await a.presentAlert()
        if (id === -1) return
        const data = {}
        data[settingKey] = menu[id]
        const curCategory = category || this.noneCategoryName
        if (this.currentSettings.hasOwnProperty(curCategory) && this.currentSettings[curCategory].hasOwnProperty(settingKey)) {
            this.updateCurrentSettings(this.currentSettings[curCategory][settingKey], data[settingKey])
        }
        // 保存到本地
        if (isSave) {
            if (category) {
                Object.keys(data).forEach(key => {
                    this.settings[category] = this.settings[category] || {}
                    this.settings[category][key] = data[key]
                })
            } else {
                this.settings = { ...this.settings, ...data }
            }
            return this.saveSettings()
        }
        return data
    }

    /**
     * 设置当前项目的 boxJS 缓存
     * @param opt key value
     * @returns {Promise<void>}
     */
    setCacheBoxJSData = async (opt = {}) => {
        const options = ['取消', '确定']
        const message = '代理缓存仅支持 BoxJS 相关的代理！'
        const index = await this.generateAlert(message, options)
        if (index === 0) return
        try {
            const boxJSData = await this.getCache()
            Object.keys(opt).forEach(key => {
                this.settings[key] = boxJSData[opt[key]] || ''
            })
            // 保存到本地
            this.saveSettings()
        } catch (e) {
            console.log(e)
            this.notify(this.name, 'BoxJS 缓存读取失败！点击查看相关教程', 'https://chavyleung.gitbook.io/boxjs/awesome/videos')
        }
    }

    /**
     * 设置组件内容
     * @returns {Promise<void>}
     */
    setWidgetConfig = async () => {
        const table = new UITable()
        table.showSeparators = true
        await this.renderBaseSettingsTables(table)
        await table.present()
    }

    async preferences(table, arr, outfit) {
        let header = new UITableRow()
        let heading = header.addText(outfit)
        heading.titleFont = Font.mediumSystemFont(17)
        heading.centerAligned()
        table.addRow(header)
        for (const item of arr) {
            const row = new UITableRow()
            row.dismissOnSelect = !!item.dismissOnSelect
            if (item.url) {
                const rowIcon = row.addImageAtURL(item.url)
                rowIcon.widthWeight = 100
            } else {
                const icon = item.icon || {}
                const image = await this.drawTableIcon(icon.name, icon.color, item.cornerWidth)
                const imageCell = row.addImage(image)
                imageCell.widthWeight = 100
            }
            let rowTitle = row.addText(item['title'])
            rowTitle.widthWeight = 400
            rowTitle.titleFont = Font.systemFont(16)
            if (this.settings[item.val] || item.val) {
                let valText = row.addText(`${this.settings[item.val] || item.val}`.toUpperCase())
                const fontSize = !item.val ? 26 : 16
                valText.widthWeight = 500
                valText.rightAligned()
                valText.titleColor = Color.blue()
                valText.titleFont = Font.mediumSystemFont(fontSize)
            } else {
                const imgCell = UITableCell.imageAtURL(
                    'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/more.png'
                )
                imgCell.rightAligned()
                imgCell.widthWeight = 500
                row.addCell(imgCell)
            }

            row.onSelect = item.onClick
                ? async () => {
                      try {
                          await item.onClick(item, table)
                      } catch (e) {
                          console.log(e)
                      }
                  }
                : async () => {
                      if (item.type == 'input') {
                          await this.setLightAndDark(item['title'], item['desc'], item['val'])
                      } else if (item.type == 'setBackground') {
                          const backImage = await this.getWidgetScreenShot()
                          if (backImage) {
                              await this.setBackgroundImage(backImage, true)
                              await this.setBackgroundNightImage(backImage, true)
                          }
                      } else if (item.type == 'removeBackground') {
                          const options = ['取消', '清空']
                          const message = '该操作不可逆，会清空所有背景图片！'
                          const index = await this.generateAlert(message, options)
                          if (index === 0) return
                          await this.setBackgroundImage(false, true)
                          await this.setBackgroundNightImage(false, true)
                      } else {
                          const backImage = await this.chooseImg()
                          if (!backImage || !(await this.verifyImage(backImage))) return
                          if (item.type == 'setDayBackground') await this.setBackgroundImage(backImage, true)
                          if (item.type == 'setNightBackground') await this.setBackgroundNightImage(backImage, true)
                      }
                      await this.renderBaseSettingsTables(table)
                  }
            table.addRow(row)
        }
        table.reload()
    }

    drawTableIcon = async (icon = 'square.grid.2x2', color = '#e8e8e8', cornerWidth = 42) => {
        const sfi = SFSymbol.named(icon)
        sfi.applyFont(Font.mediumSystemFont(30))
        const imgData = Data.fromPNG(sfi.image).toBase64String()
        const html = `
    <img id="sourceImg" src="data:image/png;base64,${imgData}" />
    <img id="silhouetteImg" src="" />
    <canvas id="mainCanvas" />
    `
        const js = `
    var canvas = document.createElement("canvas");
    var sourceImg = document.getElementById("sourceImg");
    var silhouetteImg = document.getElementById("silhouetteImg");
    var ctx = canvas.getContext('2d');
    var size = sourceImg.width > sourceImg.height ? sourceImg.width : sourceImg.height;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(sourceImg, (canvas.width - sourceImg.width) / 2, (canvas.height - sourceImg.height) / 2);
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pix = imgData.data;
    //convert the image into a silhouette
    for (var i=0, n = pix.length; i < n; i+= 4){
      //set red to 0
      pix[i] = 255;
      //set green to 0
      pix[i+1] = 255;
      //set blue to 0
      pix[i+2] = 255;
      //retain the alpha value
      pix[i+3] = pix[i+3];
    }
    ctx.putImageData(imgData,0,0);
    silhouetteImg.src = canvas.toDataURL();
    output=canvas.toDataURL()
    `

        let wv = new WebView()
        await wv.loadHTML(html)
        const base64Image = await wv.evaluateJavaScript(js)
        const iconImage = await new Request(base64Image).loadImage()
        const size = new Size(160, 160)
        const ctx = new DrawContext()
        ctx.opaque = false
        ctx.respectScreenScale = true
        ctx.size = size
        const path = new Path()
        const rect = new Rect(0, 0, size.width, size.width)

        path.addRoundedRect(rect, cornerWidth, cornerWidth)
        path.closeSubpath()
        ctx.setFillColor(new Color(color))
        ctx.addPath(path)
        ctx.fillPath()
        const rate = 36
        const iw = size.width - rate
        const x = (size.width - iw) / 2
        ctx.drawImageInRect(iconImage, new Rect(x, x, iw, iw))
        return ctx.getImage()
    }

    async renderBaseSettingsTables(table) {
        const basic = [
            {
                icon: { name: 'arrow.clockwise', color: '#1890ff' },
                type: 'input',
                title: '刷新时间',
                desc: '刷新时间仅供参考，具体刷新时间由系统判断，单位：分钟',
                val: 'refreshAfterDate'
            },
            {
                icon: { name: 'photo', color: '#13c2c2' },
                type: 'input',
                title: '白天背景颜色',
                desc: '请自行去网站上搜寻颜色（Hex 颜色）\n支持渐变色，各颜色之间以英文逗号分隔',
                val: 'lightBgColor'
            },
            {
                icon: { name: 'photo.fill', color: '#52c41a' },
                type: 'input',
                title: '晚上背景颜色',
                desc: '请自行去网站上搜寻颜色（Hex 颜色）\n支持渐变色，各颜色之间以英文逗号分隔',
                val: 'darkBgColor'
            },
            {
                icon: { name: 'sun.max.fill', color: '#d48806' },
                type: 'input',
                title: '白天字体颜色',
                desc: '请自行去网站上搜寻颜色（Hex 颜色）',
                val: 'lightColor'
            },
            {
                icon: { name: 'moon.stars.fill', color: '#d4b106' },
                type: 'input',
                title: '晚上字体颜色',
                desc: '请自行去网站上搜寻颜色（Hex 颜色）',
                val: 'darkColor'
            }
        ]
        const background = [
            {
                icon: { name: 'text.below.photo', color: '#faad14' },
                type: 'setBackground',
                title: '透明背景设置'
            },
            {
                icon: { name: 'photo.on.rectangle', color: '#fa8c16' },
                type: 'setDayBackground',
                title: '白天背景图片'
            },
            {
                icon: { name: 'photo.fill.on.rectangle.fill', color: '#fa541c' },
                type: 'setNightBackground',
                title: '晚上背景图片'
            },
            {
                icon: { name: 'record.circle', color: '#722ed1' },
                type: 'input',
                title: '白天蒙层透明',
                desc: '完全透明请设置为0',
                val: 'lightOpacity'
            },
            {
                icon: { name: 'record.circle.fill', color: '#eb2f96' },
                type: 'input',
                title: '晚上蒙层透明',
                desc: '完全透明请设置为0',
                val: 'darkOpacity'
            },
            {
                icon: { name: 'clear', color: '#f5222d' },
                type: 'removeBackground',
                title: '清空背景图片'
            }
        ]
        const boxjs = {
            icon: { name: 'shippingbox', color: '#f7bb10' },
            type: 'input',
            title: 'BoxJS 域名',
            desc: '',
            val: 'boxjsDomain'
        }
        if (this.useBoxJS) basic.push(boxjs)
        table.removeAllRows()
        let topRow = new UITableRow()
        topRow.height = 60
        let leftText = topRow.addButton('Github')
        leftText.widthWeight = 0.3
        leftText.onTap = async () => {
            await Safari.openInApp('https://github.com/zhangyxXyz/ios-scriptable-tsx')
        }
        let centerRow = topRow.addImageAtURL('https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/mainLogo.png')
        centerRow.widthWeight = 0.4
        centerRow.centerAligned()
        centerRow.onTap = async () => {
            // DmYY群
            await Safari.open('https://t.me/Scriptable_JS')
        }
        let rightText = topRow.addButton('重置所有')
        rightText.widthWeight = 0.3
        rightText.rightAligned()
        rightText.onTap = async () => {
            const options = ['取消', '重置']
            const message = '该操作不可逆，会清空所有组件配置！重置后请重新打开设置菜单。'
            const index = await this.generateAlert(message, options)
            if (index === 0) return
            this.settings = {}
            await this.setBackgroundImage(false, false)
            this.saveSettings()
        }
        table.addRow(topRow)
        await this.preferences(table, basic, '基础设置')
        await this.preferences(table, background, '背景图片')
    }

    async renderExtraSettings(table, customHeadRender = null, customFootRender = null, extraSettings = this._extraSettings) {
        table.removeAllRows()
        if (customHeadRender) {
            await customHeadRender.call(this)
        }
        for (const key of Object.keys(extraSettings)) {
            await this.renderExtraSettingsCategory(table, customHeadRender, customFootRender, extraSettings, key)
        }
        if (customFootRender) {
            await customFootRender.call(this)
        }
    }

    async renderExtraSettingsCategory(table, customHeadRender, customFootRender, extraSettings, extraKey) {
        let header = new UITableRow()
        let heading = header.addText(extraSettings[extraKey].title)
        heading.titleFont = Font.mediumSystemFont(17)
        heading.centerAligned()
        table.addRow(header)
        for (const data of extraSettings[extraKey].items) {
            const keys = Object.keys(data.option)
            for (const key of keys) {
                let row = new UITableRow()
                if (typeof data.icon === 'string') {
                    const icon = row.addImageAtURL(data['icon'])
                    icon.widthWeight = 100
                } else {
                    const icon = data.icon || { name: 'gear', color: '#096dd9' }
                    const image = await this.drawTableIcon(icon.name, icon.color, icon.cornerWidth)
                    const imageCell = row.addImage(image)
                    imageCell.widthWeight = 100
                }
                let rowtext = row.addText(data['title'])
                rowtext.widthWeight = 400
                let rowNumber = row.addText(
                    `${
                        this.settings.hasOwnProperty(extraKey) && this.settings[extraKey].hasOwnProperty(key)
                            ? this.settings[extraKey][key]
                            : data.option[key]
                    }  >`
                )
                rowNumber.widthWeight = 500
                rowNumber.rightAligned()
                rowNumber.titleColor = Color.gray()
                rowNumber.titleFont = Font.systemFont(16)
                rowtext.titleFont = Font.systemFont(16)
                row.dismissOnSelect = false
                row.onSelect = async () => {
                    if (data.type == 'text') {
                        await this.setAlertInput(data['title'], data['desc'], data['option'], extraKey)
                    } else if (data.type == 'menu') {
                        await this.setAlertSelect(data['title'], data['desc'], key, data['menu'], extraKey)
                    }
                    await this.renderExtraSettings(table, customHeadRender, customFootRender, extraSettings)
                }
                table.addRow(row)
            }
        }
        table.reload()
    }

    init(widgetFamily = config.widgetFamily) {
        // 组件大小：small,medium,large
        this.widgetFamily = widgetFamily
        this.SETTING_KEY = this.md5(Script.name())
        //用于配置所有的组件相关设置

        // 文件管理器
        // 提示：缓存数据不要用这个操作，这个是操作源码目录的，缓存建议存放在local temp目录中
        this.FILE_MGR = FileManager[module.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local']()
        // 本地，用于存储图片等
        this.FILE_MGR_LOCAL = FileManager.local()
        this.BACKGROUND_KEY = this.FILE_MGR_LOCAL.joinPath(this.FILE_MGR_LOCAL.documentsDirectory(), 'bg_' + this.SETTING_KEY + '.jpg')

        this.BACKGROUND_NIGHT_KEY = this.FILE_MGR_LOCAL.joinPath(
            this.FILE_MGR_LOCAL.documentsDirectory(),
            'bg_' + this.SETTING_KEY + 'night.jpg'
        )

        this.settings = this.getSettings()
        this.settings.lightColor = this.settings.lightColor || '#ffffff'
        this.settings.darkColor = this.settings.darkColor || '#ffffff'
        this.settings.lightBgColor = this.settings.lightBgColor || '#000000'
        this.settings.darkBgColor = this.settings.darkBgColor || '#000000'
        this.settings.boxjsDomain = this.settings.boxjsDomain || 'boxjs.com'
        this.settings.refreshAfterDate = this.settings.refreshAfterDate || '30'
        this.settings.lightOpacity = this.settings.lightOpacity || '0.4'
        this.settings.darkOpacity = this.settings.darkOpacity || '0.7'
        this.prefix = this.settings.boxjsDomain
        const lightBgColor = this.getColors(this.settings.lightBgColor)
        const darkBgColor = this.getColors(this.settings.darkBgColor)
        if (lightBgColor.length > 1 || darkBgColor.length > 1) {
            this.backGroundColor = !Device.isUsingDarkAppearance()
                ? this.getBackgroundColor(lightBgColor)
                : this.getBackgroundColor(darkBgColor)
        } else if (lightBgColor.length > 0 && darkBgColor.length > 0) {
            this.backGroundColor = Color.dynamic(new Color(this.settings.lightBgColor), new Color(this.settings.darkBgColor))
        }
        this.widgetColor = Color.dynamic(new Color(this.settings.lightColor), new Color(this.settings.darkColor))
    }

    getColors = (color = '') => {
        const colors = typeof color === 'string' ? color.split(',') : color
        return colors
    }

    getBackgroundColor = colors => {
        const locations = []
        const linearColor = new LinearGradient()
        const cLen = colors.length
        linearColor.colors = colors.map((item, index) => {
            locations.push(Math.floor(((index + 1) / cLen) * 100) / 100)
            return new Color(item, 1)
        })
        linearColor.locations = locations
        return linearColor
    }

    /**
     * 注册点击操作菜单
     * @param {string} name 操作函数名
     * @param {func} func 点击后执行的函数
     */
    registerAction(name, func, icon = { name: 'gear', color: '#096dd9' }) {
        this._actions[name] = func.bind(this)
        this._actionsIcon[name] = icon
    }

    /**
     * 注册附加设置项菜单分类
     * @param {string} category 分类
     * @param {string} title 分类标题
     */
    registerExtraSettingsCategory(category, title) {
        this._extraSettings[category] = this._extraSettings[category] || {}
        this._extraSettings[category].title = title
    }

    /**
     * 注册附加设置项菜单分类单项
     * @param {string} category 分类
     * @param {string} itemType item分类, 'text', 'menu'
     * @param {string} itemTitle item标题
     * @param {string} itemDesc item描述
     * @param {Array} itemOpt item关联 settings 项 {settingsKey1: defaultVal1, settingsLey2: defaultVal2}
     * @param {object} itemIcon url(string) 或者 SFSymbol(Array) 默认为 SFSymbol
     * @param {Array} itemMenu item菜单选项(仅 itemType 为menu时有效) [menu1, menu2]
     * */
    registerExtraSettingsCategoryItem(
        category,
        itemType,
        itemTitle,
        itemDesc,
        itemOpt = {},
        itemIcon = { name: 'gear', color: '#096dd9' },
        itemMenu = []
    ) {
        if (this._extraSettings.hasOwnProperty(category)) {
            let extraCategory = this._extraSettings[category]
            if (extraCategory) {
                extraCategory.items = this._extraSettings[category].items || []
                extraCategory.items.push({
                    type: itemType,
                    title: itemTitle,
                    desc: itemDesc,
                    option: itemOpt,
                    icon: itemIcon,
                    menu: itemMenu
                })
            }
        }
    }

    /**
     * base64 编码字符串
     * @param {string} str 要编码的字符串
     */
    base64Encode(str) {
        const data = Data.fromString(str)
        return data.toBase64String()
    }

    /**
     * base64解码数据 返回字符串
     * @param {string} b64 base64编码的数据
     */
    base64Decode(b64) {
        const data = Data.fromBase64String(b64)
        return data.toRawString()
    }

    /**
     * md5 加密字符串
     * @param {string} str 要加密成md5的数据
     */
    md5(str) {
        function d(n, t) {
            var r = (65535 & n) + (65535 & t)
            return (((n >> 16) + (t >> 16) + (r >> 16)) << 16) | (65535 & r)
        }

        function f(n, t, r, e, o, u) {
            return d(((c = d(d(t, n), d(e, u))) << (f = o)) | (c >>> (32 - f)), r)
            var c, f
        }

        function l(n, t, r, e, o, u, c) {
            return f((t & r) | (~t & e), n, t, o, u, c)
        }

        function v(n, t, r, e, o, u, c) {
            return f((t & e) | (r & ~e), n, t, o, u, c)
        }

        function g(n, t, r, e, o, u, c) {
            return f(t ^ r ^ e, n, t, o, u, c)
        }

        function m(n, t, r, e, o, u, c) {
            return f(r ^ (t | ~e), n, t, o, u, c)
        }

        function i(n, t) {
            var r, e, o, u
            ;(n[t >> 5] |= 128 << t % 32), (n[14 + (((t + 64) >>> 9) << 4)] = t)
            for (var c = 1732584193, f = -271733879, i = -1732584194, a = 271733878, h = 0; h < n.length; h += 16)
                (c = l((r = c), (e = f), (o = i), (u = a), n[h], 7, -680876936)),
                    (a = l(a, c, f, i, n[h + 1], 12, -389564586)),
                    (i = l(i, a, c, f, n[h + 2], 17, 606105819)),
                    (f = l(f, i, a, c, n[h + 3], 22, -1044525330)),
                    (c = l(c, f, i, a, n[h + 4], 7, -176418897)),
                    (a = l(a, c, f, i, n[h + 5], 12, 1200080426)),
                    (i = l(i, a, c, f, n[h + 6], 17, -1473231341)),
                    (f = l(f, i, a, c, n[h + 7], 22, -45705983)),
                    (c = l(c, f, i, a, n[h + 8], 7, 1770035416)),
                    (a = l(a, c, f, i, n[h + 9], 12, -1958414417)),
                    (i = l(i, a, c, f, n[h + 10], 17, -42063)),
                    (f = l(f, i, a, c, n[h + 11], 22, -1990404162)),
                    (c = l(c, f, i, a, n[h + 12], 7, 1804603682)),
                    (a = l(a, c, f, i, n[h + 13], 12, -40341101)),
                    (i = l(i, a, c, f, n[h + 14], 17, -1502002290)),
                    (c = v(c, (f = l(f, i, a, c, n[h + 15], 22, 1236535329)), i, a, n[h + 1], 5, -165796510)),
                    (a = v(a, c, f, i, n[h + 6], 9, -1069501632)),
                    (i = v(i, a, c, f, n[h + 11], 14, 643717713)),
                    (f = v(f, i, a, c, n[h], 20, -373897302)),
                    (c = v(c, f, i, a, n[h + 5], 5, -701558691)),
                    (a = v(a, c, f, i, n[h + 10], 9, 38016083)),
                    (i = v(i, a, c, f, n[h + 15], 14, -660478335)),
                    (f = v(f, i, a, c, n[h + 4], 20, -405537848)),
                    (c = v(c, f, i, a, n[h + 9], 5, 568446438)),
                    (a = v(a, c, f, i, n[h + 14], 9, -1019803690)),
                    (i = v(i, a, c, f, n[h + 3], 14, -187363961)),
                    (f = v(f, i, a, c, n[h + 8], 20, 1163531501)),
                    (c = v(c, f, i, a, n[h + 13], 5, -1444681467)),
                    (a = v(a, c, f, i, n[h + 2], 9, -51403784)),
                    (i = v(i, a, c, f, n[h + 7], 14, 1735328473)),
                    (c = g(c, (f = v(f, i, a, c, n[h + 12], 20, -1926607734)), i, a, n[h + 5], 4, -378558)),
                    (a = g(a, c, f, i, n[h + 8], 11, -2022574463)),
                    (i = g(i, a, c, f, n[h + 11], 16, 1839030562)),
                    (f = g(f, i, a, c, n[h + 14], 23, -35309556)),
                    (c = g(c, f, i, a, n[h + 1], 4, -1530992060)),
                    (a = g(a, c, f, i, n[h + 4], 11, 1272893353)),
                    (i = g(i, a, c, f, n[h + 7], 16, -155497632)),
                    (f = g(f, i, a, c, n[h + 10], 23, -1094730640)),
                    (c = g(c, f, i, a, n[h + 13], 4, 681279174)),
                    (a = g(a, c, f, i, n[h], 11, -358537222)),
                    (i = g(i, a, c, f, n[h + 3], 16, -722521979)),
                    (f = g(f, i, a, c, n[h + 6], 23, 76029189)),
                    (c = g(c, f, i, a, n[h + 9], 4, -640364487)),
                    (a = g(a, c, f, i, n[h + 12], 11, -421815835)),
                    (i = g(i, a, c, f, n[h + 15], 16, 530742520)),
                    (c = m(c, (f = g(f, i, a, c, n[h + 2], 23, -995338651)), i, a, n[h], 6, -198630844)),
                    (a = m(a, c, f, i, n[h + 7], 10, 1126891415)),
                    (i = m(i, a, c, f, n[h + 14], 15, -1416354905)),
                    (f = m(f, i, a, c, n[h + 5], 21, -57434055)),
                    (c = m(c, f, i, a, n[h + 12], 6, 1700485571)),
                    (a = m(a, c, f, i, n[h + 3], 10, -1894986606)),
                    (i = m(i, a, c, f, n[h + 10], 15, -1051523)),
                    (f = m(f, i, a, c, n[h + 1], 21, -2054922799)),
                    (c = m(c, f, i, a, n[h + 8], 6, 1873313359)),
                    (a = m(a, c, f, i, n[h + 15], 10, -30611744)),
                    (i = m(i, a, c, f, n[h + 6], 15, -1560198380)),
                    (f = m(f, i, a, c, n[h + 13], 21, 1309151649)),
                    (c = m(c, f, i, a, n[h + 4], 6, -145523070)),
                    (a = m(a, c, f, i, n[h + 11], 10, -1120210379)),
                    (i = m(i, a, c, f, n[h + 2], 15, 718787259)),
                    (f = m(f, i, a, c, n[h + 9], 21, -343485551)),
                    (c = d(c, r)),
                    (f = d(f, e)),
                    (i = d(i, o)),
                    (a = d(a, u))
            return [c, f, i, a]
        }

        function a(n) {
            for (var t = '', r = 32 * n.length, e = 0; e < r; e += 8) t += String.fromCharCode((n[e >> 5] >>> e % 32) & 255)
            return t
        }

        function h(n) {
            var t = []
            for (t[(n.length >> 2) - 1] = void 0, e = 0; e < t.length; e += 1) t[e] = 0
            for (var r = 8 * n.length, e = 0; e < r; e += 8) t[e >> 5] |= (255 & n.charCodeAt(e / 8)) << e % 32
            return t
        }

        function e(n) {
            for (var t, r = '0123456789abcdef', e = '', o = 0; o < n.length; o += 1)
                (t = n.charCodeAt(o)), (e += r.charAt((t >>> 4) & 15) + r.charAt(15 & t))
            return e
        }

        function r(n) {
            return unescape(encodeURIComponent(n))
        }

        function o(n) {
            return a(i(h((t = r(n))), 8 * t.length))
            var t
        }

        function u(n, t) {
            return (function (n, t) {
                var r,
                    e,
                    o = h(n),
                    u = [],
                    c = []
                for (u[15] = c[15] = void 0, 16 < o.length && (o = i(o, 8 * n.length)), r = 0; r < 16; r += 1)
                    (u[r] = 909522486 ^ o[r]), (c[r] = 1549556828 ^ o[r])
                return (e = i(u.concat(h(t)), 512 + 8 * t.length)), a(i(c.concat(e), 640))
            })(r(n), r(t))
        }

        function t(n, t, r) {
            return t ? (r ? u(t, n) : e(u(t, n))) : r ? o(n) : e(o(n))
        }

        return t(str)
    }

    /**
     * 渲染标题内容
     * @param {object} widget 组件对象
     * @param {string} icon 图标地址
     * @param {string} title 标题内容
     * @param {bool|color} color 字体的颜色（自定义背景时使用，默认系统）
     */
    async renderHeader(widget, icon, title, color = false) {
        let header = widget.addStack()
        header.centerAlignContent()
        try {
            const image = await this.$request.get(icon, 'IMG')
            let _icon = header.addImage(image)
            _icon.imageSize = new Size(14, 14)
            _icon.cornerRadius = 4
        } catch (e) {
            console.log(e)
        }
        header.addSpacer(10)
        let _title = header.addText(title)
        if (color) _title.textColor = color
        _title.textOpacity = 0.7
        _title.font = Font.boldSystemFont(12)
        _title.lineLimit = 1
        widget.addSpacer(15)
        return widget
    }

    /**
     * @param message 描述内容
     * @param options 按钮
     * @returns {Promise<number>}
     */
    async generateAlert(message, options) {
        let alert = new Alert()
        alert.message = message

        for (const option of options) {
            alert.addAction(option)
        }
        return await alert.presentAlert()
    }

    /**
     * 弹出一个通知
     * @param {string} title 通知标题
     * @param {string} body 通知内容
     * @param {string} url 点击后打开的URL
     */
    async notify(title, body, url, opts = {}) {
        let n = new Notification()
        n = Object.assign(n, opts)
        n.title = title
        n.body = body
        if (url) n.openURL = url
        return await n.schedule()
    }

    /**
     * 给图片加一层半透明遮罩
     * @param {Image} img 要处理的图片
     * @param {string} color 遮罩背景颜色
     * @param {float} opacity 透明度
     */
    async shadowImage(img, color = '#000000', opacity = 0.7) {
        if (!img) return
        if (opacity === 0) return img
        let ctx = new DrawContext()
        // 获取图片的尺寸
        ctx.size = img.size

        ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
        ctx.setFillColor(new Color(color, opacity))
        ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
        return await ctx.getImage()
    }

    /**
     * 使用插件设置反序列化当前设置
     */
    deserializationCurrentSettings() {
        Object.keys(this.currentSettings).forEach(category => {
            Object.keys(this.currentSettings[category]).forEach(key => {
                if (category === this.noneCategoryName) {
                    if (this.settings.hasOwnProperty(key)) {
                        this.updateCurrentSettings(this.currentSettings[category][key], this.settings[key])
                    }
                } else {
                    if (this.settings.hasOwnProperty(category) && this.settings[category].hasOwnProperty(key)) {
                        this.updateCurrentSettings(this.currentSettings[category][key], this.settings[category][key])
                    }
                }
            })
        })
    }

    /**
     * 获取当前插件的设置
     * @param {boolean} json 是否为json格式
     */
    getSettings(json = true) {
        let res = json ? {} : ''
        let cache = ''
        if (Keychain.contains(this.SETTING_KEY)) {
            cache = Keychain.get(this.SETTING_KEY)
        }
        if (json) {
            try {
                res = JSON.parse(cache)
            } catch (e) {}
        } else {
            res = cache
        }

        return res
    }

    /**
     * 存储当前设置
     * @param {bool} notify 是否通知提示
     */
    saveSettings(notify = true) {
        let res = typeof this.settings === 'object' ? JSON.stringify(this.settings) : String(this.settings)
        Keychain.set(this.SETTING_KEY, res)
        if (notify) this.notify('设置成功', '桌面组件稍后将自动刷新')
    }

    /**
     * 获取当前插件是否有自定义背景图片
     * @reutrn img | false
     */
    getBackgroundImage() {
        let result = null
        if (this.FILE_MGR_LOCAL.fileExists(this.BACKGROUND_KEY)) {
            result = Image.fromFile(this.BACKGROUND_KEY)
        }
        if (Device.isUsingDarkAppearance() && this.FILE_MGR_LOCAL.fileExists(this.BACKGROUND_NIGHT_KEY)) {
            result = Image.fromFile(this.BACKGROUND_NIGHT_KEY)
        }
        return result
    }

    /**
     * 设置当前组件的背景图片
     * @param {Image} img
     */
    setBackgroundImage(img, notify = true) {
        if (!img) {
            // 移除背景
            if (this.FILE_MGR_LOCAL.fileExists(this.BACKGROUND_KEY)) {
                this.FILE_MGR_LOCAL.remove(this.BACKGROUND_KEY)
            }
            if (notify) this.notify('移除成功', '小组件白天背景图片已移除，稍后刷新生效')
        } else {
            // 设置背景
            // 全部设置一遍，
            this.FILE_MGR_LOCAL.writeImage(this.BACKGROUND_KEY, img)
            if (notify) this.notify('设置成功', '小组件白天背景图片已设置！稍后刷新生效')
        }
    }

    setBackgroundNightImage(img, notify = true) {
        if (!img) {
            // 移除背景
            if (this.FILE_MGR_LOCAL.fileExists(this.BACKGROUND_NIGHT_KEY)) {
                this.FILE_MGR_LOCAL.remove(this.BACKGROUND_NIGHT_KEY)
            }
            if (notify) this.notify('移除成功', '小组件夜间背景图片已移除，稍后刷新生效')
        } else {
            // 设置背景
            // 全部设置一遍，
            this.FILE_MGR_LOCAL.writeImage(this.BACKGROUND_NIGHT_KEY, img)
            if (notify) this.notify('设置成功', '小组件夜间背景图片已设置！稍后刷新生效')
        }
    }

    updateCurrentSettings(curSettingItem, stringVal) {
        const varType = curSettingItem.type || this.settingValTypeString
        if (varType === this.settingValTypeString) {
            curSettingItem.val = String(stringVal)
        } else if (varType === this.stttingValTypeStringEmptyCheck) {
            curSettingItem.val = isEmpty(stringVal) ? null : String(stringVal)
        } else if (varType === this.settingValTypeInt) {
            curSettingItem.val = parseInt(stringVal)
        } else if (varType === this.settingValTypeFloat) {
            curSettingItem.val = parseFloat(stringVal)
        } else if (varType === this.settingValTypeBool) {
            curSettingItem.val = Boolean(stringVal)
        }
        return curSettingItem.val
    }

    getRandomArrayElements(arr, count) {
        let shuffled = arr.slice(0),
            i = arr.length,
            min = i - count,
            temp,
            index
        min = min > 0 ? min : 0
        while (i-- > min) {
            index = Math.floor((i + 1) * Math.random())
            temp = shuffled[index]
            shuffled[index] = shuffled[i]
            shuffled[i] = temp
        }
        return shuffled.slice(min)
    }

    textFormat = {
        defaultText: { size: 14, font: 'regular', color: this.widgetColor },
        battery: { size: 10, font: 'bold', color: this.widgetColor },
        title: { size: 16, font: 'semibold', color: this.widgetColor },
        SFMono: { size: 12, font: 'SF Mono', color: this.widgetColor }
    }

    provideFont = (fontName, fontSize) => {
        const fontGenerator = {
            ultralight: function () {
                return Font.ultraLightSystemFont(fontSize)
            },
            light: function () {
                return Font.lightSystemFont(fontSize)
            },
            regular: function () {
                return Font.regularSystemFont(fontSize)
            },
            medium: function () {
                return Font.mediumSystemFont(fontSize)
            },
            semibold: function () {
                return Font.semiboldSystemFont(fontSize)
            },
            bold: function () {
                return Font.boldSystemFont(fontSize)
            },
            heavy: function () {
                return Font.heavySystemFont(fontSize)
            },
            black: function () {
                return Font.blackSystemFont(fontSize)
            },
            italic: function () {
                return Font.italicSystemFont(fontSize)
            }
        }

        const systemFont = fontGenerator[fontName]
        if (systemFont) {
            return systemFont()
        }
        return new Font(fontName, fontSize)
    }

    provideText = (string, container, format) => {
        const textItem = container.addText(string)
        const textFont = format.font
        const textSize = format.size
        const textColor = format.color

        textItem.font = this.provideFont(textFont, textSize)
        textItem.textColor = textColor
        return textItem
    }
}

// @base.end
const Runing = async (Widget, default_args = '', isDebug = true, extra) => {
    let M = null
    // 判断hash是否和当前设备匹配
    if (config.runsInWidget) {
        M = new Widget(args.widgetParameter || '')
        M.deserializationCurrentSettings()
        if (extra) {
            Object.keys(extra).forEach(key => {
                M[key] = extra[key]
            })
        }
        const W = await M.render()
        try {
            if (M.settings.refreshAfterDate) {
                W.refreshAfterDate = new Date(new Date() + 1000 * 60 * parseInt(M.settings.refreshAfterDate))
            }
        } catch (e) {
            console.log(e)
        }
        if (W) {
            Script.setWidget(W)
            Script.complete()
        }
    } else {
        let { act, __arg, __size } = args.queryParameters
        M = new Widget(__arg || default_args || '')
        M.deserializationCurrentSettings()
        if (extra) {
            Object.keys(extra).forEach(key => {
                M[key] = extra[key]
            })
        }
        if (__size) M.init(__size)
        if (!act || !M['_actions']) {
            // 弹出选择菜单
            const actions = M['_actions']
            const table = new UITable()
            const onClick = async item => {
                M.widgetFamily = item.val
                w = await M.render()
                const fnc = item.val.toLowerCase().replace(/( |^)[a-z]/g, L => L.toUpperCase())
                if (w) {
                    return w[`present${fnc}`]()
                }
            }
            const preview = [
                {
                    url: 'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/smallSize.png',
                    title: '小尺寸',
                    val: 'small',
                    dismissOnSelect: true,
                    onClick
                },
                {
                    url: 'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/mediumSize.png',
                    title: '中尺寸',
                    val: 'medium',
                    dismissOnSelect: true,
                    onClick
                },
                {
                    url: 'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/largeSize.png',
                    title: '大尺寸',
                    val: 'large',
                    dismissOnSelect: true,
                    onClick
                }
            ]
            await M.preferences(table, preview, '预览组件')
            const extra = []
            for (let _ in actions) {
                const iconItem = M._actionsIcon[_]
                const isUrl = typeof iconItem === 'string'
                const actionItem = {
                    title: _,
                    onClick: actions[_]
                }
                if (isUrl) {
                    actionItem.url = iconItem
                } else {
                    actionItem.icon = iconItem
                }
                extra.push(actionItem)
            }
            await M.preferences(table, extra, '配置组件')
            return table.present()
        }
    }
}

// DataStorage
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

// GenrateView
class GenrateView {
    static setListWidget(listWidget2) {
        this.listWidget = listWidget2
    }

    static async wbox(props, ...children) {
        const { background, spacing, href, updateDate, padding, onClick } = props
        try {
            isDefined(background) && (await setBackground(this.listWidget, background))
            isDefined(spacing) && (this.listWidget.spacing = spacing)
            isDefined(href) && (this.listWidget.url = href)
            isDefined(updateDate) && (this.listWidget.refreshAfterDate = updateDate)
            isDefined(padding) && this.listWidget.setPadding(...padding)
            isDefined(onClick) && runOnClick(this.listWidget, onClick)
            await addChildren(this.listWidget, children)
        } catch (err) {
            console.error(err)
        }
        return this.listWidget
    }

    static wstack(props, ...children) {
        return async parentInstance => {
            const widgetStack = parentInstance.addStack()
            const {
                background,
                spacing,
                padding,
                width = 0,
                height = 0,
                borderRadius,
                borderWidth,
                borderColor,
                href,
                verticalAlign,
                flexDirection,
                onClick
            } = props
            try {
                isDefined(background) && (await setBackground(widgetStack, background))
                isDefined(spacing) && (widgetStack.spacing = spacing)
                isDefined(padding) && widgetStack.setPadding(...padding)
                isDefined(borderRadius) && (widgetStack.cornerRadius = borderRadius)
                isDefined(borderWidth) && (widgetStack.borderWidth = borderWidth)
                isDefined(borderColor) && (widgetStack.borderColor = getColor(borderColor))
                isDefined(href) && (widgetStack.url = href)
                widgetStack.size = new Size(width, height)
                const verticalAlignMap = {
                    bottom: () => widgetStack.bottomAlignContent(),
                    center: () => widgetStack.centerAlignContent(),
                    top: () => widgetStack.topAlignContent()
                }
                isDefined(verticalAlign) && verticalAlignMap[verticalAlign]()
                const flexDirectionMap = {
                    row: () => widgetStack.layoutHorizontally(),
                    column: () => widgetStack.layoutVertically()
                }
                isDefined(flexDirection) && flexDirectionMap[flexDirection]()
                isDefined(onClick) && runOnClick(widgetStack, onClick)
            } catch (err) {
                console.error(err)
            }
            await addChildren(widgetStack, children)
        }
    }

    static wimage(props) {
        return async parentInstance => {
            const {
                src,
                href,
                resizable,
                width = 0,
                height = 0,
                opacity,
                borderRadius,
                borderWidth,
                borderColor,
                containerRelativeShape,
                filter,
                imageAlign,
                mode,
                onClick
            } = props
            let _image = src

            if (typeof src === 'string') {
                if (isUrlImgBase64(src)) {
                    _image = await new Request(src).loadImage()
                } else if (isUrl(src)) {
                    _image = await getImage({ url: src })
                } else if (!isUrl(src)) {
                    _image = SFSymbol.named(src).image
                }
            } else if (!(src instanceof Image)) {
                _image = await drawTextWithCustomFont(src.url, src.text, src.size, src.textColor)
            }
            const widgetImage = parentInstance.addImage(_image)
            widgetImage.image = _image
            try {
                isDefined(href) && (widgetImage.url = href)
                isDefined(resizable) && (widgetImage.resizable = resizable)
                widgetImage.imageSize = new Size(width, height)
                isDefined(opacity) && (widgetImage.imageOpacity = opacity)
                isDefined(borderRadius) && (widgetImage.cornerRadius = borderRadius)
                isDefined(borderWidth) && (widgetImage.borderWidth = borderWidth)
                isDefined(borderColor) && (widgetImage.borderColor = getColor(borderColor))
                isDefined(containerRelativeShape) && (widgetImage.containerRelativeShape = containerRelativeShape)
                isDefined(filter) && (widgetImage.tintColor = getColor(filter))
                const imageAlignMap = {
                    left: () => widgetImage.leftAlignImage(),
                    center: () => widgetImage.centerAlignImage(),
                    right: () => widgetImage.rightAlignImage()
                }
                isDefined(imageAlign) && imageAlignMap[imageAlign]()
                const modeMap = {
                    fit: () => widgetImage.applyFittingContentMode(),
                    fill: () => widgetImage.applyFillingContentMode()
                }
                isDefined(mode) && modeMap[mode]()
                isDefined(onClick) && runOnClick(widgetImage, onClick)
            } catch (err) {
                console.error(err)
            }
        }
    }

    static wspacer(props) {
        return async parentInstance => {
            const widgetSpacer = parentInstance.addSpacer()
            const { length } = props
            try {
                isDefined(length) && (widgetSpacer.length = length)
            } catch (err) {
                console.error(err)
            }
        }
    }

    static wtext(props, ...children) {
        return async parentInstance => {
            const widgetText = parentInstance.addText('')
            const { textColor, font, opacity, maxLine, scale, shadowColor, shadowRadius, shadowOffset, href, textAlign, onClick } = props
            if (children && Array.isArray(children)) {
                widgetText.text = children.join('')
            }
            try {
                isDefined(textColor) && (widgetText.textColor = getColor(textColor))
                isDefined(font) && (widgetText.font = typeof font === 'number' ? Font.systemFont(font) : font)
                isDefined(opacity) && (widgetText.textOpacity = opacity)
                isDefined(maxLine) && (widgetText.lineLimit = maxLine)
                isDefined(scale) && (widgetText.minimumScaleFactor = scale)
                isDefined(shadowColor) && (widgetText.shadowColor = getColor(shadowColor))
                isDefined(shadowRadius) && (widgetText.shadowRadius = shadowRadius)
                isDefined(shadowOffset) && (widgetText.shadowOffset = shadowOffset)
                isDefined(href) && (widgetText.url = href)
                const textAlignMap = {
                    left: () => widgetText.leftAlignText(),
                    center: () => widgetText.centerAlignText(),
                    right: () => widgetText.rightAlignText()
                }
                isDefined(textAlign) && textAlignMap[textAlign]()
                isDefined(onClick) && runOnClick(widgetText, onClick)
            } catch (err) {
                console.error(err)
            }
        }
    }

    static wdate(props) {
        return async parentInstance => {
            const widgetDate = parentInstance.addDate(new Date())
            const {
                date,
                mode,
                textColor,
                font,
                opacity,
                maxLine,
                scale,
                shadowColor,
                shadowRadius,
                shadowOffset,
                href,
                textAlign,
                onClick
            } = props
            try {
                isDefined(date) && (widgetDate.date = date)
                isDefined(textColor) && (widgetDate.textColor = getColor(textColor))
                isDefined(font) && (widgetDate.font = typeof font === 'number' ? Font.systemFont(font) : font)
                isDefined(opacity) && (widgetDate.textOpacity = opacity)
                isDefined(maxLine) && (widgetDate.lineLimit = maxLine)
                isDefined(scale) && (widgetDate.minimumScaleFactor = scale)
                isDefined(shadowColor) && (widgetDate.shadowColor = getColor(shadowColor))
                isDefined(shadowRadius) && (widgetDate.shadowRadius = shadowRadius)
                isDefined(shadowOffset) && (widgetDate.shadowOffset = shadowOffset)
                isDefined(href) && (widgetDate.url = href)
                const modeMap = {
                    time: () => widgetDate.applyTimeStyle(),
                    date: () => widgetDate.applyDateStyle(),
                    relative: () => widgetDate.applyRelativeStyle(),
                    offset: () => widgetDate.applyOffsetStyle(),
                    timer: () => widgetDate.applyTimerStyle()
                }
                isDefined(mode) && modeMap[mode]()
                const textAlignMap = {
                    left: () => widgetDate.leftAlignText(),
                    center: () => widgetDate.centerAlignText(),
                    right: () => widgetDate.rightAlignText()
                }
                isDefined(textAlign) && textAlignMap[textAlign]()
                isDefined(onClick) && runOnClick(widgetDate, onClick)
            } catch (err) {
                console.error(err)
            }
        }
    }
}

function h(type, props, ...children) {
    props = props || {}
    const _children = flatteningArr(children)
    switch (type) {
        case 'wbox':
            return GenrateView.wbox(props, ..._children)
        case 'wdate':
            return GenrateView.wdate(props)
        case 'wimage':
            return GenrateView.wimage(props)
        case 'wspacer':
            return GenrateView.wspacer(props)
        case 'wstack':
            return GenrateView.wstack(props, ..._children)
        case 'wtext':
            return GenrateView.wtext(props, ..._children)
        default:
            return type instanceof Function ? type({ children: _children, ...props }) : null
    }
}

function flatteningArr(arr) {
    return [].concat(
        ...arr.map(item => {
            return Array.isArray(item) ? flatteningArr(item) : item
        })
    )
}

function getColor(color) {
    return typeof color === 'string' ? new Color(color, 1) : color
}

async function getBackground(bg) {
    bg = (typeof bg === 'string' && !isUrl(bg)) || bg instanceof Color ? getColor(bg) : bg
    if (typeof bg === 'string') {
        bg = await getImage({ url: bg })
    }
    return bg
}

async function setBackground(widget, bg) {
    const _bg = await getBackground(bg)
    if (_bg instanceof Color) {
        widget.backgroundColor = _bg
    }
    if (_bg instanceof Image) {
        widget.backgroundImage = _bg
    }
    if (_bg instanceof LinearGradient) {
        widget.backgroundGradient = _bg
    }
}

async function addChildren(instance, children) {
    if (children && Array.isArray(children)) {
        for (const child of children) {
            child instanceof Function ? await child(instance) : ''
        }
    }
}

function isDefined(value) {
    if (typeof value === 'number' && !isNaN(value)) {
        return true
    }
    return value !== void 0 && value !== null
}

function isUrl(value) {
    const reg = /^(http|https)\:\/\/[\w\W]+/
    return reg.test(value)
}

function isUrlImgBase64(value) {
    const reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i
    return reg.test(value)
}

function isEmpty(obj) {
    if (typeof obj == 'undefined' || obj == null || obj == '') {
        return true
    } else {
        return false
    }
}

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

function runOnClick(instance, onClick) {
    const _eventId = hash(onClick.toString())
    instance.url = `${URLScheme.forRunningScript()}?eventId=${encodeURIComponent(_eventId)}&from=${URLSchemeFrom.WIDGET}`
    const { eventId, from } = args.queryParameters
    if (eventId && eventId === _eventId && from === URLSchemeFrom.WIDGET) {
        onClick()
    }
}

async function request(args2) {
    const { url, data, header, dataType = 'json', method = 'GET', timeout = 60 * 1e3, useCache = false, failReturnCache = true } = args2
    const cacheKey = `url:${url}`
    const cache = getStorage(cacheKey)
    if (useCache && cache !== null) return cache
    const req = new Request(url)
    req.method = method
    header && (req.headers = header)
    data && (req.body = data)
    req.timeoutInterval = timeout / 1e3
    req.allowInsecureRequest = true
    let res
    try {
        switch (dataType) {
            case 'json':
                res = await req.loadJSON()
                break
            case 'text':
                res = await req.loadString()
                break
            case 'image':
                res = await req.loadImage()
                break
            case 'data':
                res = await req.load()
                break
            default:
                res = await req.loadJSON()
        }
        const result = { ...req.response, data: res }
        setStorage(cacheKey, result)
        return result
    } catch (err) {
        if (cache !== null && failReturnCache) return cache
        return err
    }
}

async function getImage(args2) {
    const { filepath, url, useCache = true } = args2
    const generateDefaultImage = async () => {
        const ctx = new DrawContext()
        ctx.size = new Size(100, 100)
        ctx.setFillColor(Color.red())
        ctx.fillRect(new Rect(0, 0, 100, 100))
        return await ctx.getImage()
    }
    try {
        if (filepath) {
            return Image.fromFile(filepath) || (await generateDefaultImage())
        }
        if (!url) return await generateDefaultImage()
        const cacheKey = `image:${url}`
        if (useCache) {
            const cache = getCache(url)
            if (cache instanceof Image) {
                return cache
            } else {
                removeCache(cacheKey)
            }
        }
        const res = await request({ url, dataType: 'image' })
        const image = res && res.data
        image && setCache(cacheKey, image)
        return image || (await generateDefaultImage())
    } catch (err) {
        return await generateDefaultImage()
    }
}

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
async function drawTextWithCustomFont(fontUrl, text, fontSize, textColor, align = 'center', lineLimit = 1, rowSpacing = 5) {
    const font = new CustomFont(new WebView(), {
        fontFamily: 'customFont', // 字体名称
        fontUrl: fontUrl, // 字体地址
        timeout: 60000 // 加载字体的超时时间
    }) // 创建字体
    await font.load() // 加载字体
    const image = await font.drawText(text, {
        fontSize: fontSize, // 字体大小
        textWidth: 0, // 文本宽度
        align: align, // left、right、center
        lineLimit: lineLimit, // 文本行数限制
        rowSpacing: rowSpacing, // 文本行间距
        textColor: textColor, // 文本颜色
        scale: 2 // 缩放因子
    })
    return image
}

/**
 * 自定义字体渲染 'https://mashangkaifa.coding.net/p/coding-code-guide/d/coding-code-guide/git/raw/master/jf-openhuninn-1.0.ttf'
 */
class CustomFont {
    constructor(webview, config) {
        this.webview = webview || new WebView()
        this.fontFamily = config.fontFamily || 'customFont'
        this.fontUrl = 'url(' + config.fontUrl + ')'
        this.timeout = config.timeout || 60000
    }

    async load() {
        // 加载字体
        return await this.webview.evaluateJavaScript(`
            const customFont = new FontFace("${this.fontFamily}", "${this.fontUrl}");
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            let baseHeight,extendHeight;
            console.log('loading font.');
            customFont.load().then((font) => {
            document.fonts.add(font);
            console.log('load font successfully.');
            completion(true);
            });
            setTimeout(()=>{
            console.log('load font failed：timeout.');
            completion(false);
            },${this.timeout});
            null`)
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
        for (let i in textArray) {
            let content = textArray[i].str
            let length = textArray[i].len

            if (i >= lineLimit) break
            if (i == lineLimit - 1 && i < textArray.length - 1) content = content.replace(/(.{1})$/, '…')

            let x = 0,
                y = Number(i) * fontSize
            if (rowSpacing > 0 && i > 0) y = y + rowSpacing
            if (i > 0) {
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
            canvas.width=${realWidth}*${scale};
            ctx.font = "${fontSize}px ${this.fontFamily}";
            ctx.textBaseline= "hanging";
            baseHeight= ${(fontSize + rowSpacing) * (lineCount - 1)};
            extendHeight= ctx.measureText('qypgj').actualBoundingBoxDescent;
            canvas.height= (baseHeight + extendHeight)*${scale};
            ctx.scale(${scale}, ${scale});
            ctx.font = "${fontSize}px ${this.fontFamily}";
            ctx.fillStyle = "${textColor}";
            ctx.textBaseline= "hanging";
            ${script}
            canvas.toDataURL()`)

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
                    const char = text[i]
                    const width = ctx.measureText(char).width;
                    if (len < textWidth) {
                        str = str + char;
                        len = len + width;
                    }
                    if (len == textWidth) {
                        textArray.push({ str: str, len: len, });
                        str = ''; len = 0;
                    }
                    if (len > textWidth) {
                        textArray.push({
                            str: str.substring(0, str.length - 1),
                            len: len - width,
                        });
                        str = char; len = width;
                    }
                    if (i == text.length - 1 && str) {
                        textArray.push({ str: str, len: len, });
                    }
                }
                return textArray
            }
            cutText(${textWidth}, "${text}")
        `)
    }
}

// await new WidgetBase().setWidgetConfig();
module.exports = {
    WidgetBase,
    Runing,
    Cache,
    Storage,
    GenrateView,
    h,
    drawTextWithCustomFont
}
