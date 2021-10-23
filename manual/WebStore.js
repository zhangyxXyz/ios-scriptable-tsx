// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: book-open;

let fm
try {
    fm = FileManager.iCloud()
} catch (e) {
    console.log('设置文件缓存路径失败，请检查 iCloud 权限是否开启')
    console.error(e)
    fm = FileManager.local()
}
const RootPath = fm.documentsDirectory()

const saveFileName = fileName => {
    const hasSuffix = fileName.lastIndexOf('.') + 1
    return !hasSuffix ? `${fileName}.js` : fileName
}

const write = (fileName, content, version = '') => {
    let file = saveFileName(fileName)
    const filePath = fm.joinPath(RootPath, file)
    fm.writeString(filePath, `${content}\n//version:${version}`)
    return true
}

const saveFile = async ({ moduleName, url, version }) => {
    const req = new Request(encodeURI(url))
    const content = await req.loadString()
    write(`${moduleName}`, content, version)
    return true
}

async function downloadWidget(widget) {
    const text = '下载'
    const a = new Alert()
    try {
        await saveFile({
            moduleName: widget.name,
            url: widget.scriptURL,
            version: widget.version
        })
        if (widget.depend) {
            const depend = JSON.parse(widget.depend)
            for (const dependElement of depend) {
                await saveFile({
                    moduleName: dependElement.name,
                    url: dependElement.scriptURL
                })
                console.log(`依赖：${dependElement.name}下载成功`)
            }
        }
        a.message = `组件脚本${widget.title}${text}成功，请在组件列表中找到${widget.name}运行！`
    } catch (e) {
        console.log(e)
        a.message = `组件脚本${widget.title}${text}失败!`
    }
    a.addCancelAction('确定')
    await a.presentAlert()
    return true
}

async function getLocalStoreWidget(widget) {
    const scriptPath = fm.joinPath(RootPath, `${widget.name}.js`)
    const scriptExists = fm.fileExists(scriptPath)
    const alreadyExistsAlert = new Alert()
    if (scriptExists) {
        const scriptContent = fm.readString(scriptPath)
        const m = scriptContent.match(/version:(.*)/m)
        if (m && m[1]) {
            if (m[1] !== widget.version) {
                alreadyExistsAlert.message = `检测${widget.title}存在新版本，是否更新？`
                alreadyExistsAlert.addAction('更新')
                alreadyExistsAlert.addCancelAction('取消')
            } else {
                alreadyExistsAlert.message = `${widget.title}已经是最新版本，需要继续下载吗？`
                alreadyExistsAlert.addAction('确定')
                alreadyExistsAlert.addCancelAction('取消')
            }
        } else {
            alreadyExistsAlert.message = `确定要安装${widget.title}吗？`
            alreadyExistsAlert.addAction('确定')
            alreadyExistsAlert.addCancelAction('取消')
        }
    } else {
        alreadyExistsAlert.message = `确定要安装${widget.title}吗？`
        alreadyExistsAlert.addAction('确定')
        alreadyExistsAlert.addCancelAction('取消')
    }
    if ((await alreadyExistsAlert.presentAlert()) === -1) return false
    await downloadWidget(widget)
}

const present = async () => {
    let data = args.queryParameters
    if (data.name && data.scriptURL && data.version) {
        await getLocalStoreWidget(data)
    } else {
        const a = new Alert()
        a.title = data.scriptURL
        a.message = '该脚本不在 App 中执行，请不用运行这段程序'
        a.addAction('确定')
        a.addCancelAction('取消')
        await a.presentAlert()
        return false
    }
}

if (config.runsInApp) {
    await present()
}

Script.complete()
