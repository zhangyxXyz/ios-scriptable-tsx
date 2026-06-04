;(function () {
    function pad(value, length = 2) {
        return String(value).padStart(length, '0')
    }

    function formatWithPattern(date, pattern) {
        const map = {
            yyyy: pad(date.getFullYear(), 4),
            yy: pad(date.getFullYear() % 100),
            MM: pad(date.getMonth() + 1),
            M: String(date.getMonth() + 1),
            dd: pad(date.getDate()),
            d: String(date.getDate()),
            HH: pad(date.getHours()),
            H: String(date.getHours()),
            mm: pad(date.getMinutes()),
            m: String(date.getMinutes()),
            ss: pad(date.getSeconds()),
            s: String(date.getSeconds()),
        }

        return pattern.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|m|ss|s/g, token => map[token] || token)
    }

    ScriptableMock.register('DateFormatter', () => {
        return {
            DateFormatter: class {
                constructor() {
                    this.locale = undefined
                    this.dateFormat = undefined
                    this._dateStyle = undefined
                    this._timeStyle = undefined
                }

                useNoDateStyle() {
                    this._dateStyle = undefined
                }

                useShortDateStyle() {
                    this._dateStyle = 'short'
                }

                useMediumDateStyle() {
                    this._dateStyle = 'medium'
                }

                useLongDateStyle() {
                    this._dateStyle = 'long'
                }

                useFullDateStyle() {
                    this._dateStyle = 'full'
                }

                useNoTimeStyle() {
                    this._timeStyle = undefined
                }

                useShortTimeStyle() {
                    this._timeStyle = 'short'
                }

                useMediumTimeStyle() {
                    this._timeStyle = 'medium'
                }

                useLongTimeStyle() {
                    this._timeStyle = 'long'
                }

                useFullTimeStyle() {
                    this._timeStyle = 'full'
                }

                string(date) {
                    const value = date instanceof Date ? date : new Date(date)
                    if (this.dateFormat) return formatWithPattern(value, this.dateFormat)

                    const options = {}
                    if (this._dateStyle) options.dateStyle = this._dateStyle
                    if (this._timeStyle) options.timeStyle = this._timeStyle
                    if (!options.dateStyle && !options.timeStyle) options.dateStyle = 'medium'

                    return new Intl.DateTimeFormat(this.locale || undefined, options).format(value)
                }
            },
        }
    })
})()
