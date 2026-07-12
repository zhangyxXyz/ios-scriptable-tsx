// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: hdd;

/*
 * author   :  seiun
 * date     :  2025/12/20
 * build    :  2026-07-12 23:33:59
 * desc     :  Cursor 用量监控，支持每日用量、总用量与套餐概览
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/CursorMonitor.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, h, Utils } =
  runtimeRequire(dependencyFileName);
var parseTokenCount = (value) => parseInt(String(value ?? 0));
var CursorMonitor = class extends WidgetBase {
  constructor(arg) {
    super(arg);
    this.widgetParam = args.widgetParameter;
    this.contentRowSpacing = 5;
    this.usageData = null;
    this.aggregatedData = null;
    this.usageSummary = null;
    this.isRequestSuccess = false;
    this.dataFetchTime = null;
    this.isDataExpired = false;
    this.paramDisplayMode = null;
    this.paramAccountIndex = null;
    this.currentAccount = null;
    this.displayModeOptions = [
      { label: "每日用量", value: "每日用量" },
      { label: "总用量", value: "总用量" },
      { label: "套餐概览", value: "套餐概览" },
    ];
    this.currentSettings = {
      accountSettings: {
        defaultAccount: {
          val: "请选择或者添加账号",
          type: this.settingValTypeString,
        },
      },
      dailyDisplaySettings: {
        mediaWidgetShowDataNum: { val: 1, type: this.settingValTypeInt },
        largeWidgetShowDataNum: { val: 10, type: this.settingValTypeInt },
        listDataColorShowType: {
          val: "随机颜色",
          type: this.settingValTypeString,
        },
        listDataUpdateTimeShowType: {
          val: "显示",
          type: this.settingValTypeString,
        },
      },
      aggregatedDisplaySettings: {
        mediaWidgetShowDataNum: { val: 4, type: this.settingValTypeInt },
        largeWidgetShowDataNum: { val: 15, type: this.settingValTypeInt },
        showAggregatedPercentage: { val: true, type: this.settingValTypeBool },
        listDataColorShowType: {
          val: "随机颜色",
          type: this.settingValTypeString,
        },
        listDataUpdateTimeShowType: {
          val: "显示",
          type: this.settingValTypeString,
        },
      },
      basicSettings: {
        displayMode: { val: "每日用量", type: this.settingValTypeString },
      },
    };
    this.init = async () => {
      try {
        this.currentAccount = this.getCurrentAccount();
        await this.getUsageSummary();
        let displayMode = this.currentSettings.basicSettings.displayMode.val;
        if (this.paramDisplayMode !== null) {
          switch (this.paramDisplayMode) {
            case "0":
              displayMode = "每日用量";
              break;
            case "1":
              displayMode = "总用量";
              break;
            case "2":
              displayMode = "套餐概览";
              break;
            default:
              displayMode = "每日用量";
          }
        }
        switch (displayMode) {
          case "总用量":
            await this.getAggregatedData();
            break;
          default:
            await this.getDailyUsageData();
        }
      } catch (e) {
        console.log(e);
      }
    };
    // 模型颜色数组（按顺序分配颜色，相似色系放在一起）
    this.categoryColors = [
      "#4A90E2",
      // 浅蓝色
      "#2F54EB",
      // 深蓝色
      "#13C2C2",
      // 青色
      "#6C5CE7",
      // 紫色
      "#722ED1",
      // 深紫色
      "#F5222D",
      // 红色
      "#E67E22",
      // 橙色
      "#FA8C16",
      // 橙黄色
      "#52C41A",
      // 绿色
      "#EB2F96",
      // 粉色
    ];
    this.renderSummaryOverview = async (w, isFallback = false) => {
      GenrateView.setListWidget(w);
      const isLargeFamily = this.widgetFamily === "large";
      if (isLargeFamily) {
        w.addSpacer();
      } else {
        w.addSpacer(this.contentRowSpacing);
      }
      const iconUrl =
        "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/cursor.png";
      const titleStack = w.addStack();
      titleStack.layoutHorizontally();
      titleStack.spacing = 6;
      titleStack.centerAlignContent();
      try {
        const iconImg = await this.getImageByUrl(iconUrl);
        if (iconImg) {
          const icon = titleStack.addImage(iconImg);
          icon.imageSize = new Size(16, 16);
          icon.tintColor = this.widgetColor;
          icon.imageOpacity = 0.7;
        }
      } catch (e) {
        console.log(`加载图标失败: ${e}`);
      }
      let titleTextContent = "Cursor Monitor";
      if (this.currentAccount?.accountName) {
        titleTextContent += ` @${this.currentAccount.accountName}`;
      }
      if (this.usageSummary?.membershipType) {
        const membershipDisplay = this.formatMembershipType(
          this.usageSummary.membershipType,
        );
        titleTextContent += ` | ${membershipDisplay}`;
      }
      const titleText = titleStack.addText(titleTextContent);
      titleText.textColor = this.widgetColor;
      titleText.font = new Font("SF Mono", 13);
      titleText.textOpacity = 0.7;
      w.addSpacer(8);
      if (isFallback) {
        const tipStack = w.addStack();
        tipStack.layoutHorizontally();
        tipStack.centerAlignContent();
        tipStack.spacing = 3;
        const tipIcon = tipStack.addImage(SFSymbol.named("info.circle").image);
        tipIcon.imageSize = new Size(12, 12);
        tipIcon.tintColor = Color.orange();
        tipIcon.imageOpacity = 0.8;
        const tipText = tipStack.addText("周期内暂无用量数据，展示套餐概览");
        tipText.textColor = this.widgetColor;
        tipText.font = Font.systemFont(10);
        tipText.textOpacity = 0.5;
        w.addSpacer(8);
      } else {
        w.addSpacer(4);
      }
      if (
        this.usageSummary &&
        this.usageSummary.individualUsage &&
        this.usageSummary.individualUsage.plan
      ) {
        const planUsage = this.usageSummary.individualUsage.plan;
        const onDemandText = this.formatOnDemandUsage(
          this.usageSummary.individualUsage.onDemand,
        );
        if (
          this.usageSummary.billingCycleStart &&
          this.usageSummary.billingCycleEnd
        ) {
          const cycleStack = w.addStack();
          cycleStack.layoutHorizontally();
          cycleStack.spacing = 4;
          const cycleLabel = cycleStack.addText("账单周期");
          cycleLabel.textColor = this.widgetColor;
          cycleLabel.font = Font.mediumSystemFont(11);
          cycleLabel.textOpacity = 0.6;
          cycleStack.addSpacer();
          const startDate = new Date(this.usageSummary.billingCycleStart);
          const endDate = new Date(this.usageSummary.billingCycleEnd);
          const cycleValue = cycleStack.addText(
            `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          );
          cycleValue.textColor = this.widgetColor;
          cycleValue.font = new Font("SF Mono", 10);
          cycleValue.textOpacity = 0.8;
          w.addSpacer(6);
        }
        const usageTypes = [
          {
            label: "Auto用量",
            percent: planUsage.autoPercentUsed || 0,
            color: Color.blue(),
          },
          {
            label: "API用量",
            percent: planUsage.apiPercentUsed || 0,
            color: Color.purple(),
          },
          {
            label: "总用量",
            percent: planUsage.totalPercentUsed || 0,
            color: Color.orange(),
          },
        ];
        usageTypes.forEach(({ label, percent, color }, index) => {
          const labelStack = w.addStack();
          labelStack.layoutHorizontally();
          const usageLabel = labelStack.addText(label);
          usageLabel.textColor = this.widgetColor;
          usageLabel.font = Font.mediumSystemFont(11);
          usageLabel.textOpacity = 0.7;
          labelStack.addSpacer();
          const percentText = labelStack.addText(`${percent.toFixed(1)}%`);
          percentText.textColor = percent > 80 ? Color.red() : color;
          percentText.font = Font.boldSystemFont(11);
          w.addSpacer(1);
          const barRow = w.addStack();
          barRow.layoutHorizontally();
          const barBg = barRow.addStack();
          barBg.layoutHorizontally();
          barBg.backgroundColor = this.isNight
            ? new Color("#3A3A3C")
            : new Color("#E5E5EA");
          barBg.cornerRadius = 4;
          barBg.size = new Size(200, 6);
          if (percent > 0) {
            const barFg = barBg.addStack();
            barFg.backgroundColor = percent > 80 ? Color.red() : color;
            barFg.cornerRadius = 4;
            const barWidth = Math.min(percent, 100);
            barFg.size = new Size(barWidth * 2, 6);
          }
          barBg.addSpacer();
          barRow.addSpacer();
          if (index < usageTypes.length - 1) {
            w.addSpacer(4);
          }
        });
        if (onDemandText) {
          w.addSpacer(4);
          const onDemandStack = w.addStack();
          onDemandStack.layoutHorizontally();
          onDemandStack.spacing = 4;
          const onDemandLabel = onDemandStack.addText("按量付费");
          onDemandLabel.textColor = this.widgetColor;
          onDemandLabel.font = Font.mediumSystemFont(11);
          onDemandLabel.textOpacity = 0.7;
          onDemandStack.addSpacer();
          const onDemandValue = onDemandStack.addText(onDemandText);
          onDemandValue.textColor = Color.green();
          onDemandValue.font = Font.boldSystemFont(11);
        }
      } else {
        w.addSpacer();
        const noDataText = w.addText("周期内暂无使用数据");
        noDataText.textColor = this.widgetColor;
        noDataText.font = Font.mediumSystemFont(12);
        noDataText.textOpacity = 0.6;
      }
      if (
        this.currentSettings.dailyDisplaySettings.listDataUpdateTimeShowType
          .val === "显示"
      ) {
        w.addSpacer(isLargeFamily ? 8 : void 0);
        const timeStack = w.addStack();
        timeStack.layoutHorizontally();
        timeStack.centerAlignContent();
        timeStack.addSpacer();
        const timeIcon = timeStack.addImage(
          SFSymbol.named("arrow.clockwise").image,
        );
        timeIcon.imageSize = new Size(10, 10);
        timeIcon.tintColor = this.widgetColor;
        timeIcon.imageOpacity = 0.5;
        timeStack.addSpacer(5);
        const timeText = timeStack.addText(Utils.time("HH:mm:ss"));
        timeText.textColor = this.widgetColor;
        timeText.font = new Font("SF Mono", 10);
        timeText.textOpacity = 0.5;
        timeText.rightAlignText();
      }
      if (isLargeFamily) {
        w.addSpacer();
      }
      return w;
    };
    this.renderCommon = async (w) => {
      let displayMode = this.currentSettings.basicSettings.displayMode.val;
      if (this.paramDisplayMode !== null) {
        switch (this.paramDisplayMode) {
          case "0":
            displayMode = "每日用量";
            break;
          case "1":
            displayMode = "总用量";
            break;
          case "2":
            displayMode = "套餐概览";
            break;
          default:
            displayMode = "每日用量";
        }
      }
      switch (displayMode) {
        case "总用量":
          return await this.renderAggregated(w);
        case "套餐概览":
          return await this.renderSummaryOverview(w, false);
      }
      const dailyMode =
        this.currentSettings.dailyDisplaySettings.displayMode?.val ||
        "每日详情";
      if (dailyMode === "套餐概览") {
        return await this.renderSummaryOverview(w, false);
      }
      if (
        !this.usageData ||
        !this.usageData.dailySpend ||
        this.usageData.dailySpend.length === 0
      ) {
        return await this.renderSummaryOverview(w, true);
      }
      if (
        this.usageData &&
        this.usageData.dailySpend &&
        this.usageData.dailySpend.length > 0
      ) {
        const grouped = this.groupByDay(this.usageData.dailySpend);
        const days = Object.keys(grouped).sort(
          (a, b) => parseInt(a) - parseInt(b),
        );
        let cumulativeTotal = 0;
        const dayTotals = days.map((day) => {
          const total = this.calculateDayTotal(grouped[day]);
          cumulativeTotal += total;
          return {
            day,
            total,
            cumulative: cumulativeTotal,
            items: grouped[day],
          };
        });
        const maxItems =
          this.widgetFamily === "medium"
            ? this.currentSettings.dailyDisplaySettings.mediaWidgetShowDataNum
                .val
            : this.currentSettings.dailyDisplaySettings.largeWidgetShowDataNum
                .val;
        const displayDays = dayTotals.slice(-maxItems);
        const maxSpend = this.getMaxSpend(days, grouped);
        const barMaxWidth = 150;
        const dateColumnWidth = 44;
        const amountColumnWidth = 70;
        const isRandomColor =
          this.currentSettings.dailyDisplaySettings.listDataColorShowType
            .val === "随机颜色";
        GenrateView.setListWidget(w);
        w.addSpacer(this.contentRowSpacing);
        const titleStack = w.addStack();
        titleStack.layoutHorizontally();
        titleStack.spacing = 6;
        titleStack.centerAlignContent();
        const iconUrl =
          "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/cursor.png";
        try {
          const iconImg = await this.getImageByUrl(iconUrl);
          if (iconImg) {
            const icon = titleStack.addImage(iconImg);
            icon.imageSize = new Size(16, 16);
            icon.tintColor = this.widgetColor;
            icon.imageOpacity = 0.7;
          }
        } catch (e) {
          console.log(`加载图标失败: ${e}`);
        }
        let titleTextContent = "Daily Usage";
        if (this.currentAccount?.accountName) {
          titleTextContent += ` @${this.currentAccount.accountName}`;
        }
        if (this.usageSummary?.membershipType) {
          const membershipDisplay = this.formatMembershipType(
            this.usageSummary.membershipType,
          );
          titleTextContent += ` | ${membershipDisplay}`;
        }
        const titleText = titleStack.addText(titleTextContent);
        titleText.textColor = this.widgetColor;
        titleText.font = new Font("SF Mono", 13);
        titleText.textOpacity = 0.7;
        w.addSpacer(8);
        const allCategories = [
          ...new Set(this.usageData.dailySpend.map((item) => item.category)),
        ].sort();
        displayDays.forEach(({ day, total, cumulative, items }, index) => {
          const isLastItem = index === displayDays.length - 1;
          const isSecondLastItem = index === displayDays.length - 2;
          const dateStr = this.formatDate(day);
          const barWidth = maxSpend > 0 ? (total / maxSpend) * barMaxWidth : 0;
          const rowTextColor = isRandomColor
            ? this.getRowTextColor(true)
            : this.widgetColor;
          const rowStack = w.addStack();
          rowStack.layoutHorizontally();
          rowStack.centerAlignContent();
          rowStack.spacing = 6;
          const dateText = rowStack.addText(
            `${dateStr}${isLastItem ? " ⭐" : ""}`,
          );
          dateText.textColor = isLastItem ? Color.orange() : rowTextColor;
          dateText.font = Font.mediumSystemFont(11);
          dateText.textOpacity = isLastItem ? 1 : 0.8;
          dateText.minimumScaleFactor = 0.8;
          dateText.lineLimit = 1;
          dateText.size = new Size(dateColumnWidth, 14);
          const barStack = rowStack.addStack();
          barStack.layoutHorizontally();
          barStack.spacing = 0;
          barStack.size = new Size(barMaxWidth, 14);
          if (barWidth > 0 && items.length > 0) {
            const sortedItems = this.sortItemsByCategory(items, allCategories);
            sortedItems.forEach((item) => {
              const itemWidth = (item.spendCents / total) * barWidth;
              if (itemWidth >= 1) {
                const barSegment = barStack.addStack();
                barSegment.backgroundColor = new Color(
                  this.getCategoryColor(item.category, allCategories),
                );
                barSegment.size = new Size(itemWidth, 14);
              }
            });
          }
          barStack.addSpacer();
          rowStack.addSpacer();
          const amountText = rowStack.addText(`$${this.formatSpend(total)}`);
          amountText.textColor = isLastItem ? Color.orange() : rowTextColor;
          amountText.font = Font.boldSystemFont(11);
          amountText.textOpacity = 0.9;
          amountText.rightAlignText();
          amountText.lineLimit = 1;
          amountText.minimumScaleFactor = 0.8;
          amountText.size = new Size(amountColumnWidth, 14);
          w.addSpacer(4);
          if (isSecondLastItem) {
            const sortedItems = this.sortItemsByCategory(items, allCategories);
            sortedItems.forEach((item) => {
              this.renderCategoryDetailRow(
                w,
                item.category,
                item.spendCents,
                total,
                allCategories,
                rowTextColor,
              );
            });
            w.addSpacer(4);
          } else if (isLastItem) {
            allCategories.forEach((category) => {
              const item = items.find((i) => i.category === category);
              const spendCents = item ? item.spendCents : 0;
              this.renderCategoryDetailRow(
                w,
                category,
                spendCents,
                total,
                allCategories,
                rowTextColor,
              );
            });
            const cumulativeStack = w.addStack();
            cumulativeStack.setPadding(2, 0, 4, 50);
            const cumulativeText = cumulativeStack.addText(
              `累计: $${this.formatSpend(cumulative)}`,
            );
            cumulativeText.textColor = rowTextColor;
            cumulativeText.font = Font.boldSystemFont(10);
            cumulativeText.textOpacity = 0.8;
            w.addSpacer(4);
          }
        });
        if (
          this.currentSettings.dailyDisplaySettings.listDataUpdateTimeShowType
            .val === "显示"
        ) {
          w.addSpacer(4);
          const timeStack = w.addStack();
          timeStack.layoutHorizontally();
          timeStack.centerAlignContent();
          timeStack.addSpacer();
          const timeIcon = timeStack.addImage(
            SFSymbol.named("arrow.clockwise").image,
          );
          timeIcon.imageSize = new Size(10, 10);
          timeIcon.tintColor = this.widgetColor;
          timeIcon.imageOpacity = 0.5;
          timeStack.addSpacer(5);
          const timeText = timeStack.addText(Utils.time("HH:mm:ss"));
          timeText.textColor = this.isRequestSuccess
            ? this.widgetColor
            : Color.red();
          timeText.font = new Font("SF Mono", 10);
          timeText.textOpacity = 0.5;
          timeText.rightAlignText();
        }
        return w;
      }
      return w;
    };
    this.renderAggregated = async (w) => {
      if (
        this.aggregatedData &&
        this.aggregatedData.aggregations &&
        this.aggregatedData.aggregations.length > 0
      ) {
        GenrateView.setListWidget(w);
        w.addSpacer(this.contentRowSpacing);
        const titleStack = w.addStack();
        titleStack.layoutHorizontally();
        titleStack.spacing = 6;
        titleStack.centerAlignContent();
        const iconUrl =
          "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/cursor.png";
        try {
          const iconImg = await this.storage.getImage(
            iconUrl,
            true,
            true,
            false,
          );
          if (iconImg && typeof iconImg !== "string") {
            const icon = titleStack.addImage(iconImg);
            icon.imageSize = new Size(16, 16);
            icon.tintColor = this.widgetColor;
            icon.imageOpacity = 0.7;
          }
        } catch (e) {
          console.log(`加载图标失败: ${e}`);
        }
        let titleTextContent = "Total Usage";
        if (this.currentAccount?.accountName) {
          titleTextContent += ` @${this.currentAccount.accountName}`;
        }
        if (this.usageSummary?.membershipType) {
          const membershipDisplay = this.formatMembershipType(
            this.usageSummary.membershipType,
          );
          titleTextContent += ` | ${membershipDisplay}`;
        }
        const titleText = titleStack.addText(titleTextContent);
        titleText.textColor = this.widgetColor;
        titleText.font = new Font("SF Mono", 13);
        titleText.textOpacity = 0.7;
        w.addSpacer(8);
        const isRandomColor =
          this.currentSettings.aggregatedDisplaySettings.listDataColorShowType
            .val === "随机颜色";
        const validItems = this.aggregatedData.aggregations
          .filter((item) => {
            const hasTokens =
              parseTokenCount(item.inputTokens) > 0 ||
              parseTokenCount(item.outputTokens) > 0 ||
              parseTokenCount(item.cacheWriteTokens) > 0 ||
              parseTokenCount(item.cacheReadTokens) > 0;
            return hasTokens;
          })
          .sort((a, b) => {
            const centsA = a.totalCents || 0;
            const centsB = b.totalCents || 0;
            if (centsA !== centsB) {
              return centsB - centsA;
            }
            const tokensA =
              parseTokenCount(a.inputTokens) +
              parseTokenCount(a.outputTokens) +
              parseTokenCount(a.cacheWriteTokens) +
              parseTokenCount(a.cacheReadTokens);
            const tokensB =
              parseTokenCount(b.inputTokens) +
              parseTokenCount(b.outputTokens) +
              parseTokenCount(b.cacheWriteTokens) +
              parseTokenCount(b.cacheReadTokens);
            return tokensB - tokensA;
          });
        const maxItems =
          this.widgetFamily === "medium"
            ? this.currentSettings.aggregatedDisplaySettings
                .mediaWidgetShowDataNum.val
            : this.currentSettings.aggregatedDisplaySettings
                .largeWidgetShowDataNum.val;
        const displayItems = validItems.slice(0, maxItems);
        const hasMore = validItems.length > maxItems;
        displayItems.forEach((item) => {
          const rowTextColor = isRandomColor
            ? this.getRowTextColor(true)
            : this.widgetColor;
          const rowStack = w.addStack();
          rowStack.layoutHorizontally();
          rowStack.centerAlignContent();
          rowStack.spacing = 8;
          const modelText = rowStack.addText(item.modelIntent || "unknown");
          modelText.textColor = rowTextColor;
          modelText.font = Font.mediumSystemFont(12);
          modelText.textOpacity = 0.9;
          modelText.lineLimit = 1;
          rowStack.addSpacer();
          const totalTokens2 = (
            parseTokenCount(item.inputTokens) +
            parseTokenCount(item.outputTokens) +
            parseTokenCount(item.cacheWriteTokens) +
            parseTokenCount(item.cacheReadTokens)
          ).toString();
          const tokensText = rowStack.addText(
            `${this.formatTokens(totalTokens2)} tokens`,
          );
          tokensText.textColor = rowTextColor;
          tokensText.font = Font.systemFont(11);
          tokensText.textOpacity = 0.7;
          rowStack.addSpacer(8);
          const costCents = item.totalCents || 0;
          const costText = rowStack.addText(
            `US$${this.formatSpend(costCents)}`,
          );
          costText.textColor = rowTextColor;
          costText.font = Font.systemFont(11);
          costText.textOpacity = 0.8;
          costText.rightAlignText();
          w.addSpacer(4);
        });
        if (hasMore) {
          const moreStack = w.addStack();
          moreStack.layoutHorizontally();
          moreStack.centerAlignContent();
          const moreTextColor = isRandomColor
            ? this.getRowTextColor(true)
            : this.widgetColor;
          const moreText = moreStack.addText("...");
          moreText.textColor = moreTextColor;
          moreText.font = Font.systemFont(11);
          moreText.textOpacity = 0.5;
          moreText.centerAlignText();
          w.addSpacer(2);
        }
        w.addSpacer(2);
        const totalStack = w.addStack();
        totalStack.layoutHorizontally();
        totalStack.centerAlignContent();
        totalStack.spacing = 6;
        const totalLabelText = totalStack.addText("Σ");
        totalLabelText.textColor = Color.orange();
        totalLabelText.font = Font.boldSystemFont(13);
        totalLabelText.textOpacity = 1;
        const totalTokens = (
          parseTokenCount(this.aggregatedData.totalInputTokens) +
          parseTokenCount(this.aggregatedData.totalOutputTokens) +
          parseTokenCount(this.aggregatedData.totalCacheWriteTokens) +
          parseTokenCount(this.aggregatedData.totalCacheReadTokens)
        ).toString();
        const totalTokensText = totalStack.addText(
          `${this.formatTokens(totalTokens)} tokens`,
        );
        totalTokensText.textColor = Color.orange();
        totalTokensText.font = Font.boldSystemFont(12);
        totalTokensText.textOpacity = 0.9;
        totalStack.addSpacer();
        const onDemandText = this.formatOnDemandUsage(
          this.usageSummary?.individualUsage?.onDemand,
        );
        if (onDemandText) {
          const demandText = totalStack.addText(`⚡ ${onDemandText}`);
          demandText.textColor = Color.green();
          demandText.font = Font.boldSystemFont(11);
          demandText.textOpacity = 0.9;
          totalStack.addSpacer(4);
        }
        const totalCostText = totalStack.addText(
          `US$${this.formatSpend(this.aggregatedData.totalCostCents || 0)}`,
        );
        totalCostText.textColor = Color.orange();
        totalCostText.font = Font.boldSystemFont(12);
        totalCostText.textOpacity = 1;
        totalCostText.rightAlignText();
        w.addSpacer(2);
        const infoStack = w.addStack();
        infoStack.layoutHorizontally();
        infoStack.centerAlignContent();
        infoStack.spacing = 6;
        const planUsage = this.usageSummary?.individualUsage?.plan;
        const autoPercent = planUsage?.autoPercentUsed || 0;
        const apiPercent = planUsage?.apiPercentUsed || 0;
        const totalPercent = planUsage?.totalPercentUsed || 0;
        let usageText = "";
        if (
          this.currentSettings.aggregatedDisplaySettings
            .showAggregatedPercentage.val &&
          (autoPercent > 0 || apiPercent > 0 || totalPercent > 0)
        ) {
          usageText = `Auto ${autoPercent.toFixed(1)}% • API ${apiPercent.toFixed(1)}% • Total ${totalPercent.toFixed(1)}%`;
        }
        if (this.usageSummary?.billingCycleEnd) {
          const resetDate = new Date(this.usageSummary.billingCycleEnd);
          const chinaTime = new Date(
            resetDate.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }),
          );
          const month = chinaTime.getMonth() + 1;
          const day = chinaTime.getDate();
          const time = resetDate.toLocaleString("zh-CN", {
            timeZone: "Asia/Shanghai",
            hour: "2-digit",
            minute: "2-digit",
          });
          const resetTimeStr = `Reset at ${month}-${day} ${time}`;
          if (usageText) {
            usageText += ` • ${resetTimeStr}`;
          } else {
            usageText = resetTimeStr;
          }
        }
        if (usageText) {
          infoStack.addSpacer(4);
          const usageSummary = infoStack.addText(usageText);
          usageSummary.textColor = this.widgetColor;
          usageSummary.font = Font.systemFont(10);
          usageSummary.textOpacity = 0.7;
        }
        infoStack.addSpacer();
        w.addSpacer(2);
        if (
          this.currentSettings.aggregatedDisplaySettings
            .listDataUpdateTimeShowType.val === "显示"
        ) {
          const timeStack = w.addStack();
          timeStack.layoutHorizontally();
          timeStack.centerAlignContent();
          timeStack.addSpacer();
          const timeIcon = timeStack.addImage(
            SFSymbol.named("arrow.clockwise").image,
          );
          timeIcon.imageSize = new Size(9, 9);
          timeIcon.tintColor = this.widgetColor;
          timeIcon.imageOpacity = 0.5;
          timeStack.addSpacer(2);
          const timeStr = this.dataFetchTime
            ? Utils.time("HH:mm:ss", this.dataFetchTime)
            : Utils.time("HH:mm:ss");
          const timeText = timeStack.addText(timeStr);
          timeText.textColor =
            this.isDataExpired || !this.isRequestSuccess
              ? Color.red()
              : this.widgetColor;
          timeText.font = new Font("SF Mono", 10);
          timeText.textOpacity = 0.5;
          timeText.rightAlignText();
        }
        return w;
      } else if (
        this.aggregatedData &&
        this.aggregatedData.aggregations &&
        this.aggregatedData.aggregations.length === 0
      ) {
        return await this.renderSummaryOverview(w, true);
      } else {
        GenrateView.setListWidget(w);
        w.addSpacer();
        const errorText = w.addText("数据加载失败");
        errorText.textColor = Color.red();
        errorText.font = new Font("SF Mono", 14);
        errorText.textOpacity = 0.7;
        w.addSpacer();
        return w;
      }
    };
    this.renderMedium = async (w) => {
      return await this.renderCommon(w);
    };
    this.renderLarge = async (w) => {
      return await this.renderCommon(w);
    };
    this.name = "Cursor监控";
    this.en = "CursorMonitor";
    this.storageExpirationMinutes = 5;
    this.Run();
  }
  getAccountDisplay() {
    return this.getDefaultAccountDisplay();
  }
  getDefaultAccountDisplay() {
    if (this.settings.account?.accountName)
      return this.settings.account.accountName;
    if (this.settings.accountSettings?.defaultAccount)
      return this.settings.accountSettings.defaultAccount;
    if (this.currentSettings?.accountSettings?.defaultAccount?.val)
      return this.currentSettings.accountSettings.defaultAccount.val;
    return "请选择或者添加账号";
  }
  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  // 生成账号列表的 HTML 内容
  generateAccountListHtml() {
    const dataSource = this.settings.dataSource || [];
    const defaultAccountName = this.getDefaultAccountDisplay();
    let accountListHtml = "";
    if (dataSource.length === 0) {
      accountListHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔑</div>
                    <div>暂无账号</div>
                    <div style="margin-top: 8px; font-size: 14px;">点击下方按钮添加您的第一个账号</div>
                </div>
            `;
    } else {
      for (let i = 0; i < dataSource.length; i++) {
        const account = dataSource[i];
        const isDefault =
          defaultAccountName && defaultAccountName === account.accountName;
        const accountName = this.escapeHtml(account.accountName || "未命名");
        const teamId = this.escapeHtml(account.teamId ?? -1);
        accountListHtml += `
                    <div class="account-item" data-index="${i}">
                        <div class="account-icon">🔑</div>
                        <div class="account-info">
                            <div class="account-name">${accountName}</div>
                            <div class="account-detail">编号: ${i} | 团队ID: ${teamId}</div>
                        </div>
                        ${isDefault ? '<span class="account-badge">默认</span>' : ""}
                        <span class="account-arrow">›</span>
                    </div>
                `;
      }
    }
    let statsCardHtml = "";
    if (dataSource.length > 0) {
      statsCardHtml = `
                <div class="stats-card">
                    <div class="stats-icon">📊</div>
                    <div class="stats-info">
                        <div class="stats-title">账号统计</div>
                        <div class="stats-detail">共 ${dataSource.length} 个账号</div>
                    </div>
                </div>
            `;
    }
    return { accountListHtml, statsCardHtml };
  }
  async resetPendingAction(webView) {
    try {
      await webView.evaluateJavaScript('window.pendingAction = "";', false);
    } catch (e) {
      console.log("resetPendingAction error:", e);
    }
  }
  async readPendingAccountAction(webView) {
    return await webView.evaluateJavaScript(
      `(function() {
                if (typeof window.pendingAction === 'undefined') {
                    window.pendingAction = '';
                }
                var action = window.pendingAction || '';
                if (action) window.pendingAction = '';
                return action;
            })()`,
      false,
    );
  }
  async reloadSettingsFromStorage() {
    try {
      const latest = this.getSettings();
      if (latest && typeof latest === "object") {
        this.settings = latest;
      }
    } catch (e) {
      console.log("reloadSettingsFromStorage error:", e);
    }
  }
  async updateSettingDisplay(webView, category, key, text) {
    if (!webView || !category || !key) return;
    const elementId = `${category}__${key}`;
    try {
      const scripts = `
                (function(){
                    var el = document.getElementById("${elementId}");
                    if (!el) return;
                    var desc = el.querySelector('.form-item-right-desc');
                    if (desc) {
                        var span = desc.querySelector('span') || desc.querySelector('.value-text') || desc.querySelector('.value-text-multiline');
                        if (span) span.innerText = ${JSON.stringify(text || "")};
                        var textWrapper = desc.querySelector('.text-input-wrapper');
                        if (textWrapper) {
                            textWrapper.dataset.value = ${JSON.stringify(text || "")};
                            textWrapper.dataset.default = ${JSON.stringify(text || "")};
                        }
                    }
                })();
            `;
      await webView.evaluateJavaScript(scripts, false);
    } catch (e) {
      console.log("updateSettingDisplay error:", e);
    }
  }
  async bindAccountActions(webView) {
    try {
      await webView.evaluateJavaScript(
        `(function() {
                    if (typeof window.pendingAction === 'undefined') window.pendingAction = '';
                    document.querySelectorAll('.account-item').forEach(function(item) {
                        item.onclick = function() {
                            window.pendingAction = 'account_' + item.getAttribute('data-index');
                        };
                    });
                    var addBtn = document.getElementById('addBtn');
                    if (addBtn) {
                        addBtn.onclick = function() {
                            window.pendingAction = 'add';
                        };
                    }
                })()`,
        false,
      );
    } catch (e) {
      console.log("bindAccountActions error:", e);
    }
  }
  async rebuildAccountList(webView, skipReload = false) {
    try {
      if (!skipReload) {
        await this.reloadSettingsFromStorage();
      }
      const { accountListHtml, statsCardHtml } = this.generateAccountListHtml();
      const escapedHtml = accountListHtml
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$");
      const escapedStatsHtml = statsCardHtml
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$");
      const timestamp = Date.now();
      await webView.evaluateJavaScript(
        `(function() {
                    try {
                        window.pendingAction = '';
                        var statsContainer = document.querySelector('.stats-container');
                        if (statsContainer) {
                            statsContainer.innerHTML = \`${escapedStatsHtml}\`;
                        }
                        var body = document.querySelector('.list__body');
                        if (body) {
                            body.innerHTML = '';
                            body.setAttribute('data-refresh', '${timestamp}');
                            void body.offsetHeight;
                            body.innerHTML = \`${escapedHtml}\`;
                            void body.offsetHeight;
                        }
                        return 'success';
                    } catch (err) {
                        console.log('DOM update error:', err);
                        return 'error: ' + err;
                    }
                })()`,
        false,
      );
      await new Promise((resolve) =>
        Timer.schedule(150, false, () => resolve(void 0)),
      );
      await this.bindAccountActions(webView);
      await this.resetPendingAction(webView);
    } catch (e) {
      console.log("rebuildAccountList error:", e);
    }
  }
  async updateDefaultAccount(accountName) {
    this.syncCurrentSettings("accountSettings", "defaultAccount", accountName);
    if (!this.settings.accountSettings) this.settings.accountSettings = {};
    this.settings.accountSettings.defaultAccount = accountName;
    this.saveSettings(false);
    await this.reloadSettingsFromStorage();
  }
  async manageAccounts() {
    try {
      await this.reloadSettingsFromStorage();
      const webView = new WebView();
      const style = `
                :root {
                    --divider-color: rgba(60,60,67,0.36);
                    --card-background: #fff;
                    --card-radius: 10px;
                    --list-header-color: rgba(60,60,67,0.6);
                }
                * {
                    -webkit-user-select: none;
                    user-select: none;
                }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    background: #f2f2f7;
                    padding-bottom: 80px;
                }
                .header {
                    padding: 15px 18px 0;
                    color: var(--list-header-color);
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .list {
                    padding: 0 18px;
                    margin-top: 15px;
                }
                .stats-container {
                    padding: 0 18px;
                    margin-top: 15px;
                }
                .stats-card {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: var(--card-background);
                    border-radius: var(--card-radius);
                }
                .stats-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #FF9500, #FF6B00);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .stats-info {
                    flex: 1;
                    margin-left: 12px;
                }
                .stats-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #000;
                }
                .stats-detail {
                    font-size: 12px;
                    color: #86868b;
                    margin-top: 2px;
                }
                .list__header {
                    margin: 0 0 10px 0;
                    color: var(--list-header-color);
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .list__body {
                    background: var(--card-background);
                    border-radius: var(--card-radius);
                    overflow: hidden;
                }
                .account-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    position: relative;
                    cursor: pointer;
                }
                .account-item:active {
                    background: rgba(0,0,0,0.05);
                }
                .account-item + .account-item::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 56px;
                    right: 0;
                    border-top: 0.5px solid var(--divider-color);
                }
                .account-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #3E9BF7, #00C6FB);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .account-info {
                    flex: 1;
                    margin-left: 12px;
                    overflow: hidden;
                }
                .account-name {
                    font-size: 16px;
                    font-weight: 500;
                    color: #000;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .account-detail {
                    font-size: 12px;
                    color: #86868b;
                    margin-top: 2px;
                }
                .account-badge {
                    background: #3E9BF7;
                    color: white;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                    flex-shrink: 0;
                }
                .account-arrow {
                    color: #c7c7cc;
                    font-size: 18px;
                    margin-left: 8px;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #86868b;
                }
                .empty-state-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }
                .add-button-container {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 12px 18px;
                    background: #f2f2f7;
                    border-top: 0.5px solid var(--divider-color);
                }
                .add-button {
                    width: 100%;
                    padding: 14px;
                    background: #3E9BF7;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 17px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .add-button:active {
                    background: #2d7fd4;
                }
                @media (prefers-color-scheme: dark) {
                    :root {
                        --divider-color: rgba(84,84,88,0.65);
                        --card-background: #1c1c1e;
                        --list-header-color: rgba(235,235,245,0.6);
                    }
                    body {
                        background: #000;
                        color: #fff;
                    }
                    .stats-title {
                        color: #fff;
                    }
                    .account-name {
                        color: #fff;
                    }
                    .account-item:active {
                        background: rgba(255,255,255,0.1);
                    }
                    .add-button-container {
                        background: #000;
                    }
                }
            `;
      const { accountListHtml, statsCardHtml } = this.generateAccountListHtml();
      const html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, user-scalable=no">
                        <style>${style}</style>
                    </head>
                    <body>
                        <div class="header">账号管理</div>
                        <div class="stats-container">${statsCardHtml}</div>
                        <div class="list">
                            <div class="list__body">
                                ${accountListHtml}
                            </div>
                        </div>
                        <div class="add-button-container">
                            <button class="add-button" id="addBtn">+ 新增账号</button>
                        </div>
                        <script>
                            (function() {
                                try {
                                    window.pendingAction = '';
                                    var items = document.querySelectorAll('.account-item');
                                    for (var i = 0; i < items.length; i++) {
                                        items[i].onclick = function() {
                                            window.pendingAction = 'account_' + this.getAttribute('data-index');
                                        };
                                    }
                                    var addBtn = document.getElementById('addBtn');
                                    if (addBtn) {
                                        addBtn.onclick = function() {
                                            window.pendingAction = 'add';
                                        };
                                    }
                                } catch (error) {
                                    document.body.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>账号管理加载失败</div><div style="margin-top: 8px; font-size: 14px;">' + String(error) + '</div></div>';
                                }
                            })();
                        </script>
                    </body>
                </html>
            `;
      await webView.loadHTML(html);
      let isWebViewClosed = false;
      webView.present(false).then(() => {
        isWebViewClosed = true;
      });
      while (!isWebViewClosed) {
        await new Promise((resolve) =>
          Timer.schedule(250, false, () => resolve(void 0)),
        );
        if (isWebViewClosed) break;
        let action = "";
        try {
          action = await this.readPendingAccountAction(webView);
        } catch (e) {
          console.log("evaluateJavaScript 错误:", e);
          continue;
        }
        if (!action || action === "") {
          await this.resetPendingAction(webView);
          continue;
        }
        let result = null;
        if (action === "add") {
          result = { action: "addAccount" };
        } else if (action.startsWith("account_")) {
          const index = parseInt(action.replace("account_", ""));
          result = { action: "accountClick", index };
        }
        if (!result) {
          await this.resetPendingAction(webView);
          continue;
        }
        await this.reloadSettingsFromStorage();
        const dataSource = this.settings.dataSource || [];
        if (result.action === "accountClick") {
          const index = result.index;
          const account = dataSource[index];
          if (!account) continue;
          const actionAlert = new Alert();
          actionAlert.title = account.accountName || "账号操作";
          actionAlert.message = "请选择要执行的操作";
          actionAlert.addAction("设为默认");
          actionAlert.addAction("修改");
          actionAlert.addAction("复制");
          actionAlert.addDestructiveAction("删除");
          actionAlert.addCancelAction("取消");
          const actionIndex = await actionAlert.presentAlert();
          switch (actionIndex) {
            case 0:
              try {
                const accountName = account.accountName || "";
                this.settings.account = account;
                this.syncCurrentSettings(
                  "accountSettings",
                  "defaultAccount",
                  accountName,
                );
                if (!this.settings.accountSettings) {
                  this.settings.accountSettings = {};
                }
                this.settings.accountSettings.defaultAccount = accountName;
                this.saveSettings(false);
                await this.rebuildAccountList(webView, true);
                await this.resetPendingAction(webView);
              } catch (err) {
                console.log("设为默认错误:", err);
              }
              break;
            case 1:
              try {
                const editResult = await this.editAccount(index, account);
                if (editResult && editResult.success) {
                  await this.rebuildAccountList(webView);
                  if (editResult.isDefaultAccount) {
                    await this.updateDefaultAccount(editResult.newName || "");
                  }
                  await this.resetPendingAction(webView);
                }
              } catch (err) {
                console.log("修改错误:", err);
              }
              break;
            case 2:
              try {
                const copied = await this.copyAccount(index, account);
                if (copied) {
                  await this.rebuildAccountList(webView);
                  await this.resetPendingAction(webView);
                }
              } catch (err) {
                console.log("复制错误:", err);
              }
              break;
            case 3:
              try {
                const deleted = await this.deleteAccount(index, account);
                if (deleted) {
                  await this.rebuildAccountList(webView);
                  await this.resetPendingAction(webView);
                }
              } catch (err) {
                console.log("删除错误:", err);
              }
              break;
          }
        } else if (result.action === "addAccount") {
          try {
            const alert = new Alert();
            alert.title = "新增账号";
            alert.message = "添加账号数据";
            alert.addTextField("账号标识名字", "");
            alert.addTextField("Cookie", "");
            alert.addTextField("团队 ID（个人账号使用 -1）", "-1");
            alert.addAction("确定");
            alert.addCancelAction("取消");
            const alertIndex = await alert.presentAlert();
            if (alertIndex === -1) continue;
            const account = {
              accountName: alert.textFieldValue(0).trim(),
              cookie: alert.textFieldValue(1).trim(),
              teamId: alert.textFieldValue(2).trim() || "-1",
            };
            if (account && account.accountName && account.cookie) {
              account.teamId = parseInt(String(account.teamId)) || -1;
              if (!this.settings.dataSource) this.settings.dataSource = [];
              this.settings.dataSource.push(account);
              this.settings.dataSource =
                this.settings.dataSource.filter(Boolean);
              this.saveSettings();
              await this.rebuildAccountList(webView);
              await this.resetPendingAction(webView);
            }
          } catch (err) {
            console.log("add account error:", err);
            await this.resetPendingAction(webView);
          }
        }
      }
    } catch (e) {
      console.log("manageAccounts 主循环错误:", e);
      const alert = new Alert();
      alert.title = "账号管理加载失败";
      alert.message = String(e);
      alert.addAction("确定");
      await alert.presentAlert();
    }
  }
  async editAccount(index, account) {
    try {
      const alert = new Alert();
      alert.title = "修改账号";
      alert.message = "修改账号信息";
      alert.addTextField("账号标识名字", account.accountName || "");
      alert.addTextField("Cookie", account.cookie || "");
      alert.addTextField(
        "团队 ID（个人账号使用 -1）",
        String(account.teamId || -1),
      );
      alert.addAction("确定");
      alert.addCancelAction("取消");
      const result = await alert.presentAlert();
      if (result === -1) return false;
      const editedAccount = {
        accountName: alert.textFieldValue(0).trim(),
        cookie: alert.textFieldValue(1).trim(),
        teamId: alert.textFieldValue(2).trim() || "-1",
      };
      if (editedAccount.accountName && editedAccount.cookie) {
        editedAccount.teamId = parseInt(String(editedAccount.teamId)) || -1;
        const dataSource = this.settings.dataSource || [];
        dataSource[index] = editedAccount;
        this.settings.dataSource = dataSource;
        const isDefaultAccount =
          this.settings.account &&
          this.settings.account.accountName === account.accountName;
        if (isDefaultAccount) {
          this.settings.account = editedAccount;
          if (editedAccount.accountName !== account.accountName) {
            this.settings.accountSettings = this.settings.accountSettings || {};
            this.settings.accountSettings.defaultAccount =
              editedAccount.accountName;
            this.syncCurrentSettings(
              "accountSettings",
              "defaultAccount",
              editedAccount.accountName,
            );
          }
        }
        this.saveSettings();
        return {
          success: true,
          isDefaultAccount,
          newName: editedAccount.accountName,
        };
      }
      const errorAlert = new Alert();
      errorAlert.title = "错误";
      errorAlert.message = "请填写完整的账号信息";
      errorAlert.addAction("确定");
      await errorAlert.presentAlert();
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async copyAccount(index, account) {
    try {
      const copiedAccount = {
        accountName: account.accountName + " 副本",
        cookie: account.cookie || "",
        teamId: account.teamId || -1,
      };
      const alert = new Alert();
      alert.title = "复制账号";
      alert.message = "请输入新账号的标识名字";
      alert.addTextField("账号标识名字", copiedAccount.accountName);
      alert.addAction("确定");
      alert.addCancelAction("取消");
      const result = await alert.presentAlert();
      if (result === -1) return false;
      const newName = alert.textFieldValue(0) || copiedAccount.accountName;
      if (newName.trim()) copiedAccount.accountName = newName.trim();
      const dataSource = this.settings.dataSource || [];
      dataSource.splice(index + 1, 0, copiedAccount);
      this.settings.dataSource = dataSource;
      this.saveSettings();
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async deleteAccount(index, account) {
    try {
      const alert = new Alert();
      alert.title = "确认删除";
      alert.message = `确定要删除账号 "${account.accountName}" 吗？`;
      alert.addCancelAction("取消");
      alert.addDestructiveAction("删除");
      const result = await alert.presentAlert();
      if (result === 0) {
        const dataSource = this.settings.dataSource || [];
        dataSource.splice(index, 1);
        this.settings.dataSource = dataSource;
        const isDefaultAccount =
          this.settings.account?.accountName === account.accountName;
        if (isDefaultAccount) {
          this.settings.account = null;
          await this.updateDefaultAccount("请选择或者添加账号");
        } else {
          this.saveSettings(false);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  getDailyDisplaySettingsDisplay() {
    return `${this.currentSettings.dailyDisplaySettings.mediaWidgetShowDataNum.val}/${this.currentSettings.dailyDisplaySettings.largeWidgetShowDataNum.val}`;
  }
  getAggregatedDisplaySettingsDisplay() {
    return `${this.currentSettings.aggregatedDisplaySettings.mediaWidgetShowDataNum.val}/${this.currentSettings.aggregatedDisplaySettings.largeWidgetShowDataNum.val}`;
  }
  formatMembershipType(membershipType) {
    if (!membershipType) return "";
    return membershipType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  async requestWithCache(
    cacheKey,
    url,
    requestBody,
    requireCookie = true,
    method = "POST",
  ) {
    const isPlaygroundMockResponse = (value) => {
      if (!value || typeof value !== "object") return false;
      const response = value;
      const meta = response.meta;
      return meta?.mocked === true && meta?.source === "playground";
    };
    const finalCacheKey = `${cacheKey}_${this.currentAccount?.accountName || "default"}`;
    console.log(`[+]请求缓存键: ${finalCacheKey}`);
    try {
      const cachedData = this.storage.getStorage(
        finalCacheKey,
        this.storageExpirationMinutes,
      );
      if (cachedData) {
        if (isPlaygroundMockResponse(cachedData)) {
          console.log(`[+]忽略Playground mock缓存: ${finalCacheKey}`);
        } else {
          console.log(`[+]使用缓存的${finalCacheKey}数据`);
          const cacheTime = this.storage.getStorageTime(finalCacheKey);
          if (cacheTime) {
            this.dataFetchTime = cacheTime;
            this.isDataExpired = false;
          } else {
            this.dataFetchTime = /* @__PURE__ */ new Date();
            this.isDataExpired = false;
          }
          return cachedData;
        }
      }
      let cookie = null;
      if (requireCookie) {
        if (this.currentAccount && this.currentAccount.cookie) {
          cookie = this.currentAccount.cookie;
        }
        if (!cookie) {
          throw new Error("请先设置账号 Cookie");
        }
      }
      const headers = {
        Accept: "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        Origin: "https://cursor.com",
        Referer: "https://cursor.com/cn/dashboard?tab=usage",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      };
      if (method === "POST") {
        headers["Content-Type"] = "application/json";
      }
      if (cookie) {
        headers["Cookie"] = decodeURIComponent(cookie);
      }
      let data;
      if (method === "GET") {
        data = await this.$request.get(url, {
          headers,
        });
      } else {
        const body =
          typeof requestBody === "string"
            ? requestBody
            : JSON.stringify(requestBody);
        data = await this.$request.post(url, {
          headers,
          body,
        });
      }
      if (data) {
        if (isPlaygroundMockResponse(data)) {
          throw new Error("Playground mock响应，未写入缓存");
        }
        this.storage.setStorage(finalCacheKey, data);
        this.dataFetchTime = /* @__PURE__ */ new Date();
        this.isDataExpired = false;
        console.log(
          `[+]${finalCacheKey}数据: ${JSON.stringify(data, null, 2)}`,
        );
      }
      return data;
    } catch (error) {
      console.log(`[+]请求失败: ${error}`);
      const cachedData = this.storage.getStorage(finalCacheKey);
      if (cachedData) {
        console.log(`[+]使用过期缓存${finalCacheKey}数据`);
        const cacheTime = this.storage.getStorageTime(finalCacheKey);
        if (cacheTime) {
          this.dataFetchTime = cacheTime;
          const now = /* @__PURE__ */ new Date();
          this.isDataExpired =
            now.getTime() - new Date(cacheTime).getTime() >
            this.storageExpirationMinutes * 6e4;
        } else {
          this.dataFetchTime = /* @__PURE__ */ new Date();
          this.isDataExpired = true;
        }
        return cachedData;
      }
      throw error;
    }
  }
  // 获取当前使用的账号
  getCurrentAccount() {
    if (this.paramAccountIndex !== null) {
      const dataSource = this.settings.dataSource || [];
      if (dataSource[this.paramAccountIndex]) {
        return dataSource[this.paramAccountIndex];
      }
    }
    if (this.settings.account) {
      return this.settings.account;
    }
    const defaultAccountName = this.getDefaultAccountDisplay();
    if (defaultAccountName && defaultAccountName !== "请选择或者添加账号") {
      const dataSource = this.settings.dataSource || [];
      const account = dataSource.find(
        (acc) => acc.accountName === defaultAccountName,
      );
      if (account) {
        return account;
      }
    }
    return null;
  }
  async getUsageSummary() {
    try {
      this.currentAccount = this.getCurrentAccount();
      if (!this.currentAccount || !this.currentAccount.cookie) {
        return;
      }
      const data = await this.requestWithCache(
        "usageSummary",
        "https://cursor.com/api/usage-summary",
        null,
        true,
        "GET",
      );
      if (data && data.billingCycleStart && data.billingCycleEnd) {
        this.usageSummary = data;
        const startDate = new Date(data.billingCycleStart);
        const endDate = new Date(data.billingCycleEnd);
        console.log(
          `[+]账单周期: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        );
        if (data.individualUsage && data.individualUsage.plan) {
          const planUsage = data.individualUsage.plan;
          const autoPercent = planUsage.autoPercentUsed || 0;
          const apiPercent = planUsage.apiPercentUsed || 0;
          const totalPercent = planUsage.totalPercentUsed || 0;
          console.log(
            `[+]Auto用量: ${autoPercent.toFixed(2)}% | API用量: ${apiPercent.toFixed(2)}% | 总用量: ${totalPercent.toFixed(2)}%`,
          );
        }
        if (data.membershipType) {
          console.log(`[+]会员类型: ${data.membershipType}`);
        }
      }
    } catch (error) {
      console.log(`获取用量摘要失败: ${error}`);
    }
  }
  async getDailyUsageData() {
    this.isRequestSuccess = false;
    try {
      let startDate, endDate;
      if (
        this.usageSummary &&
        this.usageSummary.billingCycleStart &&
        this.usageSummary.billingCycleEnd
      ) {
        startDate = new Date(this.usageSummary.billingCycleStart);
        endDate = new Date(this.usageSummary.billingCycleEnd);
      } else {
        endDate = /* @__PURE__ */ new Date();
        startDate = /* @__PURE__ */ new Date();
        const daysToQuery =
          this.widgetFamily === "medium"
            ? this.currentSettings.dailyDisplaySettings.mediaWidgetShowDataNum
                .val
            : this.currentSettings.dailyDisplaySettings.largeWidgetShowDataNum
                .val;
        startDate.setDate(endDate.getDate() - daysToQuery);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      const requestBody = {
        periodStartMs: startDate.getTime(),
        periodEndMs: endDate.getTime(),
        groupBy: 1,
        // 按类别分组
        spendType: 3,
        // 花费类型
      };
      const data = await this.requestWithCache(
        "dailyUsage",
        "https://cursor.com/api/dashboard/get-daily-spend-by-category",
        requestBody,
      );
      if (data && data.dailySpend) {
        this.usageData = data;
        this.isRequestSuccess = true;
      } else if (data && Object.keys(data).length === 0) {
        this.usageData = { dailySpend: [] };
        this.isRequestSuccess = true;
        console.log("[*]周期内暂无用量数据");
      } else {
        throw new Error("数据格式异常，可能认证失败");
      }
    } catch (error) {
      console.log(`获取失败: ${error}`);
      const cachedData = this.storage.getStorage("dailyUsage");
      if (cachedData) {
        this.usageData = cachedData;
        this.isRequestSuccess = true;
      }
    }
  }
  async getAggregatedData() {
    this.isRequestSuccess = false;
    try {
      let startDate, endDate;
      if (
        this.usageSummary &&
        this.usageSummary.billingCycleStart &&
        this.usageSummary.billingCycleEnd
      ) {
        startDate = new Date(this.usageSummary.billingCycleStart);
        endDate = new Date(this.usageSummary.billingCycleEnd);
      } else {
        endDate = /* @__PURE__ */ new Date();
        startDate = /* @__PURE__ */ new Date();
        startDate.setDate(endDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      const teamId =
        this.currentAccount?.teamId !== void 0
          ? parseInt(String(this.currentAccount.teamId))
          : -1;
      const requestBody = {
        teamId,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
      };
      const data = await this.requestWithCache(
        "aggregatedUsage",
        "https://cursor.com/api/dashboard/get-aggregated-usage-events",
        requestBody,
      );
      if (data && data.aggregations) {
        this.aggregatedData = data;
        this.isRequestSuccess = true;
        const totalTokens =
          parseTokenCount(data.totalInputTokens) +
          parseTokenCount(data.totalOutputTokens) +
          parseTokenCount(data.totalCacheWriteTokens) +
          parseTokenCount(data.totalCacheReadTokens);
        const totalCost = data.totalCostCents || 0;
        console.log(
          `[+]总用量: ${this.formatTokens(totalTokens.toString())} tokens | US$${this.formatSpend(totalCost)} Included`,
        );
      } else if (data && Object.keys(data).length === 0) {
        this.aggregatedData = { aggregations: [] };
        this.isRequestSuccess = true;
        console.log("[*]周期内暂无总用量数据");
      } else {
        throw new Error("数据格式异常，可能认证失败");
      }
    } catch (error) {
      console.log(`获取总用量失败: ${error}`);
      const cachedData = this.storage.getStorage("aggregatedUsage");
      if (cachedData) {
        this.aggregatedData = cachedData;
        this.isRequestSuccess = true;
      }
    }
  }
  formatDate(timestamp) {
    const date = new Date(parseInt(String(timestamp)));
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  }
  formatSpend(cents) {
    return (cents / 100).toFixed(2);
  }
  formatOnDemandUsage(onDemandUsage) {
    if (!onDemandUsage || !onDemandUsage.enabled) {
      return "";
    }
    const used = onDemandUsage.used || 0;
    const limit = onDemandUsage.limit || 0;
    if (limit <= 0) {
      return "";
    }
    return `US$${this.formatSpend(used)} / ${this.formatSpend(limit)}`;
  }
  formatTokens(tokens) {
    const num = parseInt(String(tokens));
    if (num >= 1e8) {
      return (num / 1e8).toFixed(1) + "亿";
    } else if (num >= 1e4) {
      return (num / 1e4).toFixed(1) + "万";
    }
    return num.toString();
  }
  groupByDay(dailySpend) {
    const grouped = {};
    dailySpend.forEach((item) => {
      const day = item.day;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(item);
    });
    return grouped;
  }
  calculateDayTotal(items) {
    return items.reduce((sum, item) => sum + item.spendCents, 0);
  }
  Run() {
    try {
      this.currentAccount = this.getCurrentAccount();
      const defaultAccountDisplayValue = this.getDefaultAccountDisplay();
      if (
        this.currentSettings.accountSettings &&
        this.currentSettings.accountSettings.defaultAccount
      ) {
        this.currentSettings.accountSettings.defaultAccount.val =
          defaultAccountDisplayValue;
      }
    } catch (error) {
      console.log(error);
    }
    if (config.runsInApp) {
      this.registerSettingCategory("dailyDisplaySettings", "日用量显示设置", [
        {
          title: "显示模式",
          desc: "缺省值: 每日详情",
          icon: { name: "rectangle.3.group", color: "#FF9500" },
          type: "select",
          option: {
            displayMode: "每日详情",
          },
          config: {
            selectOptions: [
              { label: "每日详情", value: "每日详情" },
              { label: "套餐概览", value: "套餐概览" },
            ],
            defaultShowContent: "每日详情",
            multiple: false,
          },
        },
        {
          title: "中组件数据条数",
          desc: "中组件显示的每日用量条数\n缺省值：1",
          icon: { name: "number.square", color: "#5BD078" },
          type: "text",
          option: {
            mediaWidgetShowDataNum: "1",
          },
          config: {
            placeholder: "1",
            style: "compact",
          },
        },
        {
          title: "大组件数据条数",
          desc: "大组件显示的每日用量条数\n缺省值：10",
          icon: { name: "number.square", color: "#3478F6" },
          type: "text",
          option: {
            largeWidgetShowDataNum: "10",
          },
          config: {
            placeholder: "10",
            style: "compact",
          },
        },
        {
          title: "数据条目颜色",
          desc: "缺省值: 随机颜色",
          icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png",
          type: "select",
          option: {
            listDataColorShowType: "随机颜色",
          },
          config: {
            selectOptions: [
              { label: "组件文本颜色", value: "组件文本颜色" },
              { label: "随机颜色", value: "随机颜色" },
            ],
            defaultShowContent: "随机颜色",
            multiple: false,
          },
        },
        {
          title: "数据更新时间",
          desc: "缺省值: 显示",
          icon: { name: "arrow.clockwise", color: "#D11D0C" },
          type: "select",
          option: {
            listDataUpdateTimeShowType: "显示",
          },
          config: {
            selectOptions: [
              { label: "显示", value: "显示" },
              { label: "不显示", value: "不显示" },
            ],
            defaultShowContent: "显示",
            multiple: false,
          },
        },
      ]);
      this.registerSettingCategory(
        "aggregatedDisplaySettings",
        "总用量显示设置",
        [
          {
            title: "中组件数据条数",
            desc: "中组件显示的总用量条数\n缺省值：4",
            icon: { name: "number.square", color: "#5BD078" },
            type: "text",
            option: {
              mediaWidgetShowDataNum: "4",
            },
            config: {
              placeholder: "4",
              style: "compact",
            },
          },
          {
            title: "大组件数据条数",
            desc: "大组件显示的总用量条数\n缺省值：15",
            icon: { name: "number.square", color: "#3478F6" },
            type: "text",
            option: {
              largeWidgetShowDataNum: "15",
            },
            config: {
              placeholder: "15",
              style: "compact",
            },
          },
          {
            title: "显示总百分比用量",
            desc: "是否显示总百分比用量\n缺省值: 开启",
            icon: { name: "percent", color: "#FF9500" },
            type: "switch",
            option: {
              showAggregatedPercentage: true,
            },
            config: {
              toggleSelect: true,
            },
          },
          {
            title: "数据条目颜色",
            desc: "缺省值: 随机颜色",
            icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png",
            type: "select",
            option: {
              listDataColorShowType: "随机颜色",
            },
            config: {
              selectOptions: [
                { label: "组件文本颜色", value: "组件文本颜色" },
                { label: "随机颜色", value: "随机颜色" },
              ],
              defaultShowContent: "随机颜色",
              multiple: false,
            },
          },
          {
            title: "数据更新时间",
            desc: "缺省值: 显示",
            icon: { name: "arrow.clockwise", color: "#D11D0C" },
            type: "select",
            option: {
              listDataUpdateTimeShowType: "显示",
            },
            config: {
              selectOptions: [
                { label: "显示", value: "显示" },
                { label: "不显示", value: "不显示" },
              ],
              defaultShowContent: "显示",
              multiple: false,
            },
          },
        ],
      );
      this.registerSetting({
        title: "账号管理",
        icon: { name: "person.crop.circle.badge.plus", color: "#3E9BF7" },
        onAction: async (parentWebView) => {
          await this.manageAccounts();
          await this.reloadSettingsFromStorage();
          const display = this.getDefaultAccountDisplay();
          if (parentWebView && this.defaultAccountElementId) {
            try {
              await this.insertTextByElementId(
                parentWebView,
                this.defaultAccountElementId,
                display,
              );
              await this.updateSettingDisplay(
                parentWebView,
                "actionSettings",
                "defaultAccount",
                display,
              );
            } catch (e) {
              console.log("update default account setting display error:", e);
            }
          }
          return true;
        },
        type: "text",
        option: {
          defaultAccount:
            this.currentSettings.accountSettings.defaultAccount.val ||
            "请选择或者添加账号",
        },
      });
      this.defaultAccountElementId = this.getSettingElementId(
        "actionSettings",
        "defaultAccount",
      );
      this.registerSetting({
        title: "日用量显示设置",
        icon: { name: "chart.bar.fill", color: "#52c41a" },
        onAction: async () => {
          await this.presentSettings(["dailyDisplaySettings"]);
          return true;
        },
      });
      this.registerSetting({
        title: "总用量显示设置",
        icon: { name: "chart.pie.fill", color: "#722ed1" },
        onAction: async () => {
          await this.presentSettings(["aggregatedDisplaySettings"]);
          return true;
        },
      });
      this.registerSetting({
        title: "显示模式",
        icon: { name: "chart.bar", color: "#52c41a" },
        saveCategory: this.basicSettingsCategoryName,
        type: "select",
        option: {
          displayMode:
            this.currentSettings.basicSettings.displayMode.val || "每日用量",
        },
        config: {
          selectOptions: this.displayModeOptions,
          defaultShowContent: "每日用量",
          multiple: false,
        },
      });
    }
    try {
      if (this.widgetParam) {
        const params = this.widgetParam.split(",");
        if (params[0] !== void 0 && params[0].trim()) {
          this.paramDisplayMode = params[0].trim();
        }
        if (params[1] !== void 0 && params[1].trim()) {
          const index = parseInt(params[1].trim());
          if (!isNaN(index)) {
            this.paramAccountIndex = index;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  getMaxSpend(days, grouped) {
    let max = 0;
    days.forEach((day) => {
      const total = this.calculateDayTotal(grouped[day]);
      if (total > max) max = total;
    });
    return max;
  }
  getCategoryColor(category, allCategories = []) {
    if (category === "default") {
      return "#87CEEB";
    }
    const index = allCategories.indexOf(category);
    if (index >= 0 && index < this.categoryColors.length) {
      return this.categoryColors[index];
    }
    return "#95A5A6";
  }
  // 获取行文本颜色（支持随机颜色模式）
  getRowTextColor(isRandomColor) {
    return isRandomColor ? new Color(Utils.randomColor16()) : this.widgetColor;
  }
  // 渲染模型详情行（抽离公共逻辑）
  renderCategoryDetailRow(
    w,
    category,
    spendCents,
    total,
    allCategories,
    textColor,
    padding = 50,
  ) {
    const percentage =
      total > 0 ? ((spendCents / total) * 100).toFixed(1) : "0";
    const spendColumnWidth = 72;
    const detailStack = w.addStack();
    detailStack.layoutHorizontally();
    detailStack.centerAlignContent();
    detailStack.spacing = 6;
    detailStack.setPadding(0, 0, 0, padding);
    const colorBox = detailStack.addStack();
    colorBox.backgroundColor = new Color(
      this.getCategoryColor(category, allCategories),
    );
    colorBox.size = new Size(10, 10);
    colorBox.cornerRadius = 2;
    const categoryText = detailStack.addText(category);
    categoryText.textColor = textColor;
    categoryText.font = Font.systemFont(9);
    categoryText.textOpacity = spendCents > 0 ? 0.7 : 0.4;
    categoryText.minimumScaleFactor = 0.7;
    categoryText.lineLimit = 1;
    detailStack.addSpacer();
    const spendText = detailStack.addText(
      `$${this.formatSpend(spendCents)} (${percentage}%)`,
    );
    spendText.textColor = textColor;
    spendText.font = Font.systemFont(9);
    spendText.textOpacity = spendCents > 0 ? 0.6 : 0.3;
    spendText.rightAlignText();
    spendText.lineLimit = 1;
    spendText.minimumScaleFactor = 0.8;
    spendText.size = new Size(spendColumnWidth, 12);
    w.addSpacer(2);
  }
  // 按类别排序items
  sortItemsByCategory(items, allCategories) {
    return items.slice().sort((a, b) => {
      const indexA = allCategories.indexOf(a.category);
      const indexB = allCategories.indexOf(b.category);
      return indexA - indexB;
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
EndAwait(() => Runing(CursorMonitor, args.widgetParameter, false));

await __topLevelAwait__();
