# Scriptable API Index

Source: https://docs.scriptable.app/
Fetched: 2026-05-31T00:50:52.3003527+08:00

## Scriptable Docs
- URL: https://docs.scriptable.app/
- Local: site/index.html
- JavaScript Environment
- Learning JavaScript
- Community

## Alert
- URL: https://docs.scriptable.app/alert/
- Local: site/alert/index.html
- title - `title: string`
- message - `message: string`
- -new Alert - `new Alert()`
- -addAction - `addAction(title: string)`
- -addDestructiveAction - `addDestructiveAction(title: string)`
- -addCancelAction - `addCancelAction(title: string)`
- -addTextField - `addTextField(placeholder: string, text: string): TextField`
- -addSecureTextField - `addSecureTextField(placeholder: string, text: string): TextField`
- -textFieldValue - `textFieldValue(index: number): string`
- -present - `present(): Promise<number>`
- -presentAlert - `presentAlert(): Promise<number>`
- -presentSheet - `presentSheet(): Promise<number>`

## args
- URL: https://docs.scriptable.app/args/
- Local: site/args/index.html
- length - `length: number`
- all - `all: [any]`
- plainTexts - `plainTexts: [string]`
- urls - `urls: [string]`
- fileURLs - `fileURLs: [string]`
- images - `images: [Image]`
- queryParameters - `queryParameters: {string: string}`
- siriShortcutArguments - `args.shortcutParameter`
- shortcutParameter - `args.shortcutParameter`
- widgetParameter - `args.widgetParameter`
- notification - `userInfo`

## Calendar
- URL: https://docs.scriptable.app/calendar/
- Local: site/calendar/index.html
- identifier - `identifier: string`
- title - `title: string`
- isSubscribed - `isSubscribed: bool`
- allowsContentModifications - `allowsContentModifications: bool`
- color - `color: Color`
- -supportsAvailability - `supportsAvailability(availability: string): bool`
- -save - `save()`
- -remove - `remove()`
- +forReminders - `static forReminders(): Promise<[Calendar]>`
- +forEvents - `static forEvents(): Promise<[Calendar]>`
- +forRemindersByTitle - `static forRemindersByTitle(title: string): Promise<Calendar>`
- +forEventsByTitle - `static forEventsByTitle(title: string): Promise<Calendar>`
- +createForReminders - `static createForReminders(title: string): Promise<Calendar>`
- +findOrCreateForReminders - `static findOrCreateForReminders(title: string): Promise<Calendar>`
- +defaultForReminders - `static defaultForReminders(): Promise<Calendar>`
- +defaultForEvents - `static defaultForEvents(): Promise<Calendar>`
- +presentPicker - `static presentPicker(allowMultiple: bool): Promise<[Calendar]>`

## CalendarEvent
- URL: https://docs.scriptable.app/calendarevent/
- Local: site/calendarevent/index.html
- identifier - `identifier: string`
- title - `title: string`
- location - `location: string`
- notes - `notes: string`
- startDate - `startDate: Date`
- endDate - `endDate: Date`
- isAllDay - `isAllDay: bool`
- attendees - `{ "isCurrentUser": false, "name": "John Appleseed", "status": "accepted", "type": "person", "role": "required" }`
- availability - `Calendar.supportsAvailability()`
- timeZone - `timeZone: string`
- calendar - `calendar: Calendar`
- -new CalendarEvent - `new CalendarEvent()`
- -addRecurrenceRule - `addRecurrenceRule(recurrenceRule: RecurrenceRule)`
- -removeAllRecurrenceRules - `removeAllRecurrenceRules()`
- -save - `save()`
- -remove - `remove()`
- -presentEdit - `presentEdit(): Promise<CalendarEvent>`
- +presentCreate - `static presentCreate(): Promise<CalendarEvent>`
- +today - `static today(calendars: [Calendar]): Promise<[CalendarEvent]>`
- +tomorrow - `static tomorrow(calendars: [Calendar]): Promise<[CalendarEvent]>`
- +yesterday - `static yesterday(calendars: [Calendar]): Promise<[CalendarEvent]>`
- +thisWeek - `static thisWeek(calendars: [Calendar]): Promise<[CalendarEvent]>`
- +nextWeek - `static nextWeek(calendars: [Calendar]): Promise<[CalendarEvent]>`
- +lastWeek - `static lastWeek(calendars: [Calendar]): Promise<[CalendarEvent]>`
- +between - `static between(startDate: Date, endDate: Date, calendars: [Calendar]): Promise<[CalendarEvent]>`

## CallbackURL
- URL: https://docs.scriptable.app/callbackurl/
- Local: site/callbackurl/index.html
- -new CallbackURL - `new CallbackURL(baseURL: string)`
- -addParameter - `addParameter(name: string, value: string)`
- -open - `open(): Promise<{string: string}>`
- -getURL - `getURL(): string`

## Color
- URL: https://docs.scriptable.app/color/
- Local: site/color/index.html
- hex - `hex: string`
- red - `red: number`
- green - `green: number`
- blue - `blue: number`
- alpha - `alpha: number`
- +black - `static black(): Color`
- +darkGray - `static darkGray(): Color`
- +lightGray - `static lightGray(): Color`
- +white - `static white(): Color`
- +gray - `static gray(): Color`
- +red - `static red(): Color`
- +green - `static green(): Color`
- +blue - `static blue(): Color`
- +cyan - `static cyan(): Color`
- +yellow - `static yellow(): Color`
- +magenta - `static magenta(): Color`
- +orange - `static orange(): Color`
- +purple - `static purple(): Color`
- +brown - `static brown(): Color`
- +clear - `static clear(): Color`
- -new Color - `new Color(hex: string, alpha: number)`
- +dynamic - `static dynamic(lightColor: Color, darkColor: Color): Color`

## config
- URL: https://docs.scriptable.app/config/
- Local: site/config/index.html
- runsInApp - `runsInApp: bool`
- runsInActionExtension - `runsInActionExtension: bool`
- runsWithSiri - `runsWithSiri: bool`
- runsInWidget - `runsInWidget: bool`
- runsInAccessoryWidget - `runsInAccessoryWidget: bool`
- runsInNotification - `runsInNotification: bool`
- runsFromHomeScreen - `runsFromHomeScreen: bool`
- widgetFamily - `small`

