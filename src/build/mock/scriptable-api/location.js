;(function () {
    ScriptableMock.register('Location', () => {
        let accuracy = 'best'
        return {
            Location: {
                current: async () => ({
                    latitude: 31.2304,
                    longitude: 121.4737,
                    altitude: 0,
                    horizontalAccuracy: 10,
                    verticalAccuracy: 10,
                }),
                setAccuracyToBest: () => {
                    accuracy = 'best'
                },
                setAccuracyToTenMeters: () => {
                    accuracy = 'tenMeters'
                },
                setAccuracyToHundredMeters: () => {
                    accuracy = 'hundredMeters'
                },
                setAccuracyToKilometer: () => {
                    accuracy = 'kilometer'
                },
                setAccuracyToThreeKilometers: () => {
                    accuracy = 'threeKilometers'
                },
                reverseGeocode: async (latitude, longitude) => [
                    {
                        latitude,
                        longitude,
                        locality: 'Shanghai',
                        country: 'China',
                        accuracy,
                    },
                ],
            },
        }
    })
})()
