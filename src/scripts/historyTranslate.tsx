import {title} from 'process'

class historyTranslate {
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
      <wstack padding={[10, 10, 10, 10]}>
        <wstack padding={[10, 10, 10, 10]}>
          <wstack href={href}>
            <wstack
              padding={[10, 10, 10, 10]}
              background={this.backGroundColor}
              borderRadius={20}
              flexDirection="column"
            >
              <wspacer />
              <wstack>
                <wstack>
                  <wspacer />
                  <wstack width={50} height={50} borderRadius={25}>
                    <wimage src={img} imageAlign="center"></wimage>
                  </wstack>
                  <wspacer />
                </wstack>
              </wstack>
              <wspacer />
              <wstack width={0} height={30}>
                <wtext font={Font.boldSystemFont(8)} textColor={this.widgetColor} maxLine={3}>
                  {title}
                </wtext>
              </wstack>
              <wspacer length={5} />
              <wstack>
                <wspacer />
                <wtext font={Font.boldSystemFont(10)} textColor={this.widgetColor}>
                  {year}
                </wtext>
              </wstack>
              <wspacer />
            </wstack>
          </wstack>
          <wspacer />
        </wstack>
      </wstack>
    )
  }
}

// 从 process.env 下可以加载 .env 文件的键值对
// 详见 https://github.com/2214962083/ios-scriptable-tsx/blob/master/docs/config.md#env-config
console.log(process.env.HELLO + ',' + process.env.MOMENT)

new historyTranslate().init()