## console
- URL: https://docs.scriptable.app/console/
- Local: site/console/index.html
- +log - `static log(message: any)`
- +warn - `static warn(message: any)`
- +error - `static error(message: any)`
- +logError - `static logError(message: any)`

## Contact
- URL: https://docs.scriptable.app/contact/
- Local: site/contact/index.html
- identifier - `identifier: string`
- namePrefix - `namePrefix: string`
- givenName - `givenName: string`
- middleName - `middleName: string`
- familyName - `familyName: string`
- nickname - `nickname: string`
- birthday - `birthday: Date`
- image - `image: Image`
- emailAddresses - `{ "identifier": "UUID-ABC-123", "label": "Home", "localizedLabel": "Home", "value": "my@example.com" }`
- phoneNumbers - `{ "identifier": "UUID-ABC-123", "label": "Home", "localizedLabel": "Home", "value": "(111)234-5678" }`
- postalAddresses - `{ "identifier": "UUID-ABC-123", "label": "Home", "localizedLabel": "Home", "street": "240 Terry Lane", "city": "New York", "state": "New York", "postalCode": "10001", "country": "United States of America" }`
- socialProfiles - `{ "identifier": "UUID-ABC-123", "label": "Twitter", "localizedLabel": "Twitter", "service": "Twitter", "url": "https://twitter.com/scriptableapp", "userIdentifier": null, "username": "scriptableapp" }`
- note - `note: string`
- urlAddresses - `urlAddresses: [{string: string}]`
- dates - `dates: [{string: any}]`
- organizationName - `organizationName: string`
- departmentName - `departmentName: string`
- jobTitle - `jobTitle: string`
- isNamePrefixAvailable - `namePrefix`
- isGiveNameAvailable - `givenName`
- isMiddleNameAvailable - `middleName`
- isFamilyNameAvailable - `familyName`
- isNicknameAvailable - `nickname`
- isBirthdayAvailable - `birthday`
- isEmailAddressesAvailable - `emailAddresses`
- isPhoneNumbersAvailable - `phoneNumbers`
- isPostalAddressesAvailable - `postalAddresses`
- isSocialProfilesAvailable - `socialProfiles`
- isImageAvailable - `image`
- isNoteAvailable - `note`
- isURLAddressesAvailable - `urlAddresses`
- isOrganizationNameAvailable - `organizationName`
- isDepartmentNameAvailable - `departmentName`
- isJobTitleAvailable - `jobTitle`
- isDatesAvailable - `date`
- -new Contact - `new Contact()`
- +all - `static all(containers: [ContactsContainer]): Promise<[Contact]>`
- +inGroups - `static inGroups(groups: [ContactsGroup]): Promise<[Contact]>`
- +add - `static add(contact: Contact, containerIdentifier: string)`
- +update - `static update(contact: Contact)`
- +delete - `static delete(contact: Contact)`
- +persistChanges - `static persistChanges(): Promise`

## ContactsContainer
- URL: https://docs.scriptable.app/contactscontainer/
- Local: site/contactscontainer/index.html
- identifier - `identifier: string`
- name - `name: string`
- +default - `static default(): Promise<ContactsContainer>`
- +all - `static all(): Promise<[ContactsContainer]>`
- +withIdentifier - `static withIdentifier(identifier: string): Promise<ContactsContainer>`

## ContactsGroup
- URL: https://docs.scriptable.app/contactsgroup/
- Local: site/contactsgroup/index.html
- identifier - `identifier: string`
- name - `name: string`
- -new ContactsGroup - `new ContactsGroup()`
- +all - `static all(containers: [ContactsContainer]): Promise<[ContactsGroup]>`
- -addMember - `addMember(contact: Contact)`
- -removeMember - `removeMember(contact: Contact)`
- +add - `static add(group: ContactsGroup, containerIdentifier: string)`
- +update - `static update(group: ContactsGroup)`
- +delete - `static delete(group: ContactsGroup)`

## Data
- URL: https://docs.scriptable.app/data/
- Local: site/data/index.html
- +fromString - `static fromString(string: string): Data`
- +fromFile - `static fromFile(filePath: string): Data`
- +fromBase64String - `static fromBase64String(base64String: string): Data`
- +fromJPEG - `static fromJPEG(image: Image): Data`
- +fromPNG - `static fromPNG(image: Image): Data`
- +fromBytes - `static fromBytes(bytes: [number]): Data`
- -toRawString - `toRawString(): string`
- -toBase64String - `toBase64String(): string`
- -getBytes - `getBytes(): [number]`

## DateFormatter
- URL: https://docs.scriptable.app/dateformatter/
- Local: site/dateformatter/index.html
- dateFormat - `useMediumDateStyle()`
- locale - `locale: string`
- -new DateFormatter - `new DateFormatter()`
- -string - `string(date: Date): string`
- -date - `date(str: string): Date`
- -useNoDateStyle - `useNoDateStyle()`
- -useShortDateStyle - `useShortDateStyle()`
- -useMediumDateStyle - `useMediumDateStyle()`
- -useLongDateStyle - `useLongDateStyle()`
- -useFullDateStyle - `useFullDateStyle()`
- -useNoTimeStyle - `useNoTimeStyle()`
- -useShortTimeStyle - `useShortTimeStyle()`
- -useMediumTimeStyle - `useMediumTimeStyle()`
- -useLongTimeStyle - `useLongTimeStyle()`
- -useFullTimeStyle - `useFullTimeStyle()`

## DatePicker
- URL: https://docs.scriptable.app/datepicker/
- Local: site/datepicker/index.html
- minimumDate - `minimumDate: Date`
- maximumDate - `maximumDate: Date`
- countdownDuration - `pickCountDownDuration()`
- minuteInterval - `minuteInterval: number`
- initialDate - `pickTime()`
- -new DatePicker - `new DatePicker()`
- -pickTime - `pickTime(): Promise<Date>`
- -pickDate - `pickDate(): Promise<Date>`
- -pickDateAndTime - `pickDateAndTime(): Promise<Date>`
- -pickCountdownDuration - `pickCountdownDuration(): Promise<number>`

