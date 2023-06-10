// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: cogs;

/*
 * author   :  seiun
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
    _actionsVal = {}
    _actionsIcon = {}

    // 组件附加设置
    _extraSettings = {}
    // 组件当前设置
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
                String(opt[key]),
                String(
                    curCategory !== this.noneCategoryName
                        ? this.settings.hasOwnProperty(curCategory) && this.settings[curCategory].hasOwnProperty(key)
                            ? this.settings[curCategory][key] || ''
                            : ''
                        : this.settings[key] || ''
                )
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
                    'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/more.png'
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
        let centerRow = topRow.addImageAtURL('https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/mainLogo.png')
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

    async renderExtraSettings(
        table,
        extraSettings = this._extraSettings,
        isRenderResetHeader = true,
        customHeadRender = null,
        customFootRender = null
    ) {
        table.removeAllRows()
        if (customHeadRender) {
            await customHeadRender.call(this)
        }
        if (isRenderResetHeader) {
            let resetHeader = new UITableRow()
            let resetHeading = resetHeader.addText('重置设置')
            resetHeading.titleFont = Font.mediumSystemFont(17)
            resetHeading.centerAligned()
            table.addRow(resetHeader)
            let resetRow = new UITableRow()
            let resetRowText = resetRow.addText('重置设置参数', '设置参数绑定脚本文件名，请勿随意更改脚本文件名')
            resetRowText.titleFont = Font.systemFont(16)
            resetRowText.subtitleFont = Font.systemFont(12)
            resetRowText.subtitleColor = new Color('999999')
            resetRow.dismissOnSelect = false
            resetRow.onSelect = async () => {
                const options = ['取消', '重置']
                const message = '本菜单里的所有设置参数将会重置为默认值，重置后请重新打开设置菜单'
                const index = await this.generateAlert(message, options)
                if (index === 0) return
                for (const category of Object.keys(extraSettings || {})) {
                    if (category === this.noneCategoryName) {
                        continue
                    }
                    delete this.settings[category]
                }
                this.saveSettings()
                await this.renderExtraSettings(table, extraSettings, isRenderResetHeader, customHeadRender, customFootRender)
            }
            table.addRow(resetRow)
        }
        for (const key of Object.keys(extraSettings)) {
            await this.renderExtraSettingsCategory(table, extraSettings, key, isRenderResetHeader, customHeadRender, customFootRender)
        }
        if (customFootRender) {
            await customFootRender.call(this)
        }
    }

    async renderExtraSettingsCategory(table, extraSettings, extraKey, isRenderResetHeader, customHeadRender, customFootRender) {
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
                let configval =
                    this.settings.hasOwnProperty(extraKey) && this.settings[extraKey].hasOwnProperty(key)
                        ? this.settings[extraKey][key]
                        : data.option[key]
                let rowNumber = row.addText(`${isEmpty(configval) ? data.defaultShowContent || '' : configval}  >`.toLowerCase())
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
                    await this.renderExtraSettings(table, extraSettings, isRenderResetHeader, customHeadRender, customFootRender)
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
    registerAction(name, func, icon = { name: 'gear', color: '#096dd9' }, val = null) {
        this._actions[name] = func.bind(this)
        this._actionsVal[name] = val
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
     * @param {string} itemDefaultShowContent item默认显示文本当默认值以及输入值为空时
     * */
    registerExtraSettingsCategoryItem(
        category,
        itemType,
        itemTitle,
        itemDesc,
        itemOpt = {},
        itemIcon = { name: 'gear', color: '#096dd9' },
        itemMenu = [],
        itemDefaultShowContent
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
                    menu: itemMenu,
                    defaultShowContent: itemDefaultShowContent
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
                    url: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/smallSize.png',
                    title: '小尺寸',
                    val: 'small',
                    dismissOnSelect: true,
                    onClick
                },
                {
                    url: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/mediumSize.png',
                    title: '中尺寸',
                    val: 'medium',
                    dismissOnSelect: true,
                    onClick
                },
                {
                    url: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/largeSize.png',
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
                    onClick: actions[_],
                    val: M._actionsVal[_]
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

var pinYin = {
    a: '啊阿锕',
    ai: '埃挨哎唉哀皑癌蔼矮艾碍爱隘诶捱嗳嗌嫒瑷暧砹锿霭',
    an: '鞍氨安俺按暗岸胺案谙埯揞犴庵桉铵鹌顸黯',
    ang: '肮昂盎',
    ao: '凹敖熬翱袄傲奥懊澳坳拗嗷噢岙廒遨媪骜聱螯鏊鳌鏖',
    ba: '芭捌扒叭吧笆八疤巴拔跋靶把耙坝霸罢爸茇菝萆捭岜灞杷钯粑鲅魃',
    bai: '白柏百摆佰败拜稗薜掰鞴',
    ban: '斑班搬扳般颁板版扮拌伴瓣半办绊阪坂豳钣瘢癍舨',
    bang: '邦帮梆榜膀绑棒磅蚌镑傍谤蒡螃',
    bao: '苞胞包褒雹保堡饱宝抱报暴豹鲍爆勹葆宀孢煲鸨褓趵龅',
    bo: '剥薄玻菠播拨钵波博勃搏铂箔伯帛舶脖膊渤泊驳亳蕃啵饽檗擘礴钹鹁簸跛',
    bei: '杯碑悲卑北辈背贝钡倍狈备惫焙被孛陂邶埤蓓呗怫悖碚鹎褙鐾',
    ben: '奔苯本笨畚坌锛',
    beng: '崩绷甭泵蹦迸唪嘣甏',
    bi: '逼鼻比鄙笔彼碧蓖蔽毕毙毖币庇痹闭敝弊必辟壁臂避陛匕仳俾芘荜荸吡哔狴庳愎滗濞弼妣婢嬖璧贲畀铋秕裨筚箅篦舭襞跸髀',
    bian: '鞭边编贬扁便变卞辨辩辫遍匾弁苄忭汴缏煸砭碥稹窆蝙笾鳊',
    biao: '标彪膘表婊骠飑飙飚灬镖镳瘭裱鳔',
    bie: '鳖憋别瘪蹩鳘',
    bin: '彬斌濒滨宾摈傧浜缤玢殡膑镔髌鬓',
    bing: '兵冰柄丙秉饼炳病并禀邴摒绠枋槟燹',
    bu: '捕卜哺补埠不布步簿部怖拊卟逋瓿晡钚醭',
    ca: '擦嚓礤',
    cai: '猜裁材才财睬踩采彩菜蔡',
    can: '餐参蚕残惭惨灿骖璨粲黪',
    cang: '苍舱仓沧藏伧',
    cao: '操糙槽曹草艹嘈漕螬艚',
    ce: '厕策侧册测刂帻恻',
    ceng: '层蹭噌',
    cha: '插叉茬茶查碴搽察岔差诧猹馇汊姹杈楂槎檫钗锸镲衩',
    chai: '拆柴豺侪茈瘥虿龇',
    chan: '搀掺蝉馋谗缠铲产阐颤冁谄谶蒇廛忏潺澶孱羼婵嬗骣觇禅镡裣蟾躔',
    chang: '昌猖场尝常长偿肠厂敞畅唱倡伥鬯苌菖徜怅惝阊娼嫦昶氅鲳',
    chao: '超抄钞朝嘲潮巢吵炒怊绉晁耖',
    che: '车扯撤掣彻澈坼屮砗',
    chen: '郴臣辰尘晨忱沉陈趁衬称谌抻嗔宸琛榇肜胂碜龀',
    cheng: '撑城橙成呈乘程惩澄诚承逞骋秤埕嵊徵浈枨柽樘晟塍瞠铖裎蛏酲',
    chi: '吃痴持匙池迟弛驰耻齿侈尺赤翅斥炽傺墀芪茌搋叱哧啻嗤彳饬沲媸敕胝眙眵鸱瘛褫蚩螭笞篪豉踅踟魑',
    chong: '充冲虫崇宠茺忡憧铳艟',
    chou: '抽酬畴踌稠愁筹仇绸瞅丑俦圳帱惆溴妯瘳雠鲋',
    chu: '臭初出橱厨躇锄雏滁除楚础储矗搐触处亍刍憷绌杵楮樗蜍蹰黜',
    chuan: '揣川穿椽传船喘串掾舛惴遄巛氚钏镩舡',
    chuang: '疮窗幢床闯创怆',
    chui: '吹炊捶锤垂陲棰槌',
    chun: '春椿醇唇淳纯蠢促莼沌肫朐鹑蝽',
    chuo: '戳绰蔟辶辍镞踔龊',
    ci: '疵茨磁雌辞慈瓷词此刺赐次荠呲嵯鹚螅糍趑',
    cong: '聪葱囱匆从丛偬苁淙骢琮璁枞',
    cu: '凑粗醋簇猝殂蹙',
    cuan: '蹿篡窜汆撺昕爨',
    cui: '摧崔催脆瘁粹淬翠萃悴璀榱隹',
    cun: '村存寸磋忖皴',
    cuo: '撮搓措挫错厝脞锉矬痤鹾蹉躜',
    da: '搭达答瘩打大耷哒嗒怛妲疸褡笪靼鞑',
    dai: '呆歹傣戴带殆代贷袋待逮怠埭甙呔岱迨逯骀绐玳黛',
    dan: '耽担丹单郸掸胆旦氮但惮淡诞弹蛋亻儋卩萏啖澹檐殚赕眈瘅聃箪',
    dang: '当挡党荡档谠凼菪宕砀铛裆',
    dao: '刀捣蹈倒岛祷导到稻悼道盗叨啁忉洮氘焘忑纛',
    de: '德得的锝',
    deng: '蹬灯登等瞪凳邓噔嶝戥磴镫簦',
    di: '堤低滴迪敌笛狄涤翟嫡抵底地蒂第帝弟递缔氐籴诋谛邸坻莜荻嘀娣柢棣觌砥碲睇镝羝骶',
    dian: '颠掂滇碘点典靛垫电佃甸店惦奠淀殿丶阽坫埝巅玷癜癫簟踮',
    diao: '碉叼雕凋刁掉吊钓调轺铞蜩粜貂',
    die: '跌爹碟蝶迭谍叠佚垤堞揲喋渫轶牒瓞褶耋蹀鲽鳎',
    ding: '丁盯叮钉顶鼎锭定订丢仃啶玎腚碇町铤疔耵酊',
    dong: '东冬董懂动栋侗恫冻洞垌咚岽峒夂氡胨胴硐鸫',
    dou: '兜抖斗陡豆逗痘蔸钭窦窬蚪篼酡',
    du: '都督毒犊独读堵睹赌杜镀肚度渡妒芏嘟渎椟橐牍蠹笃髑黩',
    duan: '端短锻段断缎彖椴煅簖',
    dui: '堆兑队对怼憝碓',
    dun: '墩吨蹲敦顿囤钝盾遁炖砘礅盹镦趸',
    duo: '掇哆多夺垛躲朵跺舵剁惰堕咄哚缍柁铎裰踱',
    e: '蛾峨鹅俄额讹娥恶厄扼遏鄂饿噩谔垩垭苊莪萼呃愕屙婀轭曷腭硪锇锷鹗颚鳄',
    en: '恩蒽摁唔嗯',
    er: '而儿耳尔饵洱二贰迩珥铒鸸鲕',
    fa: '发罚筏伐乏阀法珐垡砝',
    fan: '藩帆番翻樊矾钒繁凡烦反返范贩犯饭泛蘩幡犭梵攵燔畈蹯',
    fang: '坊芳方肪房防妨仿访纺放匚邡彷钫舫鲂',
    fei: '菲非啡飞肥匪诽吠肺废沸费芾狒悱淝妃绋绯榧腓斐扉祓砩镄痱蜚篚翡霏鲱',
    fen: '芬酚吩氛分纷坟焚汾粉奋份忿愤粪偾瀵棼愍鲼鼢',
    feng: '丰封枫蜂峰锋风疯烽逢冯缝讽奉凤俸酆葑沣砜',
    fu: '佛否夫敷肤孵扶拂辐幅氟符伏俘服浮涪福袱弗甫抚辅俯釜斧脯腑府腐赴副覆赋复傅付阜父腹负富讣附妇缚咐匐凫郛芙苻茯莩菔呋幞滏艴孚驸绂桴赙黻黼罘稃馥虍蚨蜉蝠蝮麸趺跗鳆',
    ga: '噶嘎蛤尬呷尕尜旮钆',
    gai: '该改概钙盖溉丐陔垓戤赅胲',
    gan: '干甘杆柑竿肝赶感秆敢赣坩苷尴擀泔淦澉绀橄旰矸疳酐',
    gang: '冈刚钢缸肛纲岗港戆罡颃筻',
    gong: '杠工攻功恭龚供躬公宫弓巩汞拱贡共蕻廾咣珙肱蚣蛩觥',
    gao: '篙皋高膏羔糕搞镐稿告睾诰郜蒿藁缟槔槁杲锆',
    ge: '哥歌搁戈鸽胳疙割革葛格阁隔铬个各鬲仡哿塥嗝纥搿膈硌铪镉袼颌虼舸骼髂',
    gei: '给',
    gen: '根跟亘茛哏艮',
    geng: '耕更庚羹埂耿梗哽赓鲠',
    gou: '钩勾沟苟狗垢构购够佝诟岣遘媾缑觏彀鸲笱篝鞲',
    gu: '辜菇咕箍估沽孤姑鼓古蛊骨谷股故顾固雇嘏诂菰哌崮汩梏轱牯牿胍臌毂瞽罟钴锢瓠鸪鹄痼蛄酤觚鲴骰鹘',
    gua: '刮瓜剐寡挂褂卦诖呱栝鸹',
    guai: '乖拐怪哙',
    guan: '棺关官冠观管馆罐惯灌贯倌莞掼涫盥鹳鳏',
    guang: '光广逛犷桄胱疒',
    gui: '瑰规圭硅归龟闺轨鬼诡癸桂柜跪贵刽匦刿庋宄妫桧炅晷皈簋鲑鳜',
    gun: '辊滚棍丨衮绲磙鲧',
    guo: '锅郭国果裹过馘蠃埚掴呙囗帼崞猓椁虢锞聒蜮蜾蝈',
    ha: '哈',
    hai: '骸孩海氦亥害骇咴嗨颏醢',
    han: '酣憨邯韩含涵寒函喊罕翰撼捍旱憾悍焊汗汉邗菡撖阚瀚晗焓颔蚶鼾',
    hen: '夯痕很狠恨',
    hang: '杭航沆绗珩桁',
    hao: '壕嚎豪毫郝好耗号浩薅嗥嚆濠灏昊皓颢蚝',
    he: '呵喝荷菏核禾和何合盒貉阂河涸赫褐鹤贺诃劾壑藿嗑嗬阖盍蚵翮',
    hei: '嘿黑',
    heng: '哼亨横衡恒訇蘅',
    hong: '轰哄烘虹鸿洪宏弘红黉讧荭薨闳泓',
    hou: '喉侯猴吼厚候后堠後逅瘊篌糇鲎骺',
    hu: '呼乎忽瑚壶葫胡蝴狐糊湖弧虎唬护互沪户冱唿囫岵猢怙惚浒滹琥槲轷觳烀煳戽扈祜鹕鹱笏醐斛',
    hua: '花哗华猾滑画划化话劐浍骅桦铧稞',
    huai: '槐徊怀淮坏还踝',
    huan: '欢环桓缓换患唤痪豢焕涣宦幻郇奂垸擐圜洹浣漶寰逭缳锾鲩鬟',
    huang: '荒慌黄磺蝗簧皇凰惶煌晃幌恍谎隍徨湟潢遑璜肓癀蟥篁鳇',
    hui: '灰挥辉徽恢蛔回毁悔慧卉惠晦贿秽会烩汇讳诲绘诙茴荟蕙哕喙隳洄彗缋珲晖恚虺蟪麾',
    hun: '荤昏婚魂浑混诨馄阍溷缗',
    huo: '豁活伙火获或惑霍货祸攉嚯夥钬锪镬耠蠖',
    ji: '击圾基机畸稽积箕肌饥迹激讥鸡姬绩缉吉极棘辑籍集及急疾汲即嫉级挤几脊己蓟技冀季伎祭剂悸济寄寂计记既忌际妓继纪居丌乩剞佶佴脔墼芨芰萁蒺蕺掎叽咭哜唧岌嵴洎彐屐骥畿玑楫殛戟戢赍觊犄齑矶羁嵇稷瘠瘵虮笈笄暨跻跽霁鲚鲫髻麂',
    jia: '嘉枷夹佳家加荚颊贾甲钾假稼价架驾嫁伽郏拮岬浃迦珈戛胛恝铗镓痂蛱笳袈跏',
    jian: '歼监坚尖笺间煎兼肩艰奸缄茧检柬碱硷拣捡简俭剪减荐槛鉴践贱见键箭件健舰剑饯渐溅涧建僭谏谫菅蒹搛囝湔蹇謇缣枧柙楗戋戬牮犍毽腱睑锏鹣裥笕箴翦趼踺鲣鞯',
    jiang: '僵姜将浆江疆蒋桨奖讲匠酱降茳洚绛缰犟礓耩糨豇',
    jiao: '蕉椒礁焦胶交郊浇骄娇嚼搅铰矫侥脚狡角饺缴绞剿教酵轿较叫佼僬茭挢噍峤徼姣纟敫皎鹪蛟醮跤鲛',
    jie: '窖揭接皆秸街阶截劫节桔杰捷睫竭洁结解姐戒藉芥界借介疥诫届偈讦诘喈嗟獬婕孑桀獒碣锴疖袷颉蚧羯鲒骱髫',
    jin: '巾筋斤金今津襟紧锦仅谨进靳晋禁近烬浸尽卺荩堇噤馑廑妗缙瑾槿赆觐钅锓衿矜',
    jing: '劲荆兢茎睛晶鲸京惊精粳经井警景颈静境敬镜径痉靖竟竞净刭儆阱菁獍憬泾迳弪婧肼胫腈旌',
    jiong: '炯窘冂迥扃',
    jiu: '揪究纠玖韭久灸九酒厩救旧臼舅咎就疚僦啾阄柩桕鹫赳鬏',
    ju: '鞠拘狙疽驹菊局咀矩举沮聚拒据巨具距踞锯俱句惧炬剧倨讵苣苴莒掬遽屦琚枸椐榘榉橘犋飓钜锔窭裾趄醵踽龃雎鞫',
    juan: '捐鹃娟倦眷卷绢鄄狷涓桊蠲锩镌隽',
    jue: '撅攫抉掘倔爵觉决诀绝厥劂谲矍蕨噘崛獗孓珏桷橛爝镢蹶觖',
    jun: '均菌钧军君峻俊竣浚郡骏捃狻皲筠麇',
    ka: '喀咖卡佧咔胩',
    ke: '咯坷苛柯棵磕颗科壳咳可渴克刻客课岢恪溘骒缂珂轲氪瞌钶疴窠蝌髁',
    kai: '开揩楷凯慨剀垲蒈忾恺铠锎',
    kan: '刊堪勘坎砍看侃凵莰莶戡龛瞰',
    kang: '康慷糠扛抗亢炕坑伉闶钪',
    kao: '考拷烤靠尻栲犒铐',
    ken: '肯啃垦恳垠裉颀',
    keng: '吭忐铿',
    kong: '空恐孔控倥崆箜',
    kou: '抠口扣寇芤蔻叩眍筘',
    ku: '枯哭窟苦酷库裤刳堀喾绔骷',
    kua: '夸垮挎跨胯侉',
    kuai: '块筷侩快蒯郐蒉狯脍',
    kuan: '宽款髋',
    kuang: '匡筐狂框矿眶旷况诓诳邝圹夼哐纩贶',
    kui: '亏盔岿窥葵奎魁傀馈愧溃馗匮夔隗揆喹喟悝愦阕逵暌睽聩蝰篑臾跬',
    kun: '坤昆捆困悃阃琨锟醌鲲髡',
    kuo: '括扩廓阔蛞',
    la: '垃拉喇蜡腊辣啦剌摺邋旯砬瘌',
    lai: '莱来赖崃徕涞濑赉睐铼癞籁',
    lan: '蓝婪栏拦篮阑兰澜谰揽览懒缆烂滥啉岚懔漤榄斓罱镧褴',
    lang: '琅榔狼廊郎朗浪莨蒗啷阆锒稂螂',
    lao: '捞劳牢老佬姥酪烙涝唠崂栳铑铹痨醪',
    le: '勒乐肋仂叻嘞泐鳓',
    lei: '雷镭蕾磊累儡垒擂类泪羸诔荽咧漯嫘缧檑耒酹',
    ling: '棱冷拎玲菱零龄铃伶羚凌灵陵岭领另令酃塄苓呤囹泠绫柃棂瓴聆蛉翎鲮',
    leng: '楞愣',
    li: '厘梨犁黎篱狸离漓理李里鲤礼莉荔吏栗丽厉励砾历利傈例俐痢立粒沥隶力璃哩俪俚郦坜苈莅蓠藜捩呖唳喱猁溧澧逦娌嫠骊缡珞枥栎轹戾砺詈罹锂鹂疠疬蛎蜊蠡笠篥粝醴跞雳鲡鳢黧',
    lian: '俩联莲连镰廉怜涟帘敛脸链恋炼练挛蔹奁潋濂娈琏楝殓臁膦裢蠊鲢',
    liang: '粮凉梁粱良两辆量晾亮谅墚椋踉靓魉',
    liao: '撩聊僚疗燎寥辽潦了撂镣廖料蓼尥嘹獠寮缭钌鹩耢',
    lie: '列裂烈劣猎冽埒洌趔躐鬣',
    lin: '琳林磷霖临邻鳞淋凛赁吝蔺嶙廪遴檩辚瞵粼躏麟',
    liu: '溜琉榴硫馏留刘瘤流柳六抡偻蒌泖浏遛骝绺旒熘锍镏鹨鎏',
    long: '龙聋咙笼窿隆垄拢陇弄垅茏泷珑栊胧砻癃',
    lou: '楼娄搂篓漏陋喽嵝镂瘘耧蝼髅',
    lu: '芦卢颅庐炉掳卤虏鲁麓碌露路赂鹿潞禄录陆戮垆摅撸噜泸渌漉璐栌橹轳辂辘氇胪镥鸬鹭簏舻鲈',
    lv: '驴吕铝侣旅履屡缕虑氯律率滤绿捋闾榈膂稆褛',
    luan: '峦孪滦卵乱栾鸾銮',
    lue: '掠略锊',
    lun: '轮伦仑沦纶论囵',
    luo: '萝螺罗逻锣箩骡裸落洛骆络倮荦摞猡泺椤脶镙瘰雒',
    ma: '妈麻玛码蚂马骂嘛吗唛犸嬷杩麽',
    mai: '埋买麦卖迈脉劢荬咪霾',
    man: '瞒馒蛮满蔓曼慢漫谩墁幔缦熳镘颟螨鳗鞔',
    mang: '芒茫盲忙莽邙漭朦硭蟒',
    meng: '氓萌蒙檬盟锰猛梦孟勐甍瞢懵礞虻蜢蠓艋艨黾',
    miao: '猫苗描瞄藐秒渺庙妙喵邈缈缪杪淼眇鹋蜱',
    mao: '茅锚毛矛铆卯茂冒帽貌贸侔袤勖茆峁瑁昴牦耄旄懋瞀蛑蝥蟊髦',
    me: '么',
    mei: '玫枚梅酶霉煤没眉媒镁每美昧寐妹媚坶莓嵋猸浼湄楣镅鹛袂魅',
    men: '门闷们扪玟焖懑钔',
    mi: '眯醚靡糜迷谜弥米秘觅泌蜜密幂芈冖谧蘼嘧猕獯汨宓弭脒敉糸縻麋',
    mian: '棉眠绵冕免勉娩缅面沔湎腼眄',
    mie: '蔑灭咩蠛篾',
    min: '民抿皿敏悯闽苠岷闵泯珉',
    ming: '明螟鸣铭名命冥茗溟暝瞑酩',
    miu: '谬',
    mo: '摸摹蘑模膜磨摩魔抹末莫墨默沫漠寞陌谟茉蓦馍嫫镆秣瘼耱蟆貊貘',
    mou: '谋牟某厶哞婺眸鍪',
    mu: '拇牡亩姆母墓暮幕募慕木目睦牧穆仫苜呒沐毪钼',
    na: '拿哪呐钠那娜纳内捺肭镎衲箬',
    nai: '氖乃奶耐奈鼐艿萘柰',
    nan: '南男难囊喃囡楠腩蝻赧',
    nao: '挠脑恼闹孬垴猱瑙硇铙蛲',
    ne: '淖呢讷',
    nei: '馁',
    nen: '嫩能枘恁',
    ni: '妮霓倪泥尼拟你匿腻逆溺伲坭猊怩滠昵旎祢慝睨铌鲵',
    nian: '蔫拈年碾撵捻念廿辇黏鲇鲶',
    niang: '娘酿',
    niao: '鸟尿茑嬲脲袅',
    nie: '捏聂孽啮镊镍涅乜陧蘖嗫肀颞臬蹑',
    nin: '您柠',
    ning: '狞凝宁拧泞佞蓥咛甯聍',
    niu: '牛扭钮纽狃忸妞蚴',
    nong: '脓浓农侬',
    nu: '奴努怒呶帑弩胬孥驽',
    nv: '女恧钕衄',
    nuan: '暖',
    nuenue: '虐',
    nue: '疟谑',
    nuo: '挪懦糯诺傩搦喏锘',
    ou: '哦欧鸥殴藕呕偶沤怄瓯耦',
    pa: '啪趴爬帕怕琶葩筢',
    pai: '拍排牌徘湃派俳蒎',
    pan: '攀潘盘磐盼畔判叛爿泮袢襻蟠蹒',
    pang: '乓庞旁耪胖滂逄',
    pao: '抛咆刨炮袍跑泡匏狍庖脬疱',
    pei: '呸胚培裴赔陪配佩沛掊辔帔淠旆锫醅霈',
    pen: '喷盆湓',
    peng: '砰抨烹澎彭蓬棚硼篷膨朋鹏捧碰坯堋嘭怦蟛',
    pi: '砒霹批披劈琵毗啤脾疲皮匹痞僻屁譬丕陴邳郫圮鼙擗噼庀媲纰枇甓睥罴铍痦癖疋蚍貔',
    pian: '篇偏片骗谝骈犏胼褊翩蹁',
    piao: '飘漂瓢票剽嘌嫖缥殍瞟螵',
    pie: '撇瞥丿苤氕',
    pin: '拼频贫品聘拚姘嫔榀牝颦',
    ping: '乒坪苹萍平凭瓶评屏俜娉枰鲆',
    po: '坡泼颇婆破魄迫粕叵鄱溥珀钋钷皤笸',
    pou: '剖裒踣',
    pu: '扑铺仆莆葡菩蒲埔朴圃普浦谱曝瀑匍噗濮璞氆镤镨蹼',
    qi: '期欺栖戚妻七凄漆柒沏其棋奇歧畦崎脐齐旗祈祁骑起岂乞企启契砌器气迄弃汽泣讫亟亓圻芑萋葺嘁屺岐汔淇骐绮琪琦杞桤槭欹祺憩碛蛴蜞綦綮趿蹊鳍麒',
    qia: '掐恰洽葜',
    qian: '牵扦钎铅千迁签仟谦乾黔钱钳前潜遣浅谴堑嵌欠歉佥阡芊芡荨掮岍悭慊骞搴褰缱椠肷愆钤虔箝',
    qiang: '枪呛腔羌墙蔷强抢嫱樯戗炝锖锵镪襁蜣羟跫跄',
    qiao: '橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍劁诮谯荞愀憔缲樵毳硗跷鞒',
    qie: '切茄且怯窃郄唼惬妾挈锲箧',
    qin: '钦侵亲秦琴勤芹擒禽寝沁芩蓁蕲揿吣嗪噙溱檎螓衾',
    qing: '青轻氢倾卿清擎晴氰情顷请庆倩苘圊檠磬蜻罄箐謦鲭黥',
    qiong: '琼穷邛茕穹筇銎',
    qiu: '秋丘邱球求囚酋泅俅氽巯艽犰湫逑遒楸赇鸠虬蚯蝤裘糗鳅鼽',
    qu: '趋区蛆曲躯屈驱渠取娶龋趣去诎劬蕖蘧岖衢阒璩觑氍祛磲癯蛐蠼麴瞿黢',
    quan: '圈颧权醛泉全痊拳犬券劝诠荃獾悛绻辁畎铨蜷筌鬈',
    que: '缺炔瘸却鹊榷确雀阙悫',
    qun: '裙群逡',
    ran: '然燃冉染苒髯',
    rang: '瓤壤攘嚷让禳穰',
    rao: '饶扰绕荛娆桡',
    ruo: '惹若弱',
    re: '热偌',
    ren: '壬仁人忍韧任认刃妊纫仞荏葚饪轫稔衽',
    reng: '扔仍',
    ri: '日',
    rong: '戎茸蓉荣融熔溶容绒冗嵘狨缛榕蝾',
    rou: '揉柔肉糅蹂鞣',
    ru: '茹蠕儒孺如辱乳汝入褥蓐薷嚅洳溽濡铷襦颥',
    ruan: '软阮朊',
    rui: '蕊瑞锐芮蕤睿蚋',
    run: '闰润',
    sa: '撒洒萨卅仨挲飒',
    sai: '腮鳃塞赛噻',
    san: '三叁伞散彡馓氵毵糁霰',
    sang: '桑嗓丧搡磉颡',
    sao: '搔骚扫嫂埽臊瘙鳋',
    se: '瑟色涩啬铩铯穑',
    sen: '森',
    seng: '僧',
    sha: '莎砂杀刹沙纱傻啥煞脎歃痧裟霎鲨',
    shai: '筛晒酾',
    shan: '珊苫杉山删煽衫闪陕擅赡膳善汕扇缮剡讪鄯埏芟潸姗骟膻钐疝蟮舢跚鳝',
    shang: '墒伤商赏晌上尚裳垧绱殇熵觞',
    shao: '梢捎稍烧芍勺韶少哨邵绍劭苕潲蛸笤筲艄',
    she: '奢赊蛇舌舍赦摄射慑涉社设厍佘猞畲麝',
    shen: '砷申呻伸身深娠绅神沈审婶甚肾慎渗诜谂吲哂渖椹矧蜃',
    sheng: '声生甥牲升绳省盛剩胜圣丞渑媵眚笙',
    shi: '师失狮施湿诗尸虱十石拾时什食蚀实识史矢使屎驶始式示士世柿事拭誓逝势是嗜噬适仕侍释饰氏市恃室视试谥埘莳蓍弑唑饣轼耆贳炻礻铈铊螫舐筮豕鲥鲺',
    shou: '收手首守寿授售受瘦兽扌狩绶艏',
    shu: '蔬枢梳殊抒输叔舒淑疏书赎孰熟薯暑曙署蜀黍鼠属术述树束戍竖墅庶数漱恕倏塾菽忄沭涑澍姝纾毹腧殳镯秫鹬',
    shua: '刷耍唰涮',
    shuai: '摔衰甩帅蟀',
    shuan: '栓拴闩',
    shuang: '霜双爽孀',
    shui: '谁水睡税',
    shun: '吮瞬顺舜恂',
    shuo: '说硕朔烁蒴搠嗍濯妁槊铄',
    si: '斯撕嘶思私司丝死肆寺嗣四伺似饲巳厮俟兕菥咝汜泗澌姒驷缌祀祠锶鸶耜蛳笥',
    song: '松耸怂颂送宋讼诵凇菘崧嵩忪悚淞竦',
    sou: '搜艘擞嗽叟嗖嗾馊溲飕瞍锼螋',
    su: '苏酥俗素速粟僳塑溯宿诉肃夙谡蔌嗉愫簌觫稣',
    suan: '酸蒜算',
    sui: '虽隋随绥髓碎岁穗遂隧祟蓑冫谇濉邃燧眭睢',
    sun: '孙损笋荪狲飧榫跣隼',
    suo: '梭唆缩琐索锁所唢嗦娑桫睃羧',
    ta: '塌他它她塔獭挞蹋踏闼溻遢榻沓',
    tai: '胎苔抬台泰酞太态汰邰薹肽炱钛跆鲐',
    tan: '坍摊贪瘫滩坛檀痰潭谭谈坦毯袒碳探叹炭郯蕈昙钽锬覃',
    tang: '汤塘搪堂棠膛唐糖傥饧溏瑭铴镗耥螗螳羰醣',
    thang: '倘躺淌',
    theng: '趟烫',
    tao: '掏涛滔绦萄桃逃淘陶讨套挑鼗啕韬饕',
    te: '特',
    teng: '藤腾疼誊滕',
    ti: '梯剔踢锑提题蹄啼体替嚏惕涕剃屉荑悌逖绨缇鹈裼醍',
    tian: '天添填田甜恬舔腆掭忝阗殄畋钿蚺',
    tiao: '条迢眺跳佻祧铫窕龆鲦',
    tie: '贴铁帖萜餮',
    ting: '厅听烃汀廷停亭庭挺艇莛葶婷梃蜓霆',
    tong: '通桐酮瞳同铜彤童桶捅筒统痛佟僮仝茼嗵恸潼砼',
    tou: '偷投头透亠',
    tu: '凸秃突图徒途涂屠土吐兔堍荼菟钍酴',
    tuan: '湍团疃',
    tui: '推颓腿蜕褪退忒煺',
    tun: '吞屯臀饨暾豚窀',
    tuo: '拖托脱鸵陀驮驼椭妥拓唾乇佗坨庹沱柝砣箨舄跎鼍',
    wa: '挖哇蛙洼娃瓦袜佤娲腽',
    wai: '歪外',
    wan: '豌弯湾玩顽丸烷完碗挽晚皖惋宛婉万腕剜芄苋菀纨绾琬脘畹蜿箢',
    wang: '汪王亡枉网往旺望忘妄罔尢惘辋魍',
    wei: '威巍微危韦违桅围唯惟为潍维苇萎委伟伪尾纬未蔚味畏胃喂魏位渭谓尉慰卫倭偎诿隈葳薇帏帷崴嵬猥猬闱沩洧涠逶娓玮韪軎炜煨熨痿艉鲔',
    wen: '瘟温蚊文闻纹吻稳紊问刎愠阌汶璺韫殁雯',
    weng: '嗡翁瓮蓊蕹',
    wo: '挝蜗涡窝我斡卧握沃莴幄渥杌肟龌',
    wu: '巫呜钨乌污诬屋无芜梧吾吴毋武五捂午舞伍侮坞戊雾晤物勿务悟误兀仵阢邬圬芴庑怃忤浯寤迕妩骛牾焐鹉鹜蜈鋈鼯',
    xi: '昔熙析西硒矽晰嘻吸锡牺稀息希悉膝夕惜熄烯溪汐犀檄袭席习媳喜铣洗系隙戏细僖兮隰郗茜葸蓰奚唏徙饩阋浠淅屣嬉玺樨曦觋欷熹禊禧钸皙穸蜥蟋舾羲粞翕醯鼷',
    xia: '瞎虾匣霞辖暇峡侠狭下厦夏吓掀葭嗄狎遐瑕硖瘕罅黠',
    xian: '锨先仙鲜纤咸贤衔舷闲涎弦嫌显险现献县腺馅羡宪陷限线冼藓岘猃暹娴氙祆鹇痫蚬筅籼酰跹',
    xiang: '相厢镶香箱襄湘乡翔祥详想响享项巷橡像向象芗葙饷庠骧缃蟓鲞飨',
    xiao: '萧硝霄削哮嚣销消宵淆晓小孝校肖啸笑效哓咻崤潇逍骁绡枭枵筱箫魈',
    xie: '楔些歇蝎鞋协挟携邪斜胁谐写械卸蟹懈泄泻谢屑偕亵勰燮薤撷廨瀣邂绁缬榭榍歙躞',
    xin: '薪芯锌欣辛新忻心信衅囟馨莘歆铽鑫',
    xing: '星腥猩惺兴刑型形邢行醒幸杏性姓陉荇荥擤悻硎',
    xiong: '兄凶胸匈汹雄熊芎',
    xiu: '休修羞朽嗅锈秀袖绣莠岫馐庥鸺貅髹',
    xu: '墟戌需虚嘘须徐许蓄酗叙旭序畜恤絮婿绪续讴诩圩蓿怵洫溆顼栩煦砉盱胥糈醑',
    xuan: '轩喧宣悬旋玄选癣眩绚儇谖萱揎馔泫洵渲漩璇楦暄炫煊碹铉镟痃',
    xue: '靴薛学穴雪血噱泶鳕',
    xun: '勋熏循旬询寻驯巡殉汛训讯逊迅巽埙荀薰峋徇浔曛窨醺鲟',
    ya: '压押鸦鸭呀丫芽牙蚜崖衙涯雅哑亚讶伢揠吖岈迓娅琊桠氩砑睚痖',
    yan: '焉咽阉烟淹盐严研蜒岩延言颜阎炎沿奄掩眼衍演艳堰燕厌砚雁唁彦焰宴谚验厣靥赝俨偃兖讠谳郾鄢芫菸崦恹闫阏洇湮滟妍嫣琰晏胭腌焱罨筵酽魇餍鼹',
    yang: '殃央鸯秧杨扬佯疡羊洋阳氧仰痒养样漾徉怏泱炀烊恙蛘鞅',
    yao: '邀腰妖瑶摇尧遥窑谣姚咬舀药要耀夭爻吆崾徭瀹幺珧杳曜肴鹞窈繇鳐',
    ye: '椰噎耶爷野冶也页掖业叶曳腋夜液谒邺揶馀晔烨铘',
    yi: '一壹医揖铱依伊衣颐夷遗移仪胰疑沂宜姨彝椅蚁倚已乙矣以艺抑易邑屹亿役臆逸肄疫亦裔意毅忆义益溢诣议谊译异翼翌绎刈劓佾诒圪圯埸懿苡薏弈奕挹弋呓咦咿噫峄嶷猗饴怿怡悒漪迤驿缢殪贻旖熠钇镒镱痍瘗癔翊衤蜴舣羿翳酏黟',
    yin: '茵荫因殷音阴姻吟银淫寅饮尹引隐印胤鄞堙茚喑狺夤氤铟瘾蚓霪龈',
    ying: '英樱婴鹰应缨莹萤营荧蝇迎赢盈影颖硬映嬴郢茔莺萦撄嘤膺滢潆瀛瑛璎楹鹦瘿颍罂',
    yo: '哟唷',
    yong: '拥佣臃痈庸雍踊蛹咏泳涌永恿勇用俑壅墉慵邕镛甬鳙饔',
    you: '幽优悠忧尤由邮铀犹油游酉有友右佑釉诱又幼卣攸侑莸呦囿宥柚猷牖铕疣蝣鱿黝鼬',
    yu: '迂淤于盂榆虞愚舆余俞逾鱼愉渝渔隅予娱雨与屿禹宇语羽玉域芋郁吁遇喻峪御愈欲狱育誉浴寓裕预豫驭禺毓伛俣谀谕萸蓣揄喁圄圉嵛狳饫庾阈妪妤纡瑜昱觎腴欤於煜燠聿钰鹆瘐瘀窳蝓竽舁雩龉',
    yuan: '鸳渊冤元垣袁原援辕园员圆猿源缘远苑愿怨院塬沅媛瑗橼爰眢鸢螈鼋',
    yue: '曰约越跃钥岳粤月悦阅龠樾刖钺',
    yun: '耘云郧匀陨允运蕴酝晕韵孕郓芸狁恽纭殒昀氲',
    za: '匝砸杂拶咂',
    zai: '栽哉灾宰载再在咱崽甾',
    zan: '攒暂赞瓒昝簪糌趱錾',
    zang: '赃脏葬奘戕臧',
    zao: '遭糟凿藻枣早澡蚤躁噪造皂灶燥唣缫',
    ze: '责择则泽仄赜啧迮昃笮箦舴',
    zei: '贼',
    zen: '怎谮',
    zeng: '增憎曾赠缯甑罾锃',
    zha: '扎喳渣札轧铡闸眨栅榨咋乍炸诈揸吒咤哳怍砟痄蚱齄',
    zhai: '摘斋宅窄债寨砦',
    zhan: '瞻毡詹粘沾盏斩辗崭展蘸栈占战站湛绽谵搌旃',
    zhang: '樟章彰漳张掌涨杖丈帐账仗胀瘴障仉鄣幛嶂獐嫜璋蟑',
    zhao: '招昭找沼赵照罩兆肇召爪诏棹钊笊',
    zhe: '遮折哲蛰辙者锗蔗这浙谪陬柘辄磔鹧褚蜇赭',
    zhen: '珍斟真甄砧臻贞针侦枕疹诊震振镇阵缜桢榛轸赈胗朕祯畛鸩',
    zheng: '蒸挣睁征狰争怔整拯正政帧症郑证诤峥钲铮筝',
    zhi: '芝枝支吱蜘知肢脂汁之织职直植殖执值侄址指止趾只旨纸志挚掷至致置帜峙制智秩稚质炙痔滞治窒卮陟郅埴芷摭帙忮彘咫骘栉枳栀桎轵轾攴贽膣祉祗黹雉鸷痣蛭絷酯跖踬踯豸觯',
    zhong: '中盅忠钟衷终种肿重仲众冢锺螽舂舯踵',
    zhou: '舟周州洲诌粥轴肘帚咒皱宙昼骤啄着倜诹荮鬻纣胄碡籀舳酎鲷',
    zhu: '珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱主著柱助蛀贮铸筑住注祝驻伫侏邾苎茱洙渚潴驺杼槠橥炷铢疰瘃蚰竺箸翥躅麈',
    zhua: '抓',
    zhuai: '拽',
    zhuan: '专砖转撰赚篆抟啭颛',
    zhuang: '桩庄装妆撞壮状丬',
    zhui: '椎锥追赘坠缀萑骓缒',
    zhun: '谆准',
    zhuo: '捉拙卓桌琢茁酌灼浊倬诼廴蕞擢啜浞涿杓焯禚斫',
    zi: '兹咨资姿滋淄孜紫仔籽滓子自渍字谘嵫姊孳缁梓辎赀恣眦锱秭耔笫粢觜訾鲻髭',
    zong: '鬃棕踪宗综总纵腙粽',
    zou: '邹走奏揍鄹鲰',
    zu: '租足卒族祖诅阻组俎菹啐徂驵蹴',
    zuan: '钻纂攥缵',
    zui: '嘴醉最罪',
    zun: '尊遵撙樽鳟',
    zuo: '昨左佐柞做作坐座阝阼胙祚酢',
    cou: '薮楱辏腠',
    nang: '攮哝囔馕曩',
    o: '喔',
    dia: '嗲',
    chuai: '嘬膪踹',
    cen: '岑涔',
    diu: '铥',
    nou: '耨',
    fou: '缶',
    bia: '髟'
}
var pinyin_default = (function () {
    return {
        firstChar(str) {
            let firstStr = ''
            for (let i = 0; i < (str ? str.length : 0); i++) {
                let code = str.charCodeAt(i)
                if (code >= 19968 && code <= 40869) {
                    for (let item in pinYin) {
                        if (pinYin.hasOwnProperty(item)) {
                            if (pinYin[item].indexOf(str[i]) > -1) {
                                firstStr += item.substring(0, 1)
                                break
                            }
                        }
                    }
                }
            }
            return firstStr
        },
        fullChar(str) {
            let fullStr = ''
            for (let i = 0; i < (str ? str.length : 0); i++) {
                let code = str.charCodeAt(i)
                if (code >= 19968 && code <= 40869) {
                    for (let item in pinYin) {
                        if (pinYin.hasOwnProperty(item)) {
                            if (pinYin[item].indexOf(str[i]) > -1) {
                                fullStr += item
                                break
                            }
                        }
                    }
                }
            }
            return fullStr
        }
    }
})()

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

const Utils = {
    time: time,
    randomColor16: randomColor16,
    isEmpty: isEmpty,
    renderUnsupport: renderUnsupport,
    char2PinFirstChar: pinyin_default.firstChar,
    char2PinFullChar: pinyin_default.fullChar,
    drawTextWithCustomFont: drawTextWithCustomFont
}

// await new WidgetBase().setWidgetConfig();
module.exports = {
    WidgetBase,
    Runing,
    Cache,
    Storage,
    GenrateView,
    h,
    Utils
}
