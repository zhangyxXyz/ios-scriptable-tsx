class TodayOilPriceTranslate {
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

  renderOilPrice = (data: oilRes) => {
    const isGasoline = data.cate.indexOf('汽油') != -1
    return (
      <wstack flexDirection="column" verticalAlign="center">
        <RowCenter>
          <wtext textAlign="center" textColor={this.fontColor} font={new Font('Chalkduster', 26)}>
            {data.cate.replace('号汽油', '').replace('号柴油', '')}
          </wtext>
          <wstack flexDirection="column" verticalAlign="center">
            <wtext
              textColor={this.oilNameColorHex || this.widgetColor}
              font={new Font('Chalkduster', 8)}
              textAlign="center"
            >
              {' '}
            </wtext>
            <wstack flexDirection="column" verticalAlign="center">
              <wtext textColor="#ffffff" font={new Font('HiraKakuProN-W6', 8)} textAlign="center">
                {'号'}
              </wtext>
              <wtext textColor="#ffffff" font={new Font('HiraKakuProN-W6', 12)} textAlign="center">
                {isGasoline ? '汽油' : '柴油'}
              </wtext>
            </wstack>
          </wstack>
        </RowCenter>
        <wspacer length={10} />
        <RowCenter>
          <wtext textColor={this.fontColor} font={new Font('Chalkduster', 16)} textAlign="center">
            {data.value.replace('/升', '').replace('元', '')}
          </wtext>
          <wstack flexDirection="column" verticalAlign="center">
            <wtext textColor="#ffffff" font={new Font('Chalkduster', 5)} textAlign="center">
              {' '}
            </wtext>
            <wtext textColor="#ffffff" font={new Font('Chalkduster', 10)} textAlign="center">
              {'/L'}
            </wtext>
          </wstack>
        </RowCenter>
      </wstack>
    )
  }

  renderStackCellText = (data: {icon: string; iconColor: string; href: string; label: string; value: string}) => {
    return (
      <wstack verticalAlign="center">
        <wspacer length={5} />
        <wimage src={data.icon} width={10} height={10} filter={this.fontColor} />
        <wspacer length={5} />
        <wtext href={data.href} font={10} textColor={this.fontColor} maxLine={1}>
          {data.label}：{data.value || '-'}
        </wtext>
        <wspacer />
      </wstack>
    )
  }

  renderGasStation = (gasStation: gasStationResponse[]) => {
    return gasStation.map((item, index) => {
      const href = `iosamap://navi?sourceApplication=applicationName&backScheme=applicationScheme&poiname=fangheng&poiid=BGVIS&lat=${item.location.lat}&lon=${item.location.lng}&dev=1&style=2`
      return (
        <wstack flexDirection="column" borderRadius={4} href={href}>
          {this.renderStackCellText({
            value: `${item.title}(${item._distance}米)`,
            label: '油站',
            href,
            icon: 'car',
            iconColor: '#ffffff',
          })}
          <wspacer length={2} />
          {this.renderStackCellText({
            value: item.address,
            label: '地址',
            href,
            icon: 'mappin.and.ellipse',
            iconColor: '#ffffff',
          })}
          <wspacer length={2} />
          {this.renderStackCellText({value: item.tel, label: '电话', href: 'tel:' + item.tel, icon: 'iphone'})}
          {gasStation.length - 1 !== index && <wspacer />}
        </wstack>
      )
    })
  }

  async render(): Promise<unknown> {
    return (
      <wbox padding={[0, 0, 0, 0]}>
        <wstack background={this.headerColor} padding={[10, 10, 10, 10]}>
          {data.map(item => {
            const city = locality[1].replace('市', '')
            const cate = item.cate.replace(city, '').replace('#', '号').replace('价格', '')
            return this.renderOilPrice({...item, cate})
          })}
        </wstack>
        {gasStation.length > 0 && (
          <wstack background={this.bodyColor} flexDirection="column" padding={[10, 10, 10, 10]}>
            {this.renderGasStation(gasStation)}
          </wstack>
        )}
        <wspacer />
        <wstack verticalAlign="center" padding={[0, 10, 10, 10]}>
          <wimage
            src={
              'data:image/png;base64,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'
            }
            width={15}
            height={15}
            filter="#ffffff"
          />
          <wspacer length={10} />
          <wtext opacity={0.5} font={14} textColor="#ffffff">
            今日油价
          </wtext>
          <wspacer />
          <wimage src="arrow.clockwise" width={10} height={10} opacity={0.5} />
          <wspacer length={10} />
          <wtext font={12} textAlign="right" opacity={0.5}>
            {this.nowTime()}
          </wtext>
        </wstack>
      </wbox>
    )
  }
}

// 从 process.env 下可以加载 .env 文件的键值对
// 详见 https://github.com/2214962083/ios-scriptable-tsx/blob/master/docs/config.md#env-config
console.log(process.env.HELLO + ',' + process.env.MOMENT)

new TodayOilPriceTranslate().init()