## Device
- URL: https://docs.scriptable.app/device/
- Local: site/device/index.html
- +name - `static name(): string`
- +systemName - `static systemName(): string`
- +systemVersion - `static systemVersion(): string`
- +model - `static model(): string`
- +isPhone - `static isPhone(): bool`
- +isPad - `static isPad(): bool`
- +screenSize - `static screenSize(): Size`
- +screenResolution - `static screenResolution(): Size`
- +screenScale - `static screenScale(): number`
- +screenBrightness - `static screenBrightness(): number`
- +isInPortrait - `static isInPortrait(): bool`
- +isInPortraitUpsideDown - `static isInPortraitUpsideDown(): bool`
- +isInLandscapeLeft - `static isInLandscapeLeft(): bool`
- +isInLandscapeRight - `static isInLandscapeRight(): bool`
- +isFaceUp - `static isFaceUp(): bool`
- +isFaceDown - `static isFaceDown(): bool`
- +batteryLevel - `static batteryLevel(): number`
- +isDischarging - `static isDischarging(): bool`
- +isCharging - `static isCharging(): bool`
- +isFullyCharged - `static isFullyCharged(): bool`
- +preferredLanguages - `static preferredLanguages(): [string]`
- +locale - `static locale(): string`
- +language - `static language(): string`
- +isUsingDarkAppearance - `static isUsingDarkAppearance(): bool`
- +volume - `static volume(): number`
- +setScreenBrightness - `static setScreenBrightness(percentage: number)`

## Dictation
- URL: https://docs.scriptable.app/dictation/
- Local: site/dictation/index.html
- +start - `static start(locale: string): Promise<string>`

## DocumentPicker
- URL: https://docs.scriptable.app/documentpicker/
- Local: site/documentpicker/index.html
- +open - `static open(types: [string]): Promise<[string]>`
- +openFile - `static openFile(): Promise<string>`
- +openFolder - `static openFolder(): Promise<string>`
- +export - `static export(path: string): Promise<[string]>`
- +exportString - `static exportString(content: string, name: string): Promise<[string]>`
- +exportImage - `static exportImage(image: Image, name: string): Promise<[string]>`
- +exportData - `static exportData(data: Data, name: string): Promise<[string]>`

## DrawContext
- URL: https://docs.scriptable.app/drawcontext/
- Local: site/drawcontext/index.html
- size - `size: Size`
- respectScreenScale - `respectScreenScale: bool`
- opaque - `opaque: bool`
- -new DrawContext - `new DrawContext()`
- -getImage - `getImage(): Image`
- -drawImageInRect - `drawImageInRect(image: Image, rect: Rect)`
- -drawImageAtPoint - `drawImageAtPoint(image: Image, point: Point)`
- -setFillColor - `setFillColor(color: Color)`
- -setStrokeColor - `setStrokeColor(color: Color)`
- -setLineWidth - `setLineWidth(width: number)`
- -fill - `fill(rect: Rect)`
- -fillRect - `fillRect(rect: Rect)`
- -fillEllipse - `fillEllipse(rect: Rect)`
- -stroke - `stroke(rect: Rect)`
- -strokeRect - `strokeRect(rect: Rect)`
- -strokeEllipse - `strokeEllipse(rect: Rect)`
- -addPath - `addPath(path: Path)`
- -strokePath - `strokePath()`
- -fillPath - `fillPath()`
- -drawText - `drawText(text: string, pos: Point)`
- -drawTextInRect - `drawTextInRect(text: string, rect: Rect)`
- -setFontSize - `setFontSize(size: number)`
- -setFont - `setFont(font: Font)`
- -setTextColor - `setTextColor(color: Color)`
- -setTextAlignedLeft - `setTextAlignedLeft()`
- -setTextAlignedCenter - `setTextAlignedCenter()`
- -setTextAlignedRight - `setTextAlignedRight()`

## FileManager
- URL: https://docs.scriptable.app/filemanager/
- Local: site/filemanager/index.html
- +local - `static local(): FileManager`
- +iCloud - `static iCloud(): FileManager`
- -read - `read(filePath: string): Data`
- -readString - `readString(filePath: string): string`
- -readImage - `readImage(filePath: string): Image`
- -write - `write(filePath: string, content: Data)`
- -writeString - `writeString(filePath: string, content: string)`
- -writeImage - `writeImage(filePath: string, image: Image)`
- -remove - `remove(filePath: string)`
- -move - `move(sourceFilePath: string, destinationFilePath: string)`
- -copy - `copy(sourceFilePath: string, destinationFilePath: string)`
- -fileExists - `fileExists(filePath: string): bool`
- -isDirectory - `isDirectory(path: string): bool`
- -createDirectory - `createDirectory(path: string, intermediateDirectories: bool)`
- -temporaryDirectory - `temporaryDirectory(): string`
- -cacheDirectory - `cacheDirectory(): string`
- -documentsDirectory - `documentsDirectory(): string`
- -libraryDirectory - `libraryDirectory(): string`
- -joinPath - `joinPath(lhsPath: string, rhsPath: string): string`
- -allTags - `allTags(filePath: string): [string]`
- -addTag - `addTag(filePath: string, tag: string)`
- -removeTag - `removeTag(filePath: string, tag: string)`
- -readExtendedAttribute - `readExtendedAttribute(filePath: string, name: string): string`
- -writeExtendedAttribute - `writeExtendedAttribute(filePath: string, value: string, name: string)`
- -removeExtendedAttribute - `removeExtendedAttribute(filePath: string, name: string)`
- -allExtendedAttributes - `allExtendedAttributes(filePath: string): [string]`
- -getUTI - `getUTI(filePath: string): string`
- -listContents - `listContents(directoryPath: string): [string]`
- -fileName - `fileName(filePath: string, includeFileExtension: bool): string`
- -fileExtension - `fileExtension(filePath: string): string`
- -bookmarkedPath - `bookmarkedPath(name: string): string`
- -bookmarkExists - `bookmarkExists(name: string): bool`
- -downloadFileFromiCloud - `downloadFileFromiCloud(filePath: string): Promise`
- -isFileStoredIniCloud - `isFileStoredIniCloud(filePath: string): bool`
- -isFileDownloaded - `isFileDownloaded(filePath: string): bool`
- -creationDate - `creationDate(filePath: string): Date`
- -modificationDate - `modificationDate(filePath: string): Date`
- -fileSize - `fileSize(filePath: string): number`
- -allFileBookmarks - `allFileBookmarks(): [{string: string}]`

