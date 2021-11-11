class MonitorTranslate {
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
  async render(): Promise<unknown> {
    return (
      <wbox spacing={this.contentRowSpacing}>
        <wspacer />
        <wtext textColor={this.widgetColor} font={new Font('SF Mono', 15)} opacity={0.7}>
          📖 知乎热榜
        </wtext>
        <wstack flexDirection="column">
          {items.map(item => {
            return (
              <wstack verticalAlign="center" href="www.baidu.com">
                <wimage src={item['pic']} width={18} height={18}></wimage>
                <wspacer length={5} />
                <wtext textColor={this.widgetColor} font={new Font('SF Mono', 14)} textAlign="left" maxLine={1}>
                  {item['desc']}
                </wtext>
                <wspacer length={5} />
                {item['icon'] && <wimage src={item['icon']} width={18} height={18}></wimage>}
                <wspacer />
                <wtext font={12} textColor={this.widgetColor} opacity={0.6}>
                  {item['desc_extr']}
                </wtext>
              </wstack>
            )
          })}
        </wstack>
        <wstack verticalAlign="center" padding={[0, 10, 10, 10]}>
          <wspacer />
          <wimage src="arrow.clockwise" width={10} height={10} filter={this.widgetColor} opacity={0.5} />
          <wspacer length={5} />
          <wtext textColor={this.widgetColor} font={new Font('SF Mono', 10)} textAlign="right" opacity={0.5}>
            {Utils.time('HH:mm:ss')}
          </wtext>
        </wstack>
        <wspacer length={2} />
      </wbox>
      //   <wbox spacing={6} padding={[12, 12, 12, 0]}>
      //     <wtext textColor="#ffffff" font={new Font('Menlo', 11)} textAlign="left">
      //       [🤖]Hi，Good Midnight!
      //     </wtext>
      //     <wtext textColor="#C6FFDD" font={new Font('Menlo', 11)} textAlign="left">
      //       [🗓] 2021: 10 : 11
      //     </wtext>
      //     <wtext textColor="#BBD676" font={new Font('Menlo', 11)} textAlign="left" maxLine={1}>
      //       [🐷] 你是我的小苹果
      //     </wtext>
      //     <wtext textColor="#FBD786" font={new Font('Menlo', 11)} textAlign="left">
      //       [🌤] 晴天
      //     </wtext>
      //     <wtext textColor="#00FF00" font={new Font('Menlo', 11)} textAlign="left">
      //       [🔋] Battery
      //     </wtext>
      //     <wtext textColor="#f19c65" font={new Font('Menlo', 11)} textAlign="left">
      //       [⏳] ▓▓▓▓▓▓▓ YearProgress
      //     </wtext>
      //   </wbox>
    )
  }
}

// 从 process.env 下可以加载 .env 文件的键值对
// 详见 https://github.com/2214962083/ios-scriptable-tsx/blob/master/docs/config.md#env-config
console.log(process.env.HELLO + ',' + process.env.MOMENT)

new MonitorTranslate().init()
