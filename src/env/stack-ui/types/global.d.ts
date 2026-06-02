/// <reference path="./widget/wbox.d.ts" />
/// <reference path="./widget/wdate.d.ts" />
/// <reference path="./widget/wimage.d.ts" />
/// <reference path="./widget/wspacer.d.ts" />
/// <reference path="./widget/wstack.d.ts" />
/// <reference path="./widget/wtext.d.ts" />
/// <reference path="./jsx.d.ts" />

declare const MODULE: {
    filename: string
    exports: unknown
}

declare namespace Scriptable {
    class Widget {}
}

/**
 * 注册脚本末尾等待函数，用于业务脚本模拟 top-level await。
 * env 自身构建时不会注入这个函数。
 */
declare const EndAwait: <T>(promiseFunc: () => Promise<T> | T) => void