## Font
- URL: https://docs.scriptable.app/font/
- Local: site/font/index.html
- -new Font - `new Font(name: string, size: number)`
- +largeTitle - `static largeTitle(): Font`
- +title1 - `static title1(): Font`
- +title2 - `static title2(): Font`
- +title3 - `static title3(): Font`
- +headline - `static headline(): Font`
- +subheadline - `static subheadline(): Font`
- +body - `static body(): Font`
- +callout - `static callout(): Font`
- +footnote - `static footnote(): Font`
- +caption1 - `static caption1(): Font`
- +caption2 - `static caption2(): Font`
- +systemFont - `static systemFont(size: number): Font`
- +ultraLightSystemFont - `static ultraLightSystemFont(size: number): Font`
- +thinSystemFont - `static thinSystemFont(size: number): Font`
- +lightSystemFont - `static lightSystemFont(size: number): Font`
- +regularSystemFont - `static regularSystemFont(size: number): Font`
- +mediumSystemFont - `static mediumSystemFont(size: number): Font`
- +semiboldSystemFont - `static semiboldSystemFont(size: number): Font`
- +boldSystemFont - `static boldSystemFont(size: number): Font`
- +heavySystemFont - `static heavySystemFont(size: number): Font`
- +blackSystemFont - `static blackSystemFont(size: number): Font`
- +italicSystemFont - `static italicSystemFont(size: number): Font`
- +ultraLightMonospacedSystemFont - `static ultraLightMonospacedSystemFont(size: number): Font`
- +thinMonospacedSystemFont - `static thinMonospacedSystemFont(size: number): Font`
- +lightMonospacedSystemFont - `static lightMonospacedSystemFont(size: number): Font`
- +regularMonospacedSystemFont - `static regularMonospacedSystemFont(size: number): Font`
- +mediumMonospacedSystemFont - `static mediumMonospacedSystemFont(size: number): Font`
- +semiboldMonospacedSystemFont - `static semiboldMonospacedSystemFont(size: number): Font`
- +boldMonospacedSystemFont - `static boldMonospacedSystemFont(size: number): Font`
- +heavyMonospacedSystemFont - `static heavyMonospacedSystemFont(size: number): Font`
- +blackMonospacedSystemFont - `static blackMonospacedSystemFont(size: number): Font`
- +ultraLightRoundedSystemFont - `static ultraLightRoundedSystemFont(size: number): Font`
- +thinRoundedSystemFont - `static thinRoundedSystemFont(size: number): Font`
- +lightRoundedSystemFont - `static lightRoundedSystemFont(size: number): Font`
- +regularRoundedSystemFont - `static regularRoundedSystemFont(size: number): Font`
- +mediumRoundedSystemFont - `static mediumRoundedSystemFont(size: number): Font`
- +semiboldRoundedSystemFont - `static semiboldRoundedSystemFont(size: number): Font`
- +boldRoundedSystemFont - `static boldRoundedSystemFont(size: number): Font`
- +heavyRoundedSystemFont - `static heavyRoundedSystemFont(size: number): Font`
- +blackRoundedSystemFont - `static blackRoundedSystemFont(size: number): Font`

## Image
- URL: https://docs.scriptable.app/image/
- Local: site/image/index.html
- size - `size: Size`
- +fromFile - `static fromFile(filePath: string): Image`
- +fromData - `static fromData(data: Data): Image`

## importModule
- URL: https://docs.scriptable.app/importmodule/
- Local: site/importmodule/index.html
- Parameters

## Keychain
- URL: https://docs.scriptable.app/keychain/
- Local: site/keychain/index.html
- +contains - `static contains(key: string): bool`
- +set - `static set(key: string, value: string)`
- +get - `static get(key: string): string`
- +remove - `static remove(key: string)`

## LinearGradient
- URL: https://docs.scriptable.app/lineargradient/
- Local: site/lineargradient/index.html
- colors - `locations`
- locations - `colors`
- startPoint - `endPoint`
- endPoint - `endPoint`
- -new LinearGradient - `new LinearGradient()`

## ListWidget
- URL: https://docs.scriptable.app/listwidget/
- Local: site/listwidget/index.html
- backgroundColor - `backgroundColor: Color`
- backgroundImage - `backgroundImage: Image`
- backgroundGradient - `backgroundGradient: LinearGradient`
- addAccessoryWidgetBackground - `addAccessoryWidgetBackground: bool`
- spacing - `addSpacer()`
- url - `url: string`
- refreshAfterDate - `null`
- -new ListWidget - `new ListWidget()`
- -addText - `addText(text: string): WidgetText`
- -addDate - `addDate(date: Date): WidgetDate`
- -addImage - `addImage(image: Image): WidgetImage`
- -addSpacer - `addSpacer(length: number): WidgetSpacer`
- -addStack - `addStack(): WidgetStack`
- -setPadding - `setPadding(top: number, leading: number, bottom: number, trailing: number)`
- -useDefaultPadding - `useDefaultPadding()`
- -presentSmall - `presentSmall(): Promise`
- -presentMedium - `presentMedium(): Promise`
- -presentLarge - `presentLarge(): Promise`
- -presentExtraLarge - `presentExtraLarge(): Promise`
- -presentAccessoryInline - `presentAccessoryInline(): Promise`
- -presentAccessoryCircular - `presentAccessoryCircular(): Promise`
- -presentAccessoryRectangular - `presentAccessoryRectangular(): Promise`

## Location
- URL: https://docs.scriptable.app/location/
- Local: site/location/index.html
- +current - `static current(): Promise<{string: number}>`
- +setAccuracyToBest - `static setAccuracyToBest()`
- +setAccuracyToTenMeters - `static setAccuracyToTenMeters()`
- +setAccuracyToHundredMeters - `static setAccuracyToHundredMeters()`
- +setAccuracyToKilometer - `static setAccuracyToKilometer()`
- +setAccuracyToThreeKilometers - `static setAccuracyToThreeKilometers()`
- +reverseGeocode - `static reverseGeocode(latitude: number, longitude: number, locale: string): [{string: any}]`

