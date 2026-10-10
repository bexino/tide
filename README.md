[![在线体验](https://img.shields.io/badge/在线体验-使用简体中文-red)](https://github.com/bexino/siss)
[![EnglishOnlineDEMO](https://img.shields.io/badge/Try_our_online_demo-In_English-orange)](https://bexino.github.io/siss/?lang=en)
[![EnglishREADME](https://img.shields.io/badge/README.md-In_English-yellow)](#English)
[![Commit Activity](https://img.shields.io/github/commit-activity/t/bexino/siss?color=green)](https://github.com/bexino/siss/commits/main/)
[![License](https://img.shields.io/github/license/bexino/siss?color=blue)](https://github.com/bexino/siss/blob/main/LICENSE)
[![MadeWith♥](https://img.shields.io/badge/@bexino-用_♥_制作-purple)](https://github.com/bexino)
[![ViewInGithub](https://img.shields.io/badge/Github-bexino%2Fsiss-white?logo=github&logoColor=auto&labelColor=555555&color=000000)](https://github.com/bexino/siss/)

# 能工智人排版系统

一个简单实用的静态排班工具：通过用户友好向导生成值班表，可确保每个人承担的班次数量完全相等。

## 快速开始

[![](https://img.shields.io/badge/点击访问在线演示-orange)](https://github.com/bexino/siss)

## 特性

| 特性         | 简介                                                     |
| ------------ | -------------------------------------------------------- |
| 用户友好向导 | 流程清晰，按照流程即可快速生成排班；                     |
| 绝对公平     | 基于最小无余数周期算法，保证每位成员的值班次数完全相同； |
| 节假日支持   | 支持手动添加节假日与调休补班日；                         |
| 灵活编辑     | 可手动修改排班人次顺序，系统自动验证；                   |
| 长假维护     | 导入旧排班表可重新按照新日期编排。                       |

## 格式

#### 导出

| 格式     | 扩展名  | 说明                                                         | **是否可用于导入** |
| -------- | ------- | ------------------------------------------------------------ | ------------------ |
| 网页     | `.html` | 若需在线访问，需自行部署；                                   | N                  |
| PDF      | `.pdf`  | **需导出为 HTML 后，方可导出。**                             | N                  |
| 表格     | `.csv`  | - **日期若显示为一行井号 `#`，需自行加宽单元格列宽；**<br />- `csv`  不支持格式的保存，故您需要自行另存为 `xlsx` 等格式； | Y                  |
| Markdown | 纯文本  | 可用于修改人次顺序的主要格式；<br />您也可以自行保存为 `.md` 格式，但网站目前仅提供一键复制。 | Y                  |

## 技术细节

### 技术栈

HTML Only + JavaScript Native.

### 项目结构

```
├── index.html       # 页面结构与步骤面板
├── css/style.css    # 自定义样式
├── js/scheduler.js  # 纯排班逻辑（无 DOM 依赖）
└── js/app.js        # 界面交互与状态管理
```

### 本地部署

> [!TIP]
> 无需编译、无需构建、无需配置；  
> 直接打开 `index.html` 即可。

> [!NOTE]
> - 核心算法位于 `js/scheduler.js`，可在 Node 中快速验证，例如：
> 
> ```bash
> node -e "console.log(require('./js/scheduler.js').calculateCycle(22,4))"
> ```

## 许可证

Apache-2.0 license

---

# English
# SI Scheduling System

A simple and practical static scheduling tool: it generates duty rosters through a user-friendly wizard and ensures that the number of shifts undertaken by each person is exactly equal.

## Quick Start

[![EnglishOnlineDEMO](https://img.shields.io/badge/Try_our_online_demo-In_English-blue)](https://bexino.github.io/siss/?lang=en)

## Features

| Feature              | Introduction                                                                 |
| -------------------- | ---------------------------------------------------------------------------- |
| User-friendly wizard | The process is clear, and a schedule can be generated quickly by following it; |
| Absolute fairness    | Based on the minimum no-remainder cycle algorithm, it ensures that each member's duty count is exactly the same; |
| Holiday support      | Supports manually adding holidays and makeup workdays;                        |
| Flexible editing     | The order of assigned personnel can be modified manually, with automatic validation by the system; |
| Long-holiday maintenance | Importing an old schedule allows rescheduling according to new dates.     |

## Formats

#### Export

| Format   | Extension | Description                                                  | **Can be used for import** |
| -------- | --------- | ------------------------------------------------------------ | -------------------------- |
| Webpage  | `.html`   | If online access is required, you must deploy it yourself;    | N                          |
| PDF      | `.pdf`    | **It must be exported as HTML before it can be exported.**    | N                          |
| Spreadsheet | `.csv` | - **If dates are displayed as a row of hash marks, you need to widen the cell column width yourself;**<br />- `csv` does not support saving cell column widths, so you need to save it yourself as `xlsx` or another format; | Y                          |
| Markdown | Plain text | The main format that can be used to modify the order of assigned personnel;<br />You can also save it yourself as `.md`, but the website currently only provides one-click copy. | Y                          |

## Technical Details

### Tech Stack

HTML Only + JavaScript Native.

### Project Structure

```
├── index.html       # Page structure and step panels
├── css/style.css    # Custom styles
├── js/scheduler.js  # Pure scheduling logic (no DOM dependency)
└── js/app.js        # UI interaction and state management
```

### Local Deployment

> [!TIP]
> No compilation, no build, no configuration required;  
> Simply open `index.html`.

> [!NOTE]
> - The core algorithm is located in `js/scheduler.js` and can be quickly verified in Node, for example:
>
> ```bash
> node -e "console.log(require('./js/scheduler.js').calculateCycle(22,4))"
> ```

## License

Apache-2.0 license