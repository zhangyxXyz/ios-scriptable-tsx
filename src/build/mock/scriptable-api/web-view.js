;(function () {
    ScriptableMock.register('WebView', context => {
        class WebView {
            constructor() {
                this.html = ''
                this.url = ''
                this.shouldAllowRequest = null
                this.waiters = []
                this.pendingEvents = []
                this.presentedFrame = null
                this.presentPromise = null
                this.closePresent = null
            }
            static async loadHTML(html) {
                const webView = new WebView()
                await webView.loadHTML(html)
                return webView
            }
            static async loadFile(fileURL) {
                const webView = new WebView()
                await webView.loadFile(fileURL)
                return webView
            }
            static async loadURL(url) {
                const webView = new WebView()
                await webView.loadURL(url)
                return webView
            }
            async loadURL(url) {
                this.url = url
            }
            async loadRequest(request) {
                this.url = request.url
            }
            async loadHTML(html) {
                this.html = html
            }
            async loadFile(fileURL) {
                this.url = fileURL
            }
            async ensureDocument() {
                if (this.presentedFrame?.isConnected) return this.presentedFrame.contentDocument
                if (this.frame && this.frame.isConnected) return this.frame.contentDocument
                const frame = document.createElement('iframe')
                frame.style.cssText = 'position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;border:0;'
                document.body.appendChild(frame)
                this.frame = frame
                const doc = frame.contentDocument
                doc.open()
                doc.write(this.html || '<!doctype html><html><body></body></html>')
                doc.close()
                await new Promise(resolve => setTimeout(resolve, 0))
                await Promise.all(
                    Array.from(doc.images || []).map(
                        img =>
                            img.complete
                                ? Promise.resolve()
                                : new Promise(resolve => {
                                      img.onload = resolve
                                      img.onerror = resolve
                                  }),
                    ),
                )
                return doc
            }
            dispatchEvent(detail) {
                const payload = JSON.stringify(detail || {})
                const waiter = this.waiters.shift()
                if (waiter) {
                    waiter(payload)
                } else {
                    this.pendingEvents.push(payload)
                }
            }
            waitForEvent() {
                const pending = this.pendingEvents.shift()
                if (pending) {
                    return Promise.resolve(pending)
                }
                return new Promise(resolve =>
                    this.waiters.push(payload => {
                        resolve(payload)
                    }),
                )
            }
            attachFrame(frame) {
                this.presentedFrame = frame
                const attach = () => {
                    const win = frame.contentWindow
                    if (!win) return
                    win.__scriptablePlaygroundBridgeOwner = this
                    if (!win.__scriptablePlaygroundBridgeAttached) {
                        win.__scriptablePlaygroundBridgeAttached = true
                        win.addEventListener('JBridge', event => {
                            win.__scriptablePlaygroundBridgeOwner?.dispatchEvent(event.detail || {})
                        })
                    }
                    if (typeof win.invoke !== 'function') {
                        win.invoke = (code, data) => {
                            win.dispatchEvent(new win.CustomEvent('JBridge', {detail: {code, data}}))
                        }
                    }
                }
                attach()
                frame.addEventListener('load', attach)
            }
            async evaluateJavaScript(code, useCallback = false) {
                const source = String(code)
                if (source.includes('document.getElementById("colorPicker").value')) return '#1677ff'
                if (useCallback && source.includes('completion(')) return this.waitForEvent()
                const doc = await this.ensureDocument()
                return doc.defaultView.eval(source)
            }
            async getHTML() {
                return this.html
            }
            async present() {
                const frame = context.renderWebView?.(this.html || this.url || '', this)
                if (frame) this.attachFrame(frame)
                if (!this.presentPromise) {
                    this.presentPromise = new Promise(resolve => {
                        this.closePresent = resolve
                    })
                }
                return this.presentPromise
            }
            close() {
                if (this.closePresent) this.closePresent()
                this.waiters.splice(0).forEach(resolve => resolve(JSON.stringify({code: '__playground_close__'})))
            }
            async waitForLoad() {}
        }

        return {WebView}
    })
})()
