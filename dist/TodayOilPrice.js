// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: car;

/*
 * author   :  seiun
 * date     :  2021/10/24
 * build    :  2026-06-11 00:23:36
 * desc     :  今日油价
 * version  :  2.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 *   v2.0.0 (2025/12/21)
 *     - 更换油价查询API为52api
 *     - 优化显示布局
 *   v1.0.0 (2021/10/24)
 *     - 初始版本
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/TodayOilPrice.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, h, Utils } =
  runtimeRequire(dependencyFileName);
var Widget = class extends WidgetBase {
  constructor(arg) {
    super(arg);
    // 组件传入参数
    this.widgetParam = args.widgetParameter;
    this.widgetInitConfig = {
      tencentMapAPIKey: "@caiyun.token.tencent",
    };
    this.locationInfo = null;
    this.oilPriceInfo = null;
    this.gasStationInfo = [];
    // 组件当前设置
    this.currentSettings = {
      basicSettings: {
        tencentMapAPIKey: { val: "", type: this.settingValTypeString },
        distance2NearestGasStation: { val: 5e3, type: this.settingValTypeInt },
        oilPriceAPIKey: { val: "", type: this.settingValTypeString },
      },
      displaySettings: {
        headerBGColorHex: { val: "#000000", type: this.settingValTypeString },
        gasolineNameColorHex: {
          val: "#FC6D26",
          type: this.settingValTypeString,
        },
        dieselNameColorHex: { val: "#FF0000", type: this.settingValTypeString },
        oilPriceColorHex: {
          val: "",
          type: this.stttingValTypeStringEmptyCheck,
        },
        gasStationBGColorHex: {
          val: "#000000",
          type: this.settingValTypeString,
        },
        gasStationCarIconColorHex: {
          val: "#61AFEF",
          type: this.settingValTypeString,
        },
        gasStationAddressIconColorHex: {
          val: "#E06C75",
          type: this.settingValTypeString,
        },
        footBGColorHex: { val: "#000000", type: this.settingValTypeString },
        footLogoColorHex: { val: "#FC6D26", type: this.settingValTypeString },
        gasStationCountMedium: { val: 1, type: this.settingValTypeInt },
        gasStationCountLarge: { val: 5, type: this.settingValTypeInt },
      },
    };
    this.init = async () => {
      try {
        await this.getLocation();
        await this.getOilPrice();
        await this.getGasStation();
      } catch (e) {
        console.log(e);
      }
    };
    this.renderCommon = async (w) => {
      GenrateView.setListWidget(w);
      const oilPriceIcon = await this.storage.getImage(
        "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Application/OilPrice.png",
      );
      return /* @__PURE__ */ h(
        "wbox",
        {
          background: this.backGroundColor,
          padding: [0, 0, 0, 0],
        },
        /* @__PURE__ */ h(
          "wstack",
          {
            background:
              this.currentSettings.displaySettings.headerBGColorHex.val,
            padding: [10, 10, 10, 10],
          },
          await Promise.all(
            (this.oilPriceInfo ?? []).map(async (item) => {
              const city = this.locationInfo?.locality?.replace("市", "") || "";
              const cate = item.cate
                .replace(city, "")
                .replace("#", "号")
                .replace("价格", "");
              return await this.renderOilPrice({ ...item, cate });
            }),
          ),
        ),
        this.gasStationInfo.length > 0 &&
          /* @__PURE__ */ h(
            "wstack",
            {
              background:
                this.currentSettings.displaySettings.gasStationBGColorHex.val,
              flexDirection: "column",
              padding: [10, 10, 10, 10],
            },
            this.renderGasStation(this.gasStationInfo),
          ),
        /* @__PURE__ */ h("wspacer", {}),
        /* @__PURE__ */ h(
          "wstack",
          {
            background: this.currentSettings.displaySettings.footBGColorHex.val,
            verticalAlign: "center",
            padding: [0, 10, 10, 10],
          },
          /* @__PURE__ */ h("wimage", {
            src: oilPriceIcon,
            width: 15,
            height: 15,
            filter: this.currentSettings.displaySettings.footLogoColorHex.val,
          }),
          /* @__PURE__ */ h("wspacer", {
            length: 10,
          }),
          /* @__PURE__ */ h(
            "wtext",
            {
              opacity: 0.5,
              font: 12,
              textColor: this.widgetColor,
            },
            "今日油价 • " +
              (this.locationInfo?.administrativeArea?.replace("省", "") || "") +
              (this.locationInfo?.locality?.replace("市", "") || ""),
          ),
          /* @__PURE__ */ h("wspacer", {}),
          /* @__PURE__ */ h("wimage", {
            src: "arrow.clockwise",
            width: 10,
            height: 10,
            filter: this.widgetColor,
            opacity: 0.5,
          }),
          /* @__PURE__ */ h("wspacer", {
            length: 10,
          }),
          /* @__PURE__ */ h(
            "wtext",
            {
              font: 12,
              textAlign: "right",
              textColor: this.widgetColor,
              opacity: 0.5,
            },
            Utils.time("HH:mm:ss"),
          ),
        ),
      );
    };
    this.renderMedium = async (w) => {
      return await this.renderCommon(w);
    };
    this.renderLarge = async (w) => {
      return await this.renderCommon(w);
    };
    this.name = "今日油价";
    this.en = "TodayOilPrice";
    this.Run();
  }
  // 获取定位信息
  async getLocation() {
    const cachedLocation = this.storage.getStorage("location", 60);
    if (cachedLocation) {
      console.log("[+]使用缓存定位数据");
      this.locationInfo = cachedLocation;
    } else {
      try {
        const location = await Location.current();
        const locationText = await Location.reverseGeocode(
          location.latitude,
          location.longitude,
        );
        console.log(`[+]定位成功`);
        this.storage.setStorage("location", locationText[0]);
        this.locationInfo = locationText[0] ?? null;
      } catch (e) {
        console.log(`[+]无法定位，尝试使用缓存定位数据：${e}`);
        this.locationInfo = this.storage.getStorage("location") ?? null;
      }
    }
    console.log(this.locationInfo);
  }
  // 获取油价信息
  async getOilPrice() {
    const cachedTime = this.storage.getStorageTime("oilPrice");
    let shouldRequest = true;
    if (cachedTime) {
      const now = /* @__PURE__ */ new Date();
      const cachedDate = new Date(cachedTime);
      const nowDateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const cachedDateStr = `${cachedDate.getFullYear()}-${cachedDate.getMonth()}-${cachedDate.getDate()}`;
      if (nowDateStr === cachedDateStr) {
        const cachedOilPrice = this.storage.getStorage("oilPrice", 60);
        if (cachedOilPrice) {
          console.log("[+]使用缓存油价数据");
          this.oilPriceInfo = cachedOilPrice;
          shouldRequest = false;
        }
      } else {
        console.log("[+]跨天，立即请求最新油价");
      }
    }
    if (shouldRequest) {
      const oilPriceAPIKey =
        this.currentSettings.basicSettings.oilPriceAPIKey.val;
      if (!oilPriceAPIKey || oilPriceAPIKey.trim() === "") {
        console.log("[!]油价查询 API Key 未配置，无法查询油价");
        this.oilPriceInfo = this.storage.getStorage("oilPrice") ?? null;
        return;
      }
      await this.getLocation();
      const province = this.locationInfo?.administrativeArea
        ? this.locationInfo.administrativeArea
            .replace("省", "")
            .replace("市", "")
        : "";
      try {
        const url = `https://www.52api.cn/api/oilPrice?key=${oilPriceAPIKey}`;
        const httpData = await this.$request.get(url);
        if (
          httpData &&
          httpData.code === 200 &&
          httpData.data &&
          Array.isArray(httpData.data)
        ) {
          let matchedProvince;
          if (province) {
            matchedProvince = httpData.data.find(
              (item) =>
                item.provinceName === province ||
                item.provinceName.includes(province) ||
                province.includes(item.provinceName),
            );
          }
          const targetProvince = matchedProvince || httpData.data[0];
          if (targetProvince) {
            const data = [];
            if (targetProvince.oilPrice92 > 0) {
              data.push({
                cate: "92号汽油",
                value: `${targetProvince.oilPrice92}元/升`,
              });
            }
            if (targetProvince.oilPrice95 > 0) {
              data.push({
                cate: "95号汽油",
                value: `${targetProvince.oilPrice95}元/升`,
              });
            }
            if (targetProvince.oilPrice98 > 0) {
              data.push({
                cate: "98号汽油",
                value: `${targetProvince.oilPrice98}元/升`,
              });
            }
            if (targetProvince.oilPrice0 > 0) {
              data.push({
                cate: "0号柴油",
                value: `${targetProvince.oilPrice0}元/升`,
              });
            }
            console.log(
              `[+]油价查询成功，省份：${targetProvince.provinceName}`,
            );
            this.storage.setStorage("oilPrice", data);
            this.oilPriceInfo = data;
          } else {
            throw new Error("未找到匹配的省份油价信息");
          }
        } else {
          throw new Error(httpData?.msg || "API返回错误");
        }
      } catch (error) {
        console.log(`[+]油价查询失败，尝试使用缓存数据：${error}`);
        this.oilPriceInfo = this.storage.getStorage("oilPrice") ?? null;
      }
    }
    console.log(this.oilPriceInfo);
  }
  // 获取就近加油站信息
  async getGasStation() {
    const isLarge = this.widgetFamily === "large";
    const cacheKey = isLarge ? "gasStation_large" : "gasStation_medium";
    const cachedGasStation = this.storage.getStorage(cacheKey, 5);
    if (cachedGasStation) {
      console.log(`[+]使用缓存加油站数据（${isLarge ? "大尺寸" : "中尺寸"}）`);
      this.gasStationInfo = cachedGasStation;
    } else {
      await this.getLocation();
      const loc = this.locationInfo?.location;
      const longitude = loc?.longitude ?? 116.46869029185218;
      const latitude = loc?.latitude ?? 40.00690378888461;
      const tencentMapAPIKey =
        this.currentSettings.basicSettings.tencentMapAPIKey.val;
      const distance2NearestGasStation =
        Number(
          this.currentSettings.basicSettings.distance2NearestGasStation.val,
        ) || 5e3;
      if (!tencentMapAPIKey || tencentMapAPIKey.trim() === "") {
        console.log("[!]腾讯地图 Token 未配置，无法获取加油站信息");
        this.gasStationInfo = this.storage.getStorage(cacheKey) ?? [];
        return;
      }
      const params = {
        boundary: `nearby(${latitude},${longitude},${distance2NearestGasStation})`,
        page_size: 20,
        page_index: 1,
        keyword: "加油站",
        orderby: "_distance",
        key: tencentMapAPIKey,
      };
      const data = Object.keys(params).map((key) => `${key}=${params[key]}`);
      const url =
        "https://apis.map.qq.com/ws/place/v1/search?" +
        encodeURIComponent(data.join("&"));
      console.log(url);
      try {
        const httpData = await this.$request.get(url);
        const gasStationData =
          httpData && httpData.status == 0 ? httpData.data : [];
        const count = isLarge
          ? Number(
              this.currentSettings.displaySettings.gasStationCountLarge.val,
            ) || 5
          : Number(
              this.currentSettings.displaySettings.gasStationCountMedium.val,
            ) || 1;
        const infos = gasStationData?.splice(0, count);
        console.log(
          `[+]就近加油站信息请求成功（${isLarge ? "大尺寸" : "中尺寸"}，${count}条）`,
        );
        this.storage.setStorage(cacheKey, infos);
        this.gasStationInfo = infos;
      } catch (error) {
        console.log(`[+]就近加油站信息请求失败，尝试使用缓存：${error}`);
        this.gasStationInfo = this.storage.getStorage(cacheKey) ?? [];
      }
    }
    console.log(this.gasStationInfo);
  }
  Run() {
    if (config.runsInApp) {
      this.registerSettingCategory("displaySettings", "显示设置", [
        {
          title: "油价背景颜色",
          desc: "缺省值：#000000",
          icon: { name: "square.fill", color: "#000000" },
          type: "color",
          option: {
            headerBGColorHex: "#000000",
          },
        },
        {
          title: "汽油名称字体颜色",
          desc: "缺省值：#FC6D26",
          icon: { name: "fuelpump.fill", color: "#FC6D26" },
          type: "color",
          option: {
            gasolineNameColorHex: "#FC6D26",
          },
        },
        {
          title: "柴油名称字体颜色",
          desc: "缺省值：#FF0000",
          icon: { name: "fuelpump.fill", color: "#FF0000" },
          type: "color",
          option: {
            dieselNameColorHex: "#FF0000",
          },
        },
        {
          title: "油价格字体颜色",
          desc: "缺省值：系统字体颜色",
          icon: { name: "dollarsign.circle.fill", color: "#FFD700" },
          type: "color",
          option: {
            oilPriceColorHex: "",
          },
        },
        {
          title: "加油站详情背景颜色",
          desc: "缺省值：#000000",
          icon: { name: "rectangle.fill", color: "#1C1C1E" },
          type: "color",
          option: {
            gasStationBGColorHex: "#000000",
          },
        },
        {
          title: "加油站详情车辆图标颜色",
          desc: "缺省值：#61AFEF",
          icon: { name: "car.fill", color: "#61AFEF" },
          type: "color",
          option: {
            gasStationCarIconColorHex: "#61AFEF",
          },
        },
        {
          title: "加油站详情地址图标颜色",
          desc: "缺省值：#E06C75",
          icon: { name: "mappin.circle.fill", color: "#E06C75" },
          type: "color",
          option: {
            gasStationAddressIconColorHex: "#E06C75",
          },
        },
        {
          title: "底部页脚背景颜色",
          desc: "缺省值：#000000",
          icon: { name: "rectangle.bottomthird.inset.fill", color: "#2C2C2E" },
          type: "color",
          option: {
            footBGColorHex: "#000000",
          },
        },
        {
          title: "底部页脚logo颜色",
          desc: "缺省值：#FC6D26",
          icon: { name: "paintbrush.fill", color: "#FC6D26" },
          type: "color",
          option: {
            footLogoColorHex: "#FC6D26",
          },
        },
        {
          title: "中尺寸加油站数量",
          desc: "中尺寸显示加油站数量，缺省值：1",
          icon: { name: "square.grid.2x2", color: "#5BD078" },
          type: "text",
          option: {
            gasStationCountMedium: 1,
          },
          config: {
            placeholder: "中尺寸显示数量",
            style: "compact",
          },
        },
        {
          title: "大尺寸加油站数量",
          desc: "大尺寸显示加油站数量，缺省值：5",
          icon: { name: "square.grid.2x2.fill", color: "#5BD078" },
          type: "text",
          option: {
            gasStationCountLarge: 5,
          },
          config: {
            placeholder: "大尺寸显示数量",
            style: "compact",
          },
        },
      ]);
      this.registerSetting({
        title: "显示设置",
        icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png",
        onAction: async () => {
          await this.presentSettings(["displaySettings"]);
          return true;
        },
      });
      this.registerSetting({
        title: "加油站查询距离",
        desc: "查询距离范围：单位m",
        icon: { name: "car.fill", color: "#AC4E4D" },
        type: "text",
        option: {
          distance2NearestGasStation:
            this.currentSettings.basicSettings.distance2NearestGasStation.val ||
            5e3,
        },
        saveCategory: this.basicSettingsCategoryName,
        config: {
          placeholder: "就近加油站查询范围，单位m",
          style: "compact",
        },
      });
      this.registerSetting({
        title: "腾讯地图 Token",
        desc: "访问 https://lbs.qq.com/ 注册并申请Key，或使用BoxJS缓存",
        icon: { name: "mappin.and.ellipse", color: "#46ACFF" },
        type: "password",
        option: {
          tencentMapAPIKey:
            this.currentSettings.basicSettings.tencentMapAPIKey.val || "",
        },
        saveCategory: this.basicSettingsCategoryName,
        config: {
          placeholder: "腾讯地图 Token",
          style: "compact",
        },
      });
      this.registerSetting({
        title: "油价查询 API Key",
        desc: "到 https://www.52api.cn/ 注册申请免费api",
        icon: { name: "key.fill", color: "#FC6D26" },
        type: "password",
        option: {
          oilPriceAPIKey:
            this.currentSettings.basicSettings.oilPriceAPIKey.val || "",
        },
        saveCategory: this.basicSettingsCategoryName,
        config: {
          placeholder: "52api API Key",
          style: "compact",
        },
      });
    }
  }
  async renderOilPrice(data) {
    return /* @__PURE__ */ h(
      "wstack",
      {
        flexDirection: "column",
        verticalAlign: "center",
      },
      /* @__PURE__ */ h(
        "wstack",
        {
          verticalAlign: "bottom",
        },
        /* @__PURE__ */ h("wspacer", {}),
        /* @__PURE__ */ h(
          "wtext",
          {
            textAlign: "center",
            textColor:
              data.cate.indexOf("柴油") != -1
                ? this.currentSettings.displaySettings.dieselNameColorHex.val
                : this.currentSettings.displaySettings.gasolineNameColorHex.val,
            font: new Font("Chalkduster", 26),
          },
          data.cate.replace("号汽油", "").replace("号柴油", ""),
        ),
        /* @__PURE__ */ h("wimage", {
          src: "fuelpump.fill",
          width: 18,
          height: 18,
          filter:
            data.cate.indexOf("柴油") != -1
              ? this.currentSettings.displaySettings.dieselNameColorHex.val
              : this.currentSettings.displaySettings.gasolineNameColorHex.val,
        }),
        /* @__PURE__ */ h("wspacer", {}),
      ),
      /* @__PURE__ */ h("wspacer", {
        length: 10,
      }),
      /* @__PURE__ */ h(
        "wstack",
        {
          verticalAlign: "bottom",
        },
        /* @__PURE__ */ h("wspacer", {}),
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor:
              this.currentSettings.displaySettings.oilPriceColorHex.val ||
              this.widgetColor,
            font: new Font("Chalkduster", 16),
            textAlign: "center",
          },
          data.value.replace("/升", "").replace("元", ""),
        ),
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor:
              this.currentSettings.displaySettings.oilPriceColorHex.val ||
              this.widgetColor,
            font: new Font("Chalkduster", 14),
            textAlign: "center",
          },
          "/L",
        ),
        /* @__PURE__ */ h("wspacer", {}),
      ),
    );
  }
  renderStackCellText(data) {
    return /* @__PURE__ */ h(
      "wstack",
      {
        verticalAlign: "center",
      },
      /* @__PURE__ */ h("wspacer", {
        length: 5,
      }),
      /* @__PURE__ */ h("wimage", {
        src: data.icon,
        width: 10,
        height: 10,
        filter: data.iconColor || this.widgetColor,
      }),
      /* @__PURE__ */ h("wspacer", {
        length: 5,
      }),
      /* @__PURE__ */ h(
        "wtext",
        {
          href: data.href,
          font: 10,
          textColor: this.widgetColor,
          maxLine: 1,
        },
        data.label,
        "：",
        data.value || "-",
      ),
      /* @__PURE__ */ h("wspacer", {}),
    );
  }
  renderGasStation(gasStation) {
    return gasStation.map((item, index) => {
      const href = `iosamap://navi?sourceApplication=applicationName&backScheme=applicationScheme&poiname=fangheng&poiid=BGVIS&lat=${item.location.lat}&lon=${item.location.lng}&dev=1&style=2`;
      return /* @__PURE__ */ h(
        "wstack",
        {
          flexDirection: "column",
          borderRadius: 4,
          href,
        },
        this.renderStackCellText({
          value: `${item.title}(${item._distance}米)`,
          label: "油站",
          href,
          icon: "car",
          iconColor:
            this.currentSettings.displaySettings.gasStationCarIconColorHex.val,
        }),
        /* @__PURE__ */ h("wspacer", {
          length: 2,
        }),
        this.renderStackCellText({
          value: item.address,
          label: "地址",
          href,
          icon: "mappin.and.ellipse",
          iconColor:
            this.currentSettings.displaySettings.gasStationAddressIconColorHex
              .val,
        }),
        /* @__PURE__ */ h("wspacer", {
          length: 2,
        }),
        this.renderStackCellText({
          value: item.tel,
          label: "电话",
          href: "tel:" + item.tel,
          icon: "iphone",
        }),
        gasStation.length - 1 !== index && /* @__PURE__ */ h("wspacer", {}),
      );
    });
  }
  async render() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    await this.init();
    switch (this.widgetFamily) {
      case "medium":
        await this.renderMedium(widget);
        break;
      case "large":
        await this.renderLarge(widget);
        break;
      default:
        await Utils.renderUnsupport(widget);
        break;
    }
    return widget;
  }
};
EndAwait(() => Runing(Widget, args.widgetParameter, false));

await __topLevelAwait__();