## Mail
- URL: https://docs.scriptable.app/mail/
- Local: site/mail/index.html
- toRecipients - `toRecipients: [string]`
- ccRecipients - `ccRecipients: [string]`
- bccRecipients - `bccRecipients: [string]`
- subject - `subject: string`
- body - `body: string`
- isBodyHTML - `isBodyHTML: bool`
- preferredSendingEmailAddress - `preferredSendingEmailAddress: string`
- -new Mail - `new Mail()`
- -send - `send(): Promise`
- -addImageAttachment - `addImageAttachment(image: Image)`
- -addFileAttachment - `addFileAttachment(filePath: string)`
- -addDataAttachment - `addDataAttachment(data: Data, mimeType: string, filename: string)`

## Message
- URL: https://docs.scriptable.app/message/
- Local: site/message/index.html
- recipients - `recipients: [string]`
- body - `body: string`
- -new Message - `new Message()`
- -send - `send(): Promise`
- -addImageAttachment - `addImageAttachment(image: Image)`
- -addFileAttachment - `addFileAttachment(filePath: string)`
- -addDataAttachment - `addDataAttachment(data: Data, uti: string, filename: string)`

## module
- URL: https://docs.scriptable.app/module/
- Local: site/module/index.html
- filename - `filename: string`
- exports - `exports`

## Notification
- URL: https://docs.scriptable.app/notification/
- Local: site/notification/index.html
- identifier - `identifier: string`
- title - `title: string`
- subtitle - `subtitle: string`
- body - `body: string`
- preferredContentHeight - `scriptName`
- badge - `badge: number`
- threadIdentifier - `threadIdentifier: string`
- userInfo - `Notification.opened`
- sound - `sound: string`
- openURL - `openURL: string`
- deliveryDate - `Notification.allDelivered()`
- nextTriggerDate - `setTriggerDate`
- scriptName - `scriptName`
- actions - `{ "title": "Open Website", "url": "https://scriptable.app" }`
- +current - `static current(): Notification`
- -new Notification - `new Notification()`
- -schedule - `schedule(): Promise`
- -remove - `remove(): Promise`
- -setTriggerDate - `setTriggerDate(date: Date)`
- -setDailyTrigger - `setDailyTrigger(hour: number, minute: number, repeats: bool)`
- -setWeeklyTrigger - `setWeeklyTrigger(weekday: number, hour: number, minute: number, repeats: bool)`
- -addAction - `addAction(title: string, url: string, destructive: bool)`
- +allPending - `static allPending(): Promise<[Notification]>`
- +allDelivered - `static allDelivered(): Promise<[Notification]>`
- +removeAllPending - `static removeAllPending(): Promise`
- +removeAllDelivered - `static removeAllDelivered(): Promise`
- +removePending - `static removePending(identifiers: [string]): Promise`
- +removeDelivered - `static removeDelivered(identifiers: [string]): Promise`
- +resetCurrent - `static resetCurrent()`

## Pasteboard
- URL: https://docs.scriptable.app/pasteboard/
- Local: site/pasteboard/index.html
- +copy - `static copy(string: string)`
- +paste - `static paste(): string`
- +copyString - `static copyString(string: string)`
- +pasteString - `static pasteString(): string`
- +copyImage - `static copyImage(image: Image)`
- +pasteImage - `static pasteImage(): Image`

## Path
- URL: https://docs.scriptable.app/path/
- Local: site/path/index.html
- -new Path - `new Path()`
- -move - `move(point: Point)`
- -addLine - `addLine(point: Point)`
- -addRect - `addRect(rect: Rect)`
- -addEllipse - `addEllipse(rect: Rect)`
- -addRoundedRect - `addRoundedRect(rect: Rect, cornerWidth: number, cornerHeight: number)`
- -addCurve - `addCurve(point: Point, control1: Point, control2: Point)`
- -addQuadCurve - `addQuadCurve(point: Point, control: Point)`
- -addLines - `addLines(points: [Point])`
- -addRects - `addRects(rects: [Rect])`
- -closeSubpath - `closeSubpath()`

## Photos
- URL: https://docs.scriptable.app/photos/
- Local: site/photos/index.html
- +fromLibrary - `static fromLibrary(): Promise<Image>`
- +fromCamera - `static fromCamera(): Promise<Image>`
- +latestPhoto - `static latestPhoto(): Promise<Image>`
- +latestPhotos - `static latestPhotos(count: number): Promise<[Image]>`
- +latestScreenshot - `static latestScreenshot(): Promise<Image>`
- +latestScreenshots - `static latestScreenshots(count: number): Promise<[Image]>`
- +removeLatestPhoto - `static removeLatestPhoto()`
- +removeLatestPhotos - `static removeLatestPhotos(count: number)`
- +removeLatestScreenshot - `static removeLatestScreenshot()`
- +removeLatestScreenshots - `static removeLatestScreenshots(count: number)`
- +save - `static save(image: Image)`

## Point
- URL: https://docs.scriptable.app/point/
- Local: site/point/index.html
- x - `x: number`
- y - `y: number`
- -new Point - `new Point(x: number, y: number)`

## QuickLook
- URL: https://docs.scriptable.app/quicklook/
- Local: site/quicklook/index.html
- +present - `static present(item: any, fullscreen: bool): Promise`

## Rect
- URL: https://docs.scriptable.app/rect/
- Local: site/rect/index.html
- minX - `minX: number`
- minY - `minY: number`
- maxX - `maxX: number`
- maxY - `maxY: number`
- x - `x: number`
- y - `y: number`
- width - `width: number`
- height - `height: number`
- origin - `origin: Point`
- size - `size: Size`
- -new Rect - `new Rect(x: number, y: number, width: number, height: number)`

