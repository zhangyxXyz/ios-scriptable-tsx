;(function () {
    ScriptableMock.register('Location', () => {
        let accuracy = 'best'
        const currentLocation = {
            latitude: 31.2304,
            longitude: 121.4737,
            altitude: 12,
            horizontalAccuracy: 8,
            verticalAccuracy: 12,
            speed: 0,
            course: -1,
            timestamp: new Date(),
        }
        function createPlacemark(latitude = currentLocation.latitude, longitude = currentLocation.longitude) {
            return {
                latitude,
                longitude,
                location: {latitude, longitude},
                name: 'People Square',
                thoroughfare: 'People Avenue',
                subThoroughfare: '100',
                locality: 'Shanghai',
                subLocality: 'Huangpu District',
                postalCode: '200003',
                administrativeArea: 'Shanghai',
                country: 'China',
                countryCode: 'CN',
                timeZone: 'Asia/Shanghai',
                isoCountryCode: 'CN',
                accuracy,
            }
        }
        return {
            Location: {
                current: async () => ({...currentLocation, timestamp: new Date()}),
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
                reverseGeocode: async (latitude, longitude) => [createPlacemark(latitude, longitude)],
                geocodeAddress: async () => [createPlacemark()],
            },
        }
    })
})()
