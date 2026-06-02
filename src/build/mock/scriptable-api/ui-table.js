;(function () {
    ScriptableMock.register('UITable', () => {
        class UITable {
            constructor() {
                this.showSeparators = true
                this.rows = []
            }
            addRow(row) {
                this.rows.push(row)
            }
            removeRow(row) {
                const index = this.rows.indexOf(row)
                if (index >= 0) this.rows.splice(index, 1)
            }
            removeAllRows() {
                this.rows.length = 0
            }
            reload() {}
            async present() {
                return true
            }
        }

        return {UITable}
    })
})()
