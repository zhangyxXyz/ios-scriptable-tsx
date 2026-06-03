;(function () {
    ScriptableMock.register('Device', context => {
        const {MockSize, isDarkAppearance} = context
        const preferredLocale = navigator.language || 'zh-CN'
        return {
            Device: {
                name: () => 'iPhone 16 Pro Max',
                systemName: () => 'iOS',
                systemVersion: () => '26.0',
                model: () => 'iPhone 16 Pro Max',
                isPhone: () => true,
                isPad: () => false,
                screenSize: () => new MockSize(440, 956),
                screenResolution: () => new MockSize(1320, 2868),
                screenScale: () => 3,
                screenBrightness: () => 0.72,
                isInPortrait: () => true,
                isInPortraitUpsideDown: () => false,
                isInLandscapeLeft: () => false,
                isInLandscapeRight: () => false,
                isFaceUp: () => true,
                isFaceDown: () => false,
                batteryLevel: () => 0.86,
                isDischarging: () => true,
                isCharging: () => false,
                isFullyCharged: () => false,
                preferredLanguages: () => [preferredLocale, 'en-US'],
                locale: () => preferredLocale,
                language: () => preferredLocale.split('-')[0],
                isUsingDarkAppearance: () => isDarkAppearance,
                volume: () => 0.42,
                setScreenBrightness: ScriptableMock.noop,
            },
        }
    })
})()