## RecurrenceRule
- URL: https://docs.scriptable.app/recurrencerule/
- Local: site/recurrencerule/index.html
- +daily - `static daily(interval: number): RecurrenceRule`
- +dailyEndDate - `static dailyEndDate(interval: number, endDate: Date): RecurrenceRule`
- +dailyOccurrenceCount - `static dailyOccurrenceCount(interval: number, occurrenceCount: number): RecurrenceRule`
- +weekly - `static weekly(interval: number): RecurrenceRule`
- +weeklyEndDate - `static weeklyEndDate(interval: number, endDate: Date): RecurrenceRule`
- +weeklyOccurrenceCount - `static weeklyOccurrenceCount(interval: number, occurrenceCount: number): RecurrenceRule`
- +monthly - `static monthly(interval: number): RecurrenceRule`
- +monthlyEndDate - `static monthlyEndDate(interval: number, endDate: Date): RecurrenceRule`
- +monthlyOccurrenceCount - `static monthlyOccurrenceCount(interval: number, occurrenceCount: number): RecurrenceRule`
- +yearly - `static yearly(interval: number): RecurrenceRule`
- +yearlyEndDate - `static yearlyEndDate(interval: number, endDate: Date): RecurrenceRule`
- +yearlyOccurrenceCount - `static yearlyOccurrenceCount(interval: number, occurrenceCount: number): RecurrenceRule`
- +complexWeekly - `static complexWeekly(interval: number, daysOfTheWeek: [number], setPositions: [number]): RecurrenceRule`
- +complexWeeklyEndDate - `static complexWeeklyEndDate(interval: number, daysOfTheWeek: [number], setPositions: [number], endDate: Date): RecurrenceRule`
- +complexWeeklyOccurrenceCount - `static complexWeeklyOccurrenceCount(interval: number, daysOfTheWeek: [number], setPositions: [number], occurrenceCount: number): RecurrenceRule`
- +complexMonthly - `static complexMonthly(interval: number, daysOfTheWeek: [number], daysOfTheMonth: [number], setPositions: [number]): RecurrenceRule`
- +complexMonthlyEndDate - `static complexMonthlyEndDate(interval: number, daysOfTheWeek: [number], daysOfTheMonth: [number], setPositions: [number], endDate: Date): RecurrenceRule`
- +complexMonthlyOccurrenceCount - `static complexMonthlyOccurrenceCount(interval: number, daysOfTheWeek: [number], daysOfTheMonth: [number], setPositions: [number], occurrenceCount: number): RecurrenceRule`
- +complexYearly - `static complexYearly(interval: number, daysOfTheWeek: [number], monthsOfTheYear: [number], weeksOfTheYear: [number], daysOfTheYear: [number], setPositions: [number]): RecurrenceRule`
- +complexYearlyEndDate - `static complexYearlyEndDate(interval: number, daysOfTheWeek: [number], monthsOfTheYear: [number], weeksOfTheYear: [number], daysOfTheYear: [number], setPositions: [number], endDate: Date): RecurrenceRule`
- +complexYearlyOccurrenceCount - `static complexYearlyOccurrenceCount(interval: number, daysOfTheWeek: [number], monthsOfTheYear: [number], weeksOfTheYear: [number], daysOfTheYear: [number], setPositions: [number], occurrenceCount: number): RecurrenceRule`

## RelativeDateTimeFormatter
- URL: https://docs.scriptable.app/relativedatetimeformatter/
- Local: site/relativedatetimeformatter/index.html
- locale - `locale: string`
- -new RelativeDateTimeFormatter - `new RelativeDateTimeFormatter()`
- -string - `string(date: Date, referenceDate: Date): string`
- -useNamedDateTimeStyle - `useNamedDateTimeStyle()`
- -useNumericDateTimeStyle - `useNumericDateTimeStyle()`

## Reminder
- URL: https://docs.scriptable.app/reminder/
- Local: site/reminder/index.html
- identifier - `identifier: string`
- title - `title: string`
- notes - `notes: string`
- isCompleted - `isCompleted: bool`
- isOverdue - `isOverdue: bool`
- priority - `priority: number`
- dueDate - `dueDate: Date`
- dueDateIncludesTime - `dueDate`
- completionDate - `completionDate: Date`
- creationDate - `creationDate: Date`
- calendar - `calendar: Calendar`
- -new Reminder - `new Reminder()`
- -addRecurrenceRule - `addRecurrenceRule(recurrenceRule: RecurrenceRule)`
- -removeAllRecurrenceRules - `removeAllRecurrenceRules()`
- -save - `save()`
- -remove - `remove()`
- +scheduled - `static scheduled(calendars: [Calendar]): Promise<[Reminder]>`
- +all - `static all(calendars: [Calendar]): Promise<[Reminder]>`
- +allCompleted - `static allCompleted(calendars: [Calendar]): Promise<[Reminder]>`
- +allIncomplete - `static allIncomplete(calendars: [Calendar]): Promise<[Reminder]>`
- +allDueToday - `static allDueToday(calendars: [Calendar]): Promise<[Reminder]>`
- +completedDueToday - `static completedDueToday(calendars: [Calendar]): Promise<[Reminder]>`
- +incompleteDueToday - `static incompleteDueToday(calendars: [Calendar]): Promise<[Reminder]>`
- +allDueTomorrow - `static allDueTomorrow(calendars: [Calendar]): Promise<[Reminder]>`
- +completedDueTomorrow - `static completedDueTomorrow(calendars: [Calendar]): Promise<[Reminder]>`
- +incompleteDueTomorrow - `static incompleteDueTomorrow(calendars: [Calendar]): Promise<[Reminder]>`
- +allDueYesterday - `static allDueYesterday(calendars: [Calendar]): Promise<[Reminder]>`
- +completedDueYesterday - `static completedDueYesterday(calendars: [Calendar]): Promise<[Reminder]>`
- +incompleteDueYesterday - `static incompleteDueYesterday(calendars: [Calendar]): Promise<[Reminder]>`
- +allDueThisWeek - `static allDueThisWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +completedDueThisWeek - `static completedDueThisWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +incompleteDueThisWeek - `static incompleteDueThisWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +allDueNextWeek - `static allDueNextWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +completedDueNextWeek - `static completedDueNextWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +incompleteDueNextWeek - `static incompleteDueNextWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +allDueLastWeek - `static allDueLastWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +completedDueLastWeek - `static completedDueLastWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +incompleteDueLastWeek - `static incompleteDueLastWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +completedToday - `static completedToday(calendars: [Calendar]): Promise<[Reminder]>`
- +completedThisWeek - `static completedThisWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +completedLastWeek - `static completedLastWeek(calendars: [Calendar]): Promise<[Reminder]>`
- +allDueBetween - `static allDueBetween(startDate: Date, endDate: Date, calendars: [Calendar]): Promise<[Reminder]>`
- +completedDueBetween - `static completedDueBetween(startDate: Date, endDate: Date, calendars: [Calendar]): Promise<[Reminder]>`
- +incompleteDueBetween - `static incompleteDueBetween(startDate: Date, endDate: Date, calendars: [Calendar]): Promise<[Reminder]>`
- +completedBetween - `static completedBetween(startDate: Date, endDate: Date, calendars: [Calendar]): Promise<[Reminder]>`

