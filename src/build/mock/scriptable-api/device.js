;(function () {
    ScriptableMock.register('Device', context => {
        const {MockSize, isDarkAppearance} = context
        return {
            Device: {
                name: () => 'Playground iPhone',
                systemName: () => 'iOS',
                systemVersion: () => '17.0',
                model: () => 'iPhone',
                isPhone: () => true,
                isPad: () => false,
                screenSize: () => new MockSize(390, 844),
                screenResolution: () => new MockSize(1170, 2532),
                screenScale: () => 3,
                screenBrightness: () => 0.8,
                isInPortrait: () => true,
                isInPortraitUpsideDown: () => false,
                isInLandscapeLeft: () => false,
                isInLandscapeRight: () => false,
                isFaceUp: () => true,
                isFaceDown: () => false,
                batteryLevel: () => 0.8,
                isDischarging: () => true,
                isCharging: () => false,
                isFullyCharged: () => false,
                preferredLanguages: () => [navigator.language || 'zh-CN'],
                locale: () => navigator.language || 'zh-CN',
                language: () => (navigator.language || 'zh-CN').split('-')[0],
                isUsingDarkAppearance: () => isDarkAppearance,
                volume: () => 0.5,
                setScreenBrightness: ScriptableMock.noop,
            },
        }
    })
})()
