;(function () {
    ScriptableMock.register('Timer', () => {
        class Timer {
            constructor() {
                this.timeInterval = 0
                this.repeats = false
                this._handle = null
            }
            schedule(callback) {
                const interval = Number(this.timeInterval || 0)
                const delay = Math.max(0, interval > 10 ? interval : interval * 1000)
                this._handle = this.repeats ? setInterval(callback, delay) : setTimeout(callback, delay)
            }
            invalidate() {
                clearTimeout(this._handle)
                clearInterval(this._handle)
                this._handle = null
            }
            static schedule(timeInterval, repeats, callback) {
                const timer = new Timer()
                timer.timeInterval = timeInterval
                timer.repeats = repeats
                timer.schedule(callback)
                return timer
            }
        }

        return {Timer}
    })
})()