## Request
- URL: https://docs.scriptable.app/request/
- Local: site/request/index.html
- url - `url: string`
- method - `method: string`
- headers - `headers: {string: string}`
- body - `addParameterToMultipart`
- timeoutInterval - `timeoutInterval: number`
- onRedirect - `onRedirect: fn(Request) -> Request`
- response - `{ "url": "https://example.com/", "statusCode": 200 "mimeType": "application/json", "textEncodingName": "utf-8", "headers": { "Content-Type": "application/json;charset=utf-8", "Content-Length": "17671" }, "cookies": [{ "path": "/", "httpOnly": true, "domain": "www.example.com", "sessionOnly": true, "name": "JSESSIONID", "value": "7616271F4878CFD05182D20C45F4CEB3" }] }`
- allowInsecureRequest - `allowInsecureRequest: bool`
- -new Request - `new Request(url: string)`
- -load - `load(): Promise<Data>`
- -loadString - `loadString(): Promise<string>`
- -loadJSON - `loadJSON(): Promise<any>`
- -loadImage - `loadImage(): Promise<Image>`
- -addParameterToMultipart - `addParameterToMultipart(name: string, value: string)`
- -addFileDataToMultipart - `addFileDataToMultipart(data: Data, mimeType: string, name: string, filename: string)`
- -addFileToMultipart - `addFileToMultipart(filePath: string, name: string, filename: string)`
- -addImageToMultipart - `addImageToMultipart(image: Image, name: string, filename: string)`

## Safari
- URL: https://docs.scriptable.app/safari/
- Local: site/safari/index.html
- +openInApp - `static openInApp(url: string, fullscreen: bool): Promise`
- +open - `static open(url: string)`

## Script
- URL: https://docs.scriptable.app/script/
- Local: site/script/index.html
- +name - `static name(): string`
- +complete - `static complete()`
- +setShortcutOutput - `static setShortcutOutput(value: any)`
- +setWidget - `static setWidget(widget: any)`

## SFSymbol
- URL: https://docs.scriptable.app/sfsymbol/
- Local: site/sfsymbol/index.html
- image - `image: Image`
- +named - `static named(symbolName: string): SFSymbol`
- -applyFont - `applyFont(font: Font)`
- -applyUltraLightWeight - `applyUltraLightWeight()`
- -applyThinWeight - `applyThinWeight()`
- -applyLightWeight - `applyLightWeight()`
- -applyRegularWeight - `applyRegularWeight()`
- -applyMediumWeight - `applyMediumWeight()`
- -applySemiboldWeight - `applySemiboldWeight()`
- -applyBoldWeight - `applyBoldWeight()`
- -applyHeavyWeight - `applyHeavyWeight()`
- -applyBlackWeight - `applyBlackWeight()`

## ShareSheet
- URL: https://docs.scriptable.app/sharesheet/
- Local: site/sharesheet/index.html
- +present - `static present(activityItems: [any]): Promise<{string: any}>`

## Size
- URL: https://docs.scriptable.app/size/
- Local: site/size/index.html
- width - `width: number`
- height - `height: number`
- -new Size - `new Size(width: number, height: number)`

## Speech
- URL: https://docs.scriptable.app/speech/
- Local: site/speech/index.html
- +speak - `static speak(text: string)`

## TextField
- URL: https://docs.scriptable.app/textfield/
- Local: site/textfield/index.html
- text - `text: string`
- placeholder - `placeholder: string`
- isSecure - `isSecure: bool`
- textColor - `textColor: Color`
- font - `font: Font`
- -setDefaultKeyboard - `setDefaultKeyboard()`
- -setNumberPadKeyboard - `setNumberPadKeyboard()`
- -setDecimalPadKeyboard - `setDecimalPadKeyboard()`
- -setNumbersAndPunctuationKeyboard - `setNumbersAndPunctuationKeyboard()`
- -setPhonePadKeyboard - `setPhonePadKeyboard()`
- -setWebSearchKeyboard - `setWebSearchKeyboard()`
- -setEmailAddressKeyboard - `setEmailAddressKeyboard()`
- -setURLKeyboard - `setURLKeyboard()`
- -setTwitterKeyboard - `setTwitterKeyboard()`
- -leftAlignText - `leftAlignText()`
- -centerAlignText - `centerAlignText()`
- -rightAlignText - `rightAlignText()`

## Timer
- URL: https://docs.scriptable.app/timer/
- Local: site/timer/index.html
- timeInterval - `timeInterval: number`
- repeats - `repeats: bool`
- -new Timer - `new Timer()`
- -schedule - `schedule(callback: fn())`
- -invalidate - `invalidate()`
- +schedule - `static schedule(timeInterval: number, repeats: bool, callback: fn()): Timer`

## UITable
- URL: https://docs.scriptable.app/uitable/
- Local: site/uitable/index.html
- showSeparators - `showSeparators: bool`
- -new UITable - `new UITable()`
- -addRow - `addRow(row: UITableRow)`
- -removeRow - `removeRow(row: UITableRow)`
- -removeAllRows - `removeAllRows()`
- -reload - `reload()`
- -present - `present(fullscreen: bool): Promise`

## UITableCell
- URL: https://docs.scriptable.app/uitablecell/
- Local: site/uitablecell/index.html
- widthWeight - `widthWeight: number`
- onTap - `onTap: fn()`
- dismissOnTap - `dismissOnTap: bool`
- titleColor - `titleColor: Color`
- subtitleColor - `subtitleColor: Color`
- titleFont - `titleFont: Font`
- subtitleFont - `subtitleFont: Font`
- +text - `static text(title: string, subtitle: string): UITableCell`
- +image - `static image(image: Image): UITableCell`
- +imageAtURL - `static imageAtURL(url: string): UITableCell`
- +button - `static button(title: string): UITableCell`
- -leftAligned - `leftAligned()`
- -centerAligned - `centerAligned()`
- -rightAligned - `rightAligned()`

