class InfoCovid19Translate {
  async init() {
    // ListWidget 实例
    const widget = (await this.render()) as ListWidget
    // 注册小部件
    Script.setWidget(widget)
    // 调试用
    !config.runsInWidget && (await widget.presentMedium())
    // 脚本结束
    Script.complete()
  }

  renderUpdateInfoCell = data => {
    return (
      <wstack flexDirection="column" background={data.bg}>
        <wspacer />
        <wstack>
          <wspacer />
          <wtext font={12} textColor={this.widgetColor}>
            较上日
          </wtext>
          <wtext font={12} textColor={data.color}>
            {data.addnum}
          </wtext>
          <wspacer />
        </wstack>
        <wspacer length={2} />
        <wstack>
          <wspacer />
          <wtext textColor={data.color}>{data.value}</wtext>
          <wspacer />
        </wstack>
        <wspacer length={2} />
        <wstack>
          <wspacer />
          <wtext font={12} textColor={this.widgetColor}>
            {data.text}
          </wtext>
          <wspacer />
        </wstack>
        <wspacer />
      </wstack>
    )
  }

  async render(): Promise<unknown> {
    return (
      <wbox background={this.backGroundColor}>
        <wspacer />
        <wstack borderRadius={10}>
          {this.renderUpdateInfoCell({
            color: '#f23a3b',
            /*bg: "#fff0f1",*/
            bg: this.covidDetailCellBgColorHex,
            value: `${(this.covid19Info?.confirm || 0) - parseInt(this.covid19Info?.heal || '0') || '-'}`,
            text: '现有确诊',
            addnum: this.formatNumber(this.covid19UpdateInfo?.nowConfirm),
          })}
          <wspacer length={2} />
          {this.renderUpdateInfoCell({
            color: '#cc1e1e',
            /*bg: "#fff0f1",*/
            bg: this.covidDetailCellBgColorHex,
            value: `${this.covid19Info?.confirm || '-'}`,
            text: '累计确诊',
            addnum: this.formatNumber(this.covid19UpdateInfo?.confirmAdd),
          })}
          <wspacer length={2} />
          {this.renderUpdateInfoCell({
            color: '#178b50',
            /*bg: "#fff0f1",*/
            bg: this.covidDetailCellBgColorHex,
            value: `${this.covid19Info?.heal || '-'}`,
            text: '累计治愈',
            addnum: this.formatNumber(this.covid19UpdateInfo?.heal),
          })}
          <wspacer length={2} />
          {this.renderUpdateInfoCell({
            color: '#4e5a65',
            /*bg: "#fff0f1",*/
            bg: this.covidDetailCellBgColorHex,
            value: `${this.covid19Info?.dead || '-'}`,
            text: '累计死亡',
            addnum: this.formatNumber(this.covid19UpdateInfo?.dead),
          })}
        </wstack>
        <wspacer length={5} />
        <wstack borderRadius={10} padding={[5, 5, 5, 5]} flexDirection="column" background={this.addressBgColorHex}>
          <wstack verticalAlign="center">
            <wimage src="location" filter={this.addressFontColorHex} opacity={0.8} width={12} height={12} />
            <wspacer length={5} />
            <wtext textColor={this.addressFontColorHex} font={12} opacity={0.8}>
              {(this.locationInfo?.postalAddress.city || '') + (this.locationInfo?.postalAddress.street || '') ||
                '未找到定位'}
            </wtext>
            <wspacer />
          </wstack>
        </wstack>
      </wbox>
    )
  }
}

// 从 process.env 下可以加载 .env 文件的键值对
// 详见 https://github.com/2214962083/ios-scriptable-tsx/blob/master/docs/config.md#env-config
console.log(process.env.HELLO + ',' + process.env.MOMENT)

new InfoCovid19Translate().init()