## UITableRow
- URL: https://docs.scriptable.app/uitablerow/
- Local: site/uitablerow/index.html
- cellSpacing - `cellSpacing: number`
- height - `height: number`
- isHeader - `isHeader: bool`
- dismissOnSelect - `onSelect`
- onSelect - `onSelect: fn()`
- backgroundColor - `backgroundColor: Color`
- -new UITableRow - `new UITableRow()`
- -addCell - `addCell(cell: UITableCell)`
- -addText - `addText(title: string, subtitle: string): UITableCell`
- -addImage - `addImage(image: Image): UITableCell`
- -addImageAtURL - `addImageAtURL(url: string): UITableCell`
- -addButton - `addButton(title: string): UITableCell`

## URLScheme
- URL: https://docs.scriptable.app/urlscheme/
- Local: site/urlscheme/index.html
- +allParameters - `static allParameters(): {string: string}`
- +parameter - `static parameter(name: string): string`
- +forOpeningScript - `static forOpeningScript(): string`
- +forOpeningScriptSettings - `static forOpeningScriptSettings(): string`
- +forRunningScript - `static forRunningScript(): string`

## UUID
- URL: https://docs.scriptable.app/uuid/
- Local: site/uuid/index.html
- +string - `static string(): string`

## WebView
- URL: https://docs.scriptable.app/webview/
- Local: site/webview/index.html
- shouldAllowRequest - `shouldAllowRequest: fn(Request) -> bool`
- -new WebView - `new WebView()`
- +loadHTML - `static loadHTML(html: string, baseURL: string, preferredSize: Size, fullscreen: bool): Promise`
- +loadFile - `static loadFile(fileURL: string, preferredSize: Size, fullscreen: bool): Promise`
- +loadURL - `static loadURL(url: string, preferredSize: Size, fullscreen: bool): Promise`
- -loadURL - `loadURL(url: string): Promise`
- -loadRequest - `loadRequest(request: Request): Promise`
- -loadHTML - `loadHTML(html: string, baseURL: string): Promise`
- -loadFile - `loadFile(fileURL: string): Promise`
- -evaluateJavaScript - `evaluateJavaScript(javaScript: string, useCallback: bool): Promise<any>`
- -getHTML - `getHTML(): Promise<any>`
- -present - `present(fullscreen: bool): Promise`
- -waitForLoad - `waitForLoad(): Promise<any>`

## WidgetDate
- URL: https://docs.scriptable.app/widgetdate/
- Local: site/widgetdate/index.html
- date - `date: Date`
- textColor - `textColor: Color`
- font - `font: Font`
- textOpacity - `textOpacity: number`
- lineLimit - `lineLimit: number`
- minimumScaleFactor - `minimumScaleFactor: number`
- shadowColor - `shadowRadius`
- shadowRadius - `shadowRadius: number`
- shadowOffset - `shadowRadius`
- url - `url`
- -leftAlignText - `leftAlignText()`
- -centerAlignText - `centerAlignText()`
- -rightAlignText - `rightAlignText()`
- -applyTimeStyle - `applyTimeStyle()`
- -applyDateStyle - `applyDateStyle()`
- -applyRelativeStyle - `applyRelativeStyle()`
- -applyOffsetStyle - `applyOffsetStyle()`
- -applyTimerStyle - `applyTimerStyle()`

## WidgetImage
- URL: https://docs.scriptable.app/widgetimage/
- Local: site/widgetimage/index.html
- image - `image: Image`
- resizable - `resizable: bool`
- imageSize - `imageSize: Size`
- imageOpacity - `imageOpacity: number`
- cornerRadius - `containerRelativeShape`
- borderWidth - `borderWidth: number`
- borderColor - `borderColor: Color`
- containerRelativeShape - `cornerRadius`
- tintColor - `null`
- url - `url`
- -leftAlignImage - `leftAlignImage()`
- -centerAlignImage - `centerAlignImage()`
- -rightAlignImage - `rightAlignImage()`
- -applyFittingContentMode - `applyFittingContentMode()`
- -applyFillingContentMode - `applyFillingContentMode()`

## WidgetSpacer
- URL: https://docs.scriptable.app/widgetspacer/
- Local: site/widgetspacer/index.html
- length - `length: number`

## WidgetStack
- URL: https://docs.scriptable.app/widgetstack/
- Local: site/widgetstack/index.html
- backgroundColor - `backgroundColor: Color`
- backgroundImage - `backgroundImage: Image`
- backgroundGradient - `backgroundGradient: LinearGradient`
- spacing - `addSpacer()`
- size - `size: Size`
- cornerRadius - `cornerRadius: number`
- borderWidth - `borderWidth: number`
- borderColor - `borderColor: Color`
- url - `url`
- -addText - `addText(text: string): WidgetText`
- -addDate - `addDate(date: Date): WidgetDate`
- -addImage - `addImage(image: Image): WidgetImage`
- -addSpacer - `addSpacer(length: number): WidgetSpacer`
- -addStack - `addStack(): WidgetStack`
- -setPadding - `setPadding(top: number, leading: number, bottom: number, trailing: number)`
- -useDefaultPadding - `useDefaultPadding()`
- -topAlignContent - `topAlignContent()`
- -centerAlignContent - `centerAlignContent()`
- -bottomAlignContent - `bottomAlignContent()`
- -layoutHorizontally - `layoutHorizontally()`
- -layoutVertically - `layoutVertically()`

## WidgetText
- URL: https://docs.scriptable.app/widgettext/
- Local: site/widgettext/index.html
- text - `text: string`
- textColor - `textColor: Color`
- font - `font: Font`
- textOpacity - `textOpacity: number`
- lineLimit - `lineLimit: number`
- minimumScaleFactor - `minimumScaleFactor: number`
- shadowColor - `shadowRadius`
- shadowRadius - `shadowRadius: number`
- shadowOffset - `shadowRadius`
- url - `url`
- -leftAlignText - `leftAlignText()`
- -centerAlignText - `centerAlignText()`
- -rightAlignText - `rightAlignText()`

## XMLParser
- URL: https://docs.scriptable.app/xmlparser/
- Local: site/xmlparser/index.html
- didStartDocument - `didStartDocument: fn()`
- didEndDocument - `didEndDocument: fn()`
- didStartElement - `didStartElement: fn(string, {string: string})`
- didEndElement - `didEndElement: fn()`
- foundCharacters - `foundCharacters: fn()`
- parseErrorOccurred - `parseErrorOccurred: fn()`
- string - `string: string`
- -new XMLParser - `new XMLParser(string: string)`
- -parse - `parse(): bool`


