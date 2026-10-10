/**
 * 在线排班系统 - 交互与状态控制模块
 */

// 界面语言判定：仅当网址参数 lang=en 时启用英文模式（供 scheduler.js 与本模块共用）
window.APP_LANG = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';

// 英文模式下替换静态 HTML 文案与动态字符串；zh 模式保留原文不翻译
const I18N = {
  en: {
    siteTitle: 'SI Scheduling System',
    // 步骤导览菜单
    menuHome: 'Home', menuNames: 'Names & Headcount', menuRotation: 'Rotation Check',
    menuStartDate: 'Start Date', menuHolidays: 'Holidays', menuDone: 'Generated',
    menuBackHome: 'Home', menuImport: 'Import Old Roster', menuCheckDates: 'Check Dates', menuPickDates: 'Pick Dates',
    current: 'Current',
    // 通用
    continue: 'Continue', done: 'Finish', back: 'Back', restart: 'Start Over',
    reset: 'Reset', modify: 'Edit', reshuffle: 'Reshuffle', copy: 'Copy', copyMarkdownText: 'Copy Markdown text',
    cards: 'Cards', table: 'Table', text: 'Text',
    person: 'people', personUnit: 'ppl',
    dayUnit: 'days', timeUnit: 'times',
    // 主页
    startNew: 'Start New Schedule',
    continueFromOld: 'Continue From an Old Roster',
    langToggle: '中文',
    // 步骤 1
    namesLabel: 'People List', recognized: 'recognized', recognizedBadge: '${n} people recognized', loadSample: 'Load Sample (22)', clear: 'Clear',
    namesPlaceholder: 'Enter names, separated by commas or line breaks, e.g.:\nAlice, Bob, Carol, Dave, Eve',
    namesHint: 'Separate names with line breaks or commas.',
    dailyCountLabel: 'People on Duty per Day',
    perDayUnit: 'people / day',
    cycleHintIdle: 'The minimal cycle without remainder will be calculated automatically after you enter the list.',
    waitTyping: 'Waiting for input...',
    cycleNeeds: 'Days needed: ',
    shiftsEach: 'Shifts per person: ',
    totalShifts: 'Total shifts: ',
    daysExact: ' days exactly',
    warningFewer: '⚠️ Total people (${n}) is fewer than people per day (${k}). Add more people or reduce the daily headcount.',
    errEnterNames: 'Please enter at least one name first',
    errFewerPeople: 'Total people (${n}) cannot be fewer than people per day (${k})',
    // 步骤 2
    statTotalPeople: 'Total People', statDailyPeople: 'People per Day',
    statTotalDays: 'Days in Cycle', statShiftsEach: 'Shifts per Person',
    tabDaysView: 'Date view: ', tabPeopleView: 'People view: ',
    eachPerson: 'each', timesEach: ' shifts',
    dayN: 'Day ${d}', nPeople: '${n} ppl', totalNTimes: '${n} shifts in total',
    rotationSaved: 'Rotation updated and passed the strict no-remainder balance check!',
    success: 'Done', successReset: 'Reset done', error: 'Error',
    // 手动修改弹窗
    modalTitle: 'Manual Edit', close: 'Close',
    modalNoticeTitle: 'Please note:',
    modalNotice: 'Only the order of people can be adjusted. Day count or headcount mismatches will be rejected.',
    modalCheckFailed: 'Validation failed. Please fix the following problems:',
    modalEditLabel: 'Edit text (Markdown):',
    cancel: 'Cancel', save: 'Save',
    // 步骤 3
    startDateLabel: 'Start Date',
    nonWorkday: 'This date is ${w} (a non-workday). Scheduling will begin on the nearest workday or adjusted workday.',
    workday: 'Start date is <span class="text-indigo-600 font-semibold">${w}</span> (a workday).',
    // 步骤 4
    holidayTitle: 'Holidays',
    rangeTo: 'to',
    findSingleDay: 'Find a Single Day', pickOne: 'Select', ariaFindSingleDay: 'Find a single day',
    setStateHoliday: 'Day off', setStateHolidayTitle: 'Set as day off: skipped',
    setStateWorkday: 'Work', setStateWorkdayTitle: 'Set as workday: adjusted makeup workday',
    restoreInitial: 'Restore', legendDefault: 'Default workday', legendWeekend: 'Weekend',
    legendHoliday: 'Manual holiday', legendMakeup: 'Adjusted makeup workday',
    monthNav: 'Month', jumpStartMonth: 'To start month', jumpEndMonth: 'To end month',
    selectedLabel: 'Selected:',
    offTag: 'Off', makeupTag: 'Makeup', undoHoliday: 'Undo day off', undoMakeup: 'Undo makeup workday',
    sunShort: 'Sun.', monShort: 'Mon.', tueShort: 'Tue.', wedShort: 'Wed.', thuShort: 'Thu.', friShort: 'Fri.', satShort: 'Sat.',
    // 快速日期状态
    qUnselected: 'Select', qOutside: 'This day is: outside the schedule range',
    qManualHoliday: 'This day is: manual holiday', qMakeup: 'This day is: adjusted makeup workday',
    qWeekend: 'This day is: weekend', qDefault: 'This day is: default workday',
    // 日历提示与交互
    onlyInRange: 'Only dates within ${s} to ${e} can be selected',
    cellDisabled: ' [Not selectable] Only dates between the start date and the actual schedule end date can be modified',
    cellWorkday: ' [Day ${d} of the schedule] Click to set as day off',
    cellHoliday: ' [Day off] Click to restore workday',
    cellWeekend: ' [Weekend] Click to set as adjusted makeup workday',
    restoredWork: 'Workday restored: ${d}', restoredInitial: 'Restored to initial state: ${d}',
    setMakeup: '${d} set as an adjusted workday!', setOff: '${d} set as a day off',
    pickDateFirst: 'Please pick a date first',
    alreadyHoliday: 'This date is already a manual holiday', errDefaultToMakeup: 'Default workdays cannot be set as adjusted makeup workdays',
    noMakeupNeeded: 'Default workdays do not need a makeup day', errWeekendHoliday: 'Weekends cannot be set as manual holidays',
    alreadyInitial: 'This date is already in its initial state',
    // 步骤 5 与导出
    searchPlaceholder: 'Search by name, date or weekday...',
    foundDays: 'Found <b>${n}</b> days (matching “${q}”)', totalDaysLabel: '${n} days in total',
    noResults: 'No schedule records match the current keyword',
    filterThis: 'Click to filter this person’s shifts',
    copied: 'Schedule Markdown copied to the clipboard!',
    csvExported: 'Schedule CSV file exported and downloading!',
    csvExportConfirm: 'Note before exporting CSV:\n• If a date is displayed as a row of hash symbols ("#") after opening, you need to widen the cell column yourself.\n• CSV does not support saving formatting, so you need to save the file as xlsx or another format yourself.\n\nExport CSV anyway?',
    htmlExported: 'Standalone schedule HTML file exported',
    confirmRestart: 'Start over? All current settings will be reset.',
    confirmRestartEdit: 'Start over with the old roster? Imported content and settings will be reset.',
    makeupBadge: 'Makeup', makeupShort: 'M',
    // 独立 HTML 导出
    standaloneTitle: 'Schedule', standaloneTitleFull: 'Schedule (${s} to ${e})',
    standaloneRange: 'Schedule period: ${s} to ${e} <br> Click a name to filter quickly.',
    stTotalPeople: 'Total People', stDailyPeople: 'People per Day', stTotalDays: 'Days in Cycle', stShiftsEach: 'Shifts per Person',
    stNo: 'No.', stDate: 'Date', stWeekday: 'Weekday', stDuty: 'On Duty',
    stEmpty: 'No schedule records match the keyword',
    stSuccess: 'Operation successful',
    csvName: 'Schedule_${s}_to_${e}', htmlName: 'Schedule_${s}_to_${e}',
    // 顺延自旧排班表
    importOldTitle: 'Import Old Roster', importOldHint: 'Import an existing roster as the basis for re-scheduling.<br><b>Only CSV files or Markdown text exported by this system are supported.</b>',
    method1: 'Method 1: Upload a CSV file', pickFile: 'Choose file', or: 'or',
    method2: 'Method 2: Paste Markdown text',
    importPlaceholder: '## 2026-09-01, Tue.\nAlice, Bob, Carol\n\n## 2026-09-02, Wed.\nDave, Eve, Frank',
    checkDatesTitle: 'Check Dates',
    checkDatesHint: 'How far has the old roster been executed? Dates up to and including the selected date will be ignored.',
    throughLabel: 'Executed through (inclusive)',
    selectThrough: 'Select the executed-through date',
    importedNTotal: 'Imported <b>${n}</b> days in total;<br>', importedNExec: 'Executed <b>${n}</b> days;<br>', importedNRemain: '<b>${n}</b> days remain to be re-scheduled.',
    pickThroughFirst: '${n} days in total · Please select the executed-through date',
    executedBadge: 'Done', remainBadge: 'Remaining shift ${n}', dayNBadge: 'Day ${d}',
    errThroughEarly: 'The executed-through date cannot be earlier than the first imported day (${d}): at least 1 day must have been executed.',
    errThroughEarlyToast: 'Executed-through date is too early; at least 1 day must have been executed',
    throughHint: 'Executed through <span class="text-indigo-600 font-semibold">${w}</span>;<br>shifts on and before this day will be ignored.',
    pickStartDate: 'New Start Date',
    genNewRoster: 'Generate New Schedule',
    errImportFirst: 'Please import the old roster first', errPickThrough: 'Please select the executed-through date first',
    errNoRemaining: 'No remaining shifts to re-schedule', errPickNewStart: 'Please select the new start date first',
    parseProblems: 'Problems found while parsing:',
    parseFailed: 'Parsing failed. Please check the content format',
    parseWarn: 'Parsed ${n} days (with ${w} warning(s))', parseOk: 'Parsed ${n} days of roster records!',
    fileReadFailed: 'Failed to read the file. Please try again',
    errNotEnoughDays: 'Not enough workdays: ${need} days are needed but only ${have} were found. Please check the holiday settings',
    // 页脚
    footerAria: 'Footer',
    // 步骤菜单"当前"
    stepMenuHint4: '- Click a workday: switch to day off (Off);<br>- Click a rest day: switch to adjusted makeup workday (Makeup).',
    successHint: ''
  }
};

// 按键取英文文案；zh 模式（或缺失键）返回 undefined，调用处保留中文原文
function t(key) {
  return window.APP_LANG === 'en' ? I18N.en[key] : undefined;
}

// 带占位符 ${x} 的简单模板填充
function tf(key, vars) {
  const tpl = t(key);
  if (tpl === undefined) return undefined;
  return tpl.replace(/\$\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
}

// 静态 HTML 中文文案 → 英文译文（按原文精确匹配；代码注释不翻译）
const STATIC_I18N = {
  // 标题与主页
  '能工智人排班系统': 'SI Scheduling System',
  '点击回到主页': 'Click to go home',
  '开始新的排班': 'Start New Schedule',
  '顺延自旧排班表': 'Continue From an Old Roster',
  // 步骤标题
  '主页': 'Home',
  '名单与人数': 'Names & Headcount',
  '轮换检查': 'Rotation Check',
  '起始日期': 'Start Date',
  '假期修改': 'Holidays',
  '成功生成': 'Generated',
  '导入旧表': 'Import Old Roster',
  '检查日期': 'Check Dates',
  '选择日期': 'Pick Dates',
  '步骤进度导览': 'Step navigation',
  // 步骤 1
  '人员名单列表': 'People List',
  '载入示例 (22人)': 'Load Sample (22)',
  '清空': 'Clear',
  '输入人员姓名，用逗号（全角或半角）或换行分隔，如：\n张三, 李四, 王五，赵六，钱七': 'Enter names, separated by commas or line breaks, e.g.:\nAlice, Bob, Carol, Dave, Eve',
  '请使用换行或逗号分隔，全半角不限。': 'Separate names with line breaks or commas (both fullwidth and halfwidth commas work).',
  '每日值班人数': 'People on Duty per Day',
  '人 / 天': 'people / day',
  '输入名单后将自动计算最小无余数天数。': 'The minimal no-remainder cycle will be calculated automatically after you enter the list.',
  '继续': 'Continue',
  '➔': '➔',
  // 步骤 2
  '修改': 'Edit',
  '重新打乱': 'Reshuffle',
  '总参与人数': 'Total People',
  '每日值班人数 ': 'People per Day',
  '本轮次天数': 'Days in Cycle',
  '每人轮值次数': 'Shifts per Person',
  // 步骤 3
  '⬅ 返回': '⬅ Back',
  // 步骤 4
  '- 点击工作日：切换为放假（休）；': '- Click a workday: switch to a day off (Off);',
  '- 点击休息日：切换为调休补班（补）。': '- Click a rest day: switch to an adjusted makeup workday (Makeup).',
  '排班区间': 'Schedule Period',
  '至': 'to',
  '重置': 'Reset',
  '查找单日': 'Find a Single Day',
  '请选择': 'Select',
  '设为休假：跳过': 'Set as day off: skipped',
  '休': 'Off',
  '设为排班：调休补班': 'Set as workday: adjusted makeup workday',
  '班': 'Work',
  '恢复初始': 'Restore',
  '默认排班': 'Default workday',
  '双休日': 'Weekend',
  '手动节假日': 'Manual holiday',
  '调休补班': 'Adjusted makeup workday',
  '月份切换': 'Month',
  '跳至起始月': 'To start month',
  '跳至结束月': 'To end month',
  '已选择：': 'Selected:',
  '周日': 'Sun.', '周一': 'Mon.', '周二': 'Tue.', '周三': 'Wed.', '周四': 'Thu.', '周五': 'Fri.', '周六': 'Sat.',
  '查找单日 ': 'Find a Single Day',
  // 步骤 5
  '输入姓名、日期或星期搜索...': 'Search by name, date or weekday...',
  '表格': 'Table',
  '卡片': 'Cards',
  '文本': 'Text',
  '序号': 'No.',
  '日期': 'Date',
  '星期': 'Weekday',
  '值班人员': 'On Duty',
  '未找到与当前关键词匹配的排班记录': 'No schedule records match the current keyword',
  '复制': 'Copy',
  '复制 Markdown 文本': 'Copy Markdown text',
  '重新开始': 'Start Over',
  '操作成功': 'Operation successful',
  // 顺延自旧排班表
  '导入现有的排班表，作为重新编排的基础。': 'Import an existing roster as the basis for re-scheduling.',
  '仅支持本系统导出的 CSV 表格文件或 Markdown 文本，': 'Only CSV files or Markdown text exported by this system are supported.',
  '敬请谅解。': '',
  '方式一：上传 CSV 文件': 'Method 1: Upload a CSV file',
  '选取文件': 'Choose file',
  '或': 'or',
  '方式二：粘贴 Markdown 文本': 'Method 2: Paste Markdown text',
  '## 2026-09-01，周二\n张三，李四，王五\n\n## 2026-09-02，周三\n赵六，钱七，孙八': '## 2026-09-01, Tue.\nAlice, Bob, Carol\n\n## 2026-09-02, Wed.\nDave, Eve, Frank',
  '已经执行完毕到了哪一天？选中的日期（含该天）以前的信息将被忽略。': 'How far has the old roster been executed? Dates up to and including the selected date will be ignored.',
  '截止日期（含该天）': 'Executed through (inclusive)',
  '新编排起始日期': 'New Start Date',
  '跳至起始月 ': 'To start month',
  '跳至结束月 ': 'To end month',
  '生成新排班表': 'Generate New Schedule',
  // 弹窗
  '手动修改': 'Manual Edit',
  '关闭': 'Close',
  '请注意：': 'Please note:',
  '仅支持调整人员顺序，天数或人数不匹配将报错。': 'Only the order of people can be adjusted. Day count or headcount mismatches will be rejected.',
  '保存校验未通过，请检查并修正以下问题：': 'Validation failed. Please fix the following problems:',
  '编辑文本 (Markdown)：': 'Edit text (Markdown):',
  '取消': 'Cancel',
  '保存': 'Save',
  // 页脚与其他
  '页脚': 'Footer'
};

// 英文模式下替换静态 HTML 文案：遍历文本节点与 title/placeholder/aria-label 属性
function applyStaticI18n() {
  if (window.APP_LANG !== 'en') return;

  // 文档标题与站名
  document.title = 'SI Scheduling System';
  document.documentElement.lang = 'en';

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach(node => {
    const trimmed = node.nodeValue.trim();
    if (!trimmed || !STATIC_I18N[trimmed]) return;
    const replacement = STATIC_I18N[trimmed];
    // 保留原文两侧空白，仅替换中间内容
    const leading = node.nodeValue.match(/^\s*/)[0];
    const trailing = node.nodeValue.match(/\s*$/)[0];
    node.nodeValue = leading + (replacement === '' ? '' : replacement) + trailing;
  });

  // 属性翻译
  document.querySelectorAll('[title],[placeholder],[aria-label]').forEach(el => {
    ['title', 'placeholder', 'aria-label'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && STATIC_I18N[val]) {
        const rep = STATIC_I18N[val];
        if (rep !== '__LANG_TOGGLE__') el.setAttribute(attr, rep);
      }
    });
  });

  // 语言切换按钮：主页按钮在 index.html 中已绑定 toggleLanguage()，此处仅改显示文字
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0 && el.textContent.trim() === 'English') {
      el.textContent = '中文';
    }
  });

  // 日期/星期表头所在视图切换标签（含嵌套 span 的组合文案；替换后需重新绑定元素引用）
  if (elements.tabStep2Days) {
    elements.tabStep2Days.innerHTML = 'Date view: <span id="preview-days-count"></span> days';
    elements.previewDaysCount = document.getElementById('preview-days-count');
  }
  if (elements.tabStep2People) {
    elements.tabStep2People.innerHTML = 'People view: <span id="preview-shifts-count"></span> shifts each';
    elements.previewShiftsCount = document.getElementById('preview-shifts-count');
  }
}

// 预设示例人员名单 (22人)：中文模式为中文译名，英文模式为英文原名
const SAMPLE_NAMES_TEXT = `诺里斯, 皮亚斯特里, 拉塞尔, 安东内利, 勒克莱尔, 汉密尔顿, 维斯塔潘, 哈贾尔, 阿隆索, 斯特罗尔, 阿尔本, 塞恩斯, 比尔曼, 奥康, 加斯利, 科拉平托, 劳森, 林德布拉德, 霍肯伯格, 博托莱托, 佩雷斯, 博塔斯`;

// 英文模式下的示例名单（与中文名单一一对应）
const SAMPLE_NAMES_TEXT_EN = `Lando Norris, Oscar Piastri, George Russell, Kimi Antonelli, Charles Leclerc, Lewis Hamilton, Max Verstappen, Isack Hadjar, Fernando Alonso, Lance Stroll, Alex Albon, Carlos Sainz, Oliver Bearman, Esteban Ocon, Pierre Gasly, Franco Colapinto, Liam Lawson, Arvid Lindblad, Nico Hulkenberg, Gabriel Bortoleto, Sergio Perez, Valtteri Bottas`;

// 按界面语言取示例名单（parseNames 会把名字内部空格规范为中心点）
function getSampleNamesText() {
  return window.APP_LANG === 'en' ? SAMPLE_NAMES_TEXT_EN : SAMPLE_NAMES_TEXT;
}

// 语言切换：保留 step/editStep 参数，仅在 lang=en 与无参数之间切换
function toggleLanguage() {
  const params = new URLSearchParams(location.search);
  if (window.APP_LANG === 'en') {
    params.delete('lang');
  } else {
    params.set('lang', 'en');
  }
  const qs = params.toString();
  location.href = qs ? `${location.pathname}?${qs}` : location.pathname;
}

// 应用全局状态
const state = {
  currentStep: 1,
  // 当前流程模式：'new' 新建排班 / 'editOld'  顺延自旧排班表
  mode: 'new',
  names: [],
  dailyCount: 4,
  scheduleAssignments: null, // { shuffledNames, dailyAssignments, totalDays, shiftsPerPerson, totalShifts }
  startDateStr: '',
  excludedHolidays: new Set(), // 排除放假的日期 (YYYY-MM-DD)
  manualWorkdays: new Set(),   // 手动加入的排班日 (YYYY-MM-DD，如周末调休补班)
  finalScheduleItems: [],
  markdownText: '',

  //  顺延自旧排班表流程的状态
  editOld: {
    importedItems: [],   // 导入的旧排班表 [{dateStr, weekday, names}]
    executedThrough: '', // 已执行截止日（含该天）YYYY-MM-DD
    remainingItems: [],  // 截止日之后的未执行班次（沿用原顺序）
    newStartDate: '',    // 重新编排的起始日期
    finalItems: [],
    markdownText: ''
  },

  // 月历选择器视图状态 (当前浏览的年月)
  calViewYear: 2026,
  calViewMonth: 8, // 0-11, 8 表示 9月

  // 排班结果视图（手机端默认卡片，电脑端默认表格）
  visualSubView: (typeof window !== 'undefined' && window.innerWidth < 640) ? 'cards' : 'table'
};

//  顺延自旧排班表流程进入时备份新流程的假期设置，返回时恢复
let savedNewHolidays = null;
let savedNewWorkdays = null;

// 按当前模式返回结果视图所需的 DOM 元素集合
function getActiveViewEls() {
  if (state.mode === 'editOld') {
    return {
      cards: elements.editFinalCardsContainer,
      tableBody: elements.editFinalTableBody,
      tableScroll: elements.editFinalTableScrollContainer,
      text: elements.editViewTextContainer,
      markdown: elements.editMarkdownOutput,
      search: elements.editTableSearchInput,
      btnClear: elements.btnEditClearTableSearch,
      stats: elements.editSearchResultStats,
      empty: elements.editTableEmptySearch,
      tabs: { cards: elements.btnEditSubviewCards, table: elements.btnEditSubviewTable, text: elements.btnEditSubviewText }
    };
  }
  return {
    cards: elements.finalCardsContainer,
    tableBody: elements.finalTableBody,
    tableScroll: elements.finalTableScrollContainer,
    text: elements.viewTextContainer,
    markdown: elements.markdownOutput,
    search: elements.tableSearchInput,
    btnClear: elements.btnClearTableSearch,
    stats: elements.searchResultStats,
    empty: elements.tableEmptySearch,
    tabs: { cards: elements.btnSubviewCards, table: elements.btnSubviewTable, text: elements.btnSubviewText }
  };
}

// 按当前模式返回最终排班数据与 Markdown 文本
function getActiveScheduleData() {
  if (state.mode === 'editOld') {
    return { items: state.editOld.finalItems, markdown: state.editOld.markdownText };
  }
  return { items: state.finalScheduleItems, markdown: state.markdownText };
}

// DOM 元素引用
const elements = {
  // 步骤面板
  panels: [
    document.getElementById('panel-step-0'),
    document.getElementById('panel-step-1'),
    document.getElementById('panel-step-2'),
    document.getElementById('panel-step-3'),
    document.getElementById('panel-step-4'),
    document.getElementById('panel-step-5')
  ],

  // 步骤标题导览菜单
  stepMenus: [
    null,
    document.getElementById('step-menu-1'),
    document.getElementById('step-menu-2'),
    document.getElementById('step-menu-3'),
    document.getElementById('step-menu-4'),
    document.getElementById('step-menu-5')
  ],

  // 修改自旧排班表流程的步骤导览菜单（索引 0 未用，1~4 对应各步）
  editStepMenus: [
    null,
    document.getElementById('edit-step-menu-1'),
    document.getElementById('edit-step-menu-2'),
    document.getElementById('edit-step-menu-3'),
    document.getElementById('edit-step-menu-4')
  ],

  // Step 1
  namesInput: document.getElementById('names-input'),
  namesCountBadge: document.getElementById('names-count-badge'),
  btnLoadSample: document.getElementById('btn-load-sample'),
  btnClearNames: document.getElementById('btn-clear-names'),
  dailyCountInput: document.getElementById('daily-count'),
  btnDecreaseDaily: document.getElementById('btn-decrease-daily'),
  btnIncreaseDaily: document.getElementById('btn-increase-daily'),
  step1CycleHint: document.getElementById('step-1-cycle-hint'),
  step1Error: document.getElementById('step-1-error'),
  btnToStep2: document.getElementById('btn-to-step-2'),

  // Step 2
  statTotalPeople: document.getElementById('stat-total-people'),
  statDailyPeople: document.getElementById('stat-daily-people'),
  statTotalDays: document.getElementById('stat-total-days'),
  statShiftsPerPerson: document.getElementById('stat-shifts-per-person'),
  previewDaysCount: document.getElementById('preview-days-count'),
  previewShiftsCount: document.getElementById('preview-shifts-count'),
  tabStep2Days: document.getElementById('tab-step2-days'),
  tabStep2People: document.getElementById('tab-step2-people'),
  schedulePreviewList: document.getElementById('schedule-preview-list'),
  schedulePersonStatsList: document.getElementById('schedule-person-stats-list'),
  btnEditAssignments: document.getElementById('btn-edit-assignments'),
  btnReshuffle: document.getElementById('btn-reshuffle'),
  btnToStep3: document.getElementById('btn-to-step-3'),

  // Step 2 Modal 手工编辑弹窗
  modalEditAssignments: document.getElementById('modal-edit-assignments'),
  btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
  btnCancelEditModal: document.getElementById('btn-cancel-edit-modal'),
  btnResetEditModal: document.getElementById('btn-reset-edit-modal'),
  btnSaveEditModal: document.getElementById('btn-save-edit-modal'),
  modalEditTextarea: document.getElementById('modal-edit-textarea'),
  modalEditErrors: document.getElementById('modal-edit-errors'),
  modalEditErrorsList: document.getElementById('modal-edit-errors-list'),

  // Step 3
  startDateInput: document.getElementById('start-date-input'),
  startDateWeekdayTag: document.getElementById('start-date-weekday-tag'),
  btnToStep4: document.getElementById('btn-to-step-4'),

  // Step 4 (月历选择器)
  calStatRangeStart: document.getElementById('cal-stat-range-start'),
  calStatRangeEnd: document.getElementById('cal-stat-range-end'),
  btnCalClearAll: document.getElementById('btn-cal-clear-All') || document.getElementById('btn-cal-clear-all'),
  calendarQuickDateInput: document.getElementById('calendar-quick-date-input'),
  calendarQuickDateButton: document.getElementById('calendar-quick-date-button'),
  calendarQuickDateState: document.getElementById('calendar-quick-date-state'),
  btnQuickSetHoliday: document.getElementById('btn-quick-set-holiday'),
  btnQuickSetWorkday: document.getElementById('btn-quick-set-workday'),
  btnQuickResetDate: document.getElementById('btn-quick-reset-date'),
  excludedTagsContainer: document.getElementById('excluded-tags-container'),
  excludedTagsList: document.getElementById('excluded-tags-list'),
  calendarMonthTitle: document.getElementById('calendar-month-title'),
  btnPrevMonth: document.getElementById('btn-prev-month'),
  btnNextMonth: document.getElementById('btn-next-month'),
  btnJumpStartMonth: document.getElementById('btn-jump-start-month'),
  btnJumpEndMonth: document.getElementById('btn-jump-end-month'),
  calendarGrid: document.getElementById('calendar-grid'),
  btnToStep5: document.getElementById('btn-to-step-5'),

  // Step 5 (卡片、表格与文本共用同一视图切换器)
  markdownOutput: document.getElementById('markdown-output'),
  finalTableBody: document.getElementById('final-table-body'),
  finalCardsContainer: document.getElementById('final-cards-container'),
  finalTableScrollContainer: document.getElementById('final-table-scroll-container'),
  btnSubviewCards: document.getElementById('btn-subview-cards'),
  btnSubviewTable: document.getElementById('btn-subview-table'),
  btnSubviewText: document.getElementById('btn-subview-text'),
  btnDownloadHtml: document.getElementById('btn-download-html'),
  btnDownloadCsv: document.getElementById('btn-download-csv'),
  btnCopyMarkdown: document.getElementById('btn-copy-markdown'),
  viewTextContainer: document.getElementById('view-text-container'),
  tableSearchInput: document.getElementById('table-search-input'),
  btnClearTableSearch: document.getElementById('btn-clear-table-search'),
  searchResultStats: document.getElementById('search-result-stats'),
  tableEmptySearch: document.getElementById('table-empty-search'),
  btnRestart: document.getElementById('btn-restart'),

  //  顺延自旧排班表流程
  editPanels: [
    null,
    document.getElementById('panel-edit-step-1'),
    document.getElementById('panel-edit-step-2'),
    document.getElementById('panel-edit-step-3'),
    document.getElementById('panel-edit-step-4')
  ],
  editImportFileInput: document.getElementById('edit-import-file-input'),
  btnEditImportFile: document.getElementById('btn-edit-import-file'),
  editImportTextarea: document.getElementById('edit-import-textarea'),
  editImportError: document.getElementById('edit-import-error'),
  btnEditTo2: document.getElementById('btn-edit-to-2'),
  btnEditTo3: document.getElementById('btn-edit-to-3'),
  editExecutedThroughInput: document.getElementById('edit-executed-through-input'),
  editExecutedWeekdayTag: document.getElementById('edit-executed-weekday-tag'),
  editStatRemaining: document.getElementById('edit-stat-remaining'),
  editImportedCardsContainer: document.getElementById('edit-imported-cards-container'),
  editNewStartDateInput: document.getElementById('edit-new-start-date-input'),
  editNewWeekdayTag: document.getElementById('edit-new-weekday-tag'),
  editCalStatRangeStart: document.getElementById('edit-cal-stat-range-start'),
  editCalStatRangeEnd: document.getElementById('edit-cal-stat-range-end'),
  btnEditCalClearAll: document.getElementById('btn-edit-cal-clear-all'),
  editCalendarMonthTitle: document.getElementById('edit-calendar-month-title'),
  btnEditPrevMonth: document.getElementById('btn-edit-prev-month'),
  btnEditNextMonth: document.getElementById('btn-edit-next-month'),
  btnEditJumpStartMonth: document.getElementById('btn-edit-jump-start-month'),
  btnEditJumpEndMonth: document.getElementById('btn-edit-jump-end-month'),
  editExcludedTagsContainer: document.getElementById('edit-excluded-tags-container'),
  editExcludedTagsList: document.getElementById('edit-excluded-tags-list'),
  editCalendarGrid: document.getElementById('edit-calendar-grid'),
  btnEditGenerate: document.getElementById('btn-edit-generate'),
  editMarkdownOutput: document.getElementById('edit-markdown-output'),
  editFinalTableBody: document.getElementById('edit-final-table-body'),
  editFinalCardsContainer: document.getElementById('edit-final-cards-container'),
  editFinalTableScrollContainer: document.getElementById('edit-final-table-scroll-container'),
  btnEditSubviewCards: document.getElementById('btn-edit-subview-cards'),
  btnEditSubviewTable: document.getElementById('btn-edit-subview-table'),
  btnEditSubviewText: document.getElementById('btn-edit-subview-text'),
  btnEditDownloadHtml: document.getElementById('btn-edit-download-html'),
  btnEditDownloadCsv: document.getElementById('btn-edit-download-csv'),
  btnEditCopyMarkdown: document.getElementById('btn-edit-copy-markdown'),
  editViewTextContainer: document.getElementById('edit-view-text-container'),
  editTableSearchInput: document.getElementById('edit-table-search-input'),
  btnEditClearTableSearch: document.getElementById('edit-btn-clear-table-search'),
  editSearchResultStats: document.getElementById('edit-search-result-stats'),
  editTableEmptySearch: document.getElementById('edit-table-empty-search'),
  btnEditRestart: document.getElementById('btn-edit-restart'),

  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon'),

  // 网站页脚
  siteFooter: document.getElementById('site-footer'),
  siteFooterContent: document.getElementById('site-footer-content')
};

// 步骤标题导览菜单选项（英文模式走 I18N 字典）
const STEP_MENU_ITEMS_ZH = [
  { step: 0, title: '主页' },
  { step: 1, title: '名单与人数' },
  { step: 2, title: '轮换检查' },  { step: 3, title: '起始日期' },
  { step: 4, title: '假期修改' },
  { step: 5, title: '成功生成' }
];

// 修改自旧排班表流程的步骤导览菜单选项（0 为返回主页）
const EDIT_STEP_MENU_ITEMS_ZH = [
  { step: 0, title: '返回主页' },
  { step: 1, title: '导入旧表' },
  { step: 2, title: '检查日期' },
  { step: 3, title: '选择日期' },
  { step: 4, title: '成功生成' }
];

const STEP_MENU_ITEMS_EN = [
  { step: 0, title: t('menuHome') },
  { step: 1, title: t('menuNames') },
  { step: 2, title: t('menuRotation') },  { step: 3, title: t('menuStartDate') },
  { step: 4, title: t('menuHolidays') },
  { step: 5, title: t('menuDone') }
];

const EDIT_STEP_MENU_ITEMS_EN = [
  { step: 0, title: t('menuBackHome') },
  { step: 1, title: t('menuImport') },
  { step: 2, title: t('menuCheckDates') },
  { step: 3, title: t('menuPickDates') },
  { step: 4, title: t('menuDone') }
];

function getStepMenuItems(isEditFlow) {
  if (window.APP_LANG === 'en') return isEditFlow ? EDIT_STEP_MENU_ITEMS_EN : STEP_MENU_ITEMS_EN;
  return isEditFlow ? EDIT_STEP_MENU_ITEMS_ZH : STEP_MENU_ITEMS_ZH;
}

// 获取本地今日日期 YYYY-MM-DD
function getTodayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 按当前语言判断星期名是否为周末（周六/周日 或 Sat./Sun.）
function isWeekendName(name) {
  const idx = matchWeekdayToken(name);
  return idx === 0 || idx === 6;
}

// Toast 消息提示
let toastTimeout = null;
function showToast(message, icon = '✓') {
  if (toastTimeout) clearTimeout(toastTimeout);
  elements.toastMessage.textContent = message;
  elements.toastIcon.textContent = icon;
  elements.toast.classList.remove('opacity-0', '-translate-y-4');
  elements.toast.classList.add('opacity-100', 'translate-y-0');

  toastTimeout = setTimeout(() => {
    elements.toast.classList.remove('opacity-100', 'translate-y-0');
    elements.toast.classList.add('opacity-0', '-translate-y-4');
  }, 2200);
}

// 打开或关闭步骤标题导览菜单
function toggleStepMenu(anchorButton) {
  if (!anchorButton) return;

  const isCurrentOpen = anchorButton.getAttribute('aria-expanded') === 'true';
  if (elements.activeStepMenuAnchor && elements.activeStepMenuAnchor !== anchorButton) {
    closeStepMenu(elements.activeStepMenuAnchor);
  }

  if (!isCurrentOpen) {
    renderStepMenu(anchorButton);
    anchorButton.setAttribute('aria-expanded', 'true');
    elements.activeStepMenuAnchor = anchorButton;
  } else {
    closeStepMenu(anchorButton);
  }
}

function renderStepMenu(anchorButton) {
  const isEditFlow = anchorButton.dataset.flow === 'edit';
  const stepIndex = parseInt(anchorButton.dataset.step, 10) - 1;
  const menu = isEditFlow
    ? elements.editStepMenus[stepIndex + 1]
    : elements.stepMenus[stepIndex + 1];
  if (!menu) return;

  const menuItems = getStepMenuItems(isEditFlow);
  menu.classList.remove('hidden');
  menu.querySelector('.step-menu-list').innerHTML = menuItems.map((item) => {
    const isCurrent = item.step === state.currentStep;
    return `
      <button
        type="button"
        class="step-menu-item${isCurrent ? ' is-current' : ''}"
        role="menuitem"
        onclick="selectStepMenuItem(${item.step})"
      >
        <span class="step-menu-number">${isCurrent ? (t('current') || '当前') : item.step}</span>
        <span>${item.title}</span>
      </button>
    `;
  }).join('');
}

function selectStepMenuItem(targetStep) {
  if (elements.activeStepMenuAnchor) closeStepMenu(elements.activeStepMenuAnchor);
  if (state.mode === 'editOld') {
    // 旧表流程：0 为返回主页，其余为流程内跳转
    if (targetStep === 0) {
      goToStep(0);
    } else {
      goToEditStep(targetStep);
    }
  } else {
    goToStep(targetStep);
  }
}

function closeStepMenu(anchorButton) {
  if (!anchorButton) return;
  anchorButton.setAttribute('aria-expanded', 'false');
  const stepIndex = parseInt(anchorButton.dataset.step, 10) - 1;
  const isEditFlow = anchorButton.dataset.flow === 'edit';
  (isEditFlow
    ? elements.editStepMenus[stepIndex + 1]
    : elements.stepMenus[stepIndex + 1]
  )?.classList.add('hidden');
  if (elements.activeStepMenuAnchor === anchorButton) {
    elements.activeStepMenuAnchor = null;
  }
}

// 已加载的页脚 Markdown，导出独立 HTML 时会直接内联
var siteFooterMarkdown = '';

// 解析页脚 Markdown，当前仅需支持段落和行内链接/图片
function renderInlineMarkdown(text) {
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return escapedText
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, alt, href) => {
      return `<img src="${href}" alt="${alt}">`;
    })
    .replace(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, label, href) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

function renderMarkdownFooter(markdown) {
  const lines = markdown.trim().split(/\r?\n/);
  const paragraphLines = [];
  const renderedBlocks = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    // Markdown 行尾两个空格表示硬换行，避免多行内容被合并
    let currentLine = [];
    const lineBlocks = [];

    const flushLine = () => {
      if (currentLine.length === 0) return;
      lineBlocks.push(`<span class="site-footer-line">${currentLine.join(' ')}</span>`);
      currentLine = [];
    };

    paragraphLines.forEach(line => {
      const hasHardBreak = /  $/.test(line);
      currentLine.push(renderInlineMarkdown(hasHardBreak ? line.trimEnd() : line));
      if (hasHardBreak) flushLine();
    });
    flushLine();

    renderedBlocks.push(`<p>${lineBlocks.join('')}</p>`);
    paragraphLines.length = 0;
  };

  lines.forEach(rawLine => {
    // 兼容 docs/footer.md 使用 <div align="center"> 包裹 Markdown 的写法
    if (/^\s*(?:<div\b[^>]*>|<\/div>|<!--[\s\S]*?-->)\s*$/i.test(rawLine)) {
      flushParagraph();
      return;
    }

    const line = rawLine.trimStart();
    if (line === '') {
      flushParagraph();
      return;
    }
    paragraphLines.push(line);
  });
  flushParagraph();

  return renderedBlocks.join('');
}

function loadSiteFooter() {
  if (!elements.siteFooter || !elements.siteFooterContent) return;

  const renderLoadedFooter = () => {
    if (typeof window.FOOTER_MARKDOWN !== 'string') return;
    siteFooterMarkdown = window.FOOTER_MARKDOWN;
    elements.siteFooterContent.innerHTML = renderMarkdownFooter(siteFooterMarkdown);
    elements.siteFooter.hidden = elements.siteFooterContent.innerHTML.trim() === '';

    // 重新加载时移除旧脚本，确保后续变更可重新触发
    document.querySelectorAll('script[data-footer-loader]').forEach(node => node.remove());
  };

  // 页面直开（file://）时 fetch/XHR 均受浏览器限制，通过 JS 文件承载 Markdown 内容
  const script = document.createElement('script');
  script.dataset.footerLoader = 'true';
  script.onload = renderLoadedFooter;
  script.onerror = () => {
    console.error('页脚加载失败');
    elements.siteFooter.hidden = true;
    document.querySelectorAll('script[data-footer-loader]').forEach(node => node.remove());
  };
  script.src = `docs/${window.APP_LANG === 'en' ? 'footer_en.md' : 'footer.md'}?_=${Date.now()}`;
  document.head.appendChild(script);
}

// 错误提示
function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError(el) {
  el.classList.add('hidden');
}

// 步骤 1 实时输入与无余数周期计算
function handleStep1Inputs() {
  const parsed = parseNames(elements.namesInput.value);
  const count = parsed.length;
  elements.namesCountBadge.textContent = tf('recognizedBadge', { n: count }) || `已识别 ${count} 人`;

  const daily = parseInt(elements.dailyCountInput.value, 10) || 4;

  if (count > 0 && daily > 0) {
    const cycle = calculateCycle(count, daily);

    if (count >= daily) {
      const en = window.APP_LANG === 'en';
      elements.step1CycleHint.innerHTML = en
        ? `Days needed: <span class="text-indigo-600 font-bold text-sm">${cycle.totalDays}</span> exactly;<br>
        Shifts per person: <span class="text-indigo-600 font-bold text-sm">${cycle.shiftsPerPerson}</span>;<br>
        Total shifts: <span class="text-indigo-600 font-bold text-sm">${cycle.totalShifts}</span>.`
        : `
        需排班 <span class="text-indigo-600 font-bold text-sm">${cycle.totalDays}</span> 天整；<br>
        每人值班 <span class="text-indigo-600 font-bold text-sm">${cycle.shiftsPerPerson}</span> 次；<br>
        总计 <span class="text-indigo-600 font-bold text-sm">${cycle.totalShifts}</span> 班次。
      `;
      hideError(elements.step1Error);
    } else {
      elements.step1CycleHint.innerHTML = window.APP_LANG === 'en'
        ? `<span class="text-amber-600 font-medium">⚠️ Total people (${count}) is fewer than people per day (${daily}). Add more people or reduce the daily headcount.</span>`
        : `<span class="text-amber-600 font-medium">⚠️ 总人数 (${count}人) 少于每日值班人数 (${daily}人)，请补充人员或调低每日人数。</span>`;
    }
  } else {
    elements.step1CycleHint.textContent = t('waitTyping') || '等待键入...';
  }
}

// 步骤向导跳转控制
function goToStep(targetStep) {
  if (targetStep < 0 || targetStep > 5) return;

  // 校验前往后续步骤的前提条件（步骤 0 为主页，跳过校验）
  if (targetStep >= 1) {
    const rawNames = elements.namesInput.value;
    const parsed = parseNames(rawNames);
    const dailyCount = parseInt(elements.dailyCountInput.value, 10) || 4;

    if (parsed.length === 0) {
      showError(elements.step1Error, t('errEnterNames') || '请先输入至少一组人员姓名');
      return;
    }
    if (parsed.length < dailyCount) {
      showError(elements.step1Error, tf('errFewerPeople', { n: parsed.length, k: dailyCount }) || `总人数 (${parsed.length}人) 不能少于每日值班人数 (${dailyCount}人)`);
      return;
    }
    hideError(elements.step1Error);

    // 检查是否需要重新生成排班方案
    const namesChanged = JSON.stringify(parsed) !== JSON.stringify(state.names);
    const dailyChanged = dailyCount !== state.dailyCount;

    state.names = parsed;
    state.dailyCount = dailyCount;

    if (!state.scheduleAssignments || namesChanged || dailyChanged) {
      generateAssignments();
    }
  }

  if (targetStep >= 4) {
    if (!state.startDateStr) {
      state.startDateStr = elements.startDateInput.value || getTodayDateStr();
    }

    // 同步月历视图初始月份为开始日期所在月
    const startD = parseDate(state.startDateStr);
    state.calViewYear = startD.getFullYear();
    state.calViewMonth = startD.getMonth();
    renderStep4Calendar();
  }

  if (targetStep === 5) {
    renderFinalSchedule();
    // 进入结果页时保持既定默认视图（手机端卡片，电脑端表格）
    setScheduleView(state.visualSubView);
  }


  // 更新面板可见性
  for (let i = 0; i <= 5; i++) {
    if (elements.panels[i]) {
      if (i === targetStep) {
        elements.panels[i].classList.remove('hidden');
      } else {
        elements.panels[i].classList.add('hidden');
      }
    }
  }

  // 隐藏 顺延自旧排班表面板；从旧表流程返回时恢复新流程的假期设置
  if (state.mode === 'editOld') {
    state.mode = 'new';
    if (savedNewHolidays) state.excludedHolidays = savedNewHolidays;
    if (savedNewWorkdays) state.manualWorkdays = savedNewWorkdays;
    savedNewHolidays = null;
    savedNewWorkdays = null;
  }
  elements.editPanels.forEach(p => p && p.classList.add('hidden'));

  state.currentStep = targetStep;
  // 将当前步骤同步到网址参数 (?step=N)，步骤 0 不带参数
  const langQs = window.APP_LANG === 'en' ? 'lang=en&' : '';
  const newUrl = targetStep > 0 ? `${location.pathname}?${langQs}step=${targetStep}` : (window.APP_LANG === 'en' ? `${location.pathname}?lang=en` : location.pathname);
  history.replaceState(null, '', newUrl);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 步骤 2 生成严格无余数轮换方案
function generateAssignments() {
  try {
    state.scheduleAssignments = generateScheduleAssignments(state.names, state.dailyCount);
    renderStep2Preview();
  } catch (err) {
    showError(elements.step1Error, err.message); // err.message 已在 scheduler.js 按语言输出
  }
}

function renderStep2Preview() {
  const { totalDays, shiftsPerPerson, totalShifts, dailyAssignments } = state.scheduleAssignments;
  const en = window.APP_LANG === 'en';

  elements.statTotalPeople.textContent = en ? `${state.names.length}` : `${state.names.length} 人`;
  elements.statDailyPeople.textContent = en ? `${state.dailyCount}` : `${state.dailyCount} 人`;
  elements.statTotalDays.textContent = en ? `${totalDays}` : `${totalDays} 天整`;
  elements.statShiftsPerPerson.textContent = en ? `${shiftsPerPerson}` : `${shiftsPerPerson} 次`;

  elements.previewDaysCount.textContent = totalDays;
  elements.previewShiftsCount.textContent = shiftsPerPerson;

  // 1. 渲染按天轮替预览
  const daysHtml = dailyAssignments.map((dayGroup, idx) => {
    const namesChips = dayGroup.map(name =>
      `<span class="inline-block bg-slate-100 text-slate-800 font-medium px-2.5 py-0.5 rounded-md text-xs border border-slate-200 mr-1.5 my-0.5">${name}</span>`
    ).join('');

    return `
      <div class="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div class="flex items-center space-x-3">
          <span class="w-16 text-xs font-bold text-slate-400">${en ? `Day ${idx + 1}` : `第 ${idx + 1} 天`}</span>
          <div class="flex flex-wrap items-center">
            ${namesChips}
          </div>
        </div>
        <span class="text-xs text-slate-400 hidden sm:inline">${en ? `${dayGroup.length} ppl` : `${dayGroup.length}人`}</span>
      </div>
    `;
  }).join('');
  elements.schedulePreviewList.innerHTML = daysHtml;

  // 2. 渲染按人统计检查（验证每人均值班 shiftsPerPerson 次）
  const personShiftsMap = {};
  state.names.forEach(name => {
    personShiftsMap[name] = [];
  });
  dailyAssignments.forEach((dayGroup, dayIdx) => {
    dayGroup.forEach(name => {
      if (!personShiftsMap[name]) personShiftsMap[name] = [];
      personShiftsMap[name].push(dayIdx + 1);
    });
  });

  const peopleHtml = Object.keys(personShiftsMap).map((name, idx) => {
    const days = personShiftsMap[name];
    const daysBadges = days.map(d => `<span class="inline-block bg-indigo-50 text-indigo-700 font-mono text-[11px] px-2 py-0.5 rounded border border-indigo-100 mr-1 my-0.5">${en ? `Day ${d}` : `第 ${d} 天`}</span>`).join('');
    return `
      <div class="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div class="flex items-center space-x-3 flex-1">
          <span class="w-8 text-xs font-mono text-slate-400 text-right">${idx + 1}.</span>
          <span class="font-bold text-xs sm:text-sm text-slate-800 w-24">${name}</span>
          <div class="flex flex-wrap items-center flex-1">
            ${daysBadges}
          </div>
        </div>
        <span class="text-xs font-bold text-emerald-600 ml-2">${en ? `${days.length} shifts in total` : `共 ${days.length} 次`}</span>
      </div>
    `;
  }).join('');
  elements.schedulePersonStatsList.innerHTML = peopleHtml;
}

// 打开第 2 步手动修改轮换方案弹窗
function openEditAssignmentsModal() {
  if (!state.scheduleAssignments || !state.scheduleAssignments.dailyAssignments) return;
  
  // 生成当前轮换分配的 Markdown
  const mdText = formatAssignmentsToMarkdown(state.scheduleAssignments.dailyAssignments);
  elements.modalEditTextarea.value = mdText;
  
  // 重置错误提示
  elements.modalEditErrors.classList.add('hidden');
  elements.modalEditErrorsList.innerHTML = '';
  
  // 显示弹窗
  elements.modalEditAssignments.classList.remove('hidden');
  elements.modalEditTextarea.focus();
}

// 关闭第 2 步手动修改轮换方案弹窗
function closeEditAssignmentsModal() {
  elements.modalEditAssignments.classList.add('hidden');
  elements.modalEditErrors.classList.add('hidden');
  elements.modalEditErrorsList.innerHTML = '';
}

// 重置弹窗内文本为当前方案
function resetEditAssignmentsModal() {
  if (!state.scheduleAssignments || !state.scheduleAssignments.dailyAssignments) return;
  elements.modalEditTextarea.value = formatAssignmentsToMarkdown(state.scheduleAssignments.dailyAssignments);
  elements.modalEditErrors.classList.add('hidden');
  elements.modalEditErrorsList.innerHTML = '';
  showToast(t('successReset') || '成功重置');
}

// 保存并检查修改后的轮换方案
function saveEditAssignmentsModal() {
  if (!state.scheduleAssignments) return;

  const text = elements.modalEditTextarea.value;
  const expectedDays = state.scheduleAssignments.totalDays;
  const expectedDailyCount = state.dailyCount;
  const originalNames = state.names;
  const expectedShiftsPerPerson = state.scheduleAssignments.shiftsPerPerson;

  // 执行严格解析与校验
  const result = parseAndValidateAssignmentsMarkdown(
    text,
    expectedDays,
    expectedDailyCount,
    originalNames,
    expectedShiftsPerPerson
  );

  if (!result.isValid) {
    // 校验未通过：渲染错误信息并阻断保存
    elements.modalEditErrorsList.innerHTML = result.errors.map(err => `<li>${err}</li>`).join('');
    elements.modalEditErrors.classList.remove('hidden');
    elements.modalEditErrors.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast(t('error') || '错误', '✗');
    return;
  }

  // 校验完全通过：更新状态中的轮替方案
  state.scheduleAssignments.dailyAssignments = result.dailyAssignments;
  
  // 重新渲染第 2 步列表和统计检查
  renderStep2Preview();

  // 关闭弹窗并给予成功反馈
  closeEditAssignmentsModal();
  showToast(t('rotationSaved') || '轮换方案修改成功，已通过严格无余数均衡校验！');
}

// 步骤 3 起始日期变化监听
function handleStartDateChange() {
  const val = elements.startDateInput.value;
  if (!val) return;
  const oldStart = state.startDateStr;
  state.startDateStr = val;

  // 起始日期变化后，合法选择区间随之变化，需清理已超出范围的记录
  const validRange = getScheduleDateRange();
  pruneScheduleDateSelections(validRange.start, validRange.end);

  if (oldStart && oldStart !== val) {
    const startD = parseDate(val);
    state.calViewYear = startD.getFullYear();
    state.calViewMonth = startD.getMonth();
  }

  const date = parseDate(val);
  const dayOfWeek = date.getDay();
  const weekday = weekdayName(dayOfWeek);
  const en = window.APP_LANG === 'en';

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    elements.startDateWeekdayTag.innerHTML = `
      ${en
        ? `<span class="text-amber-600 font-bold">This date is ${weekday} (a non-workday)</span>. Scheduling will begin on the nearest workday or adjusted makeup workday.`
        : `<span class="text-amber-600 font-bold">该日为 ${weekday}（非工作日）</span>，排班将从最近的工作日或调休补班日开始。`}
    `;
  } else {
    elements.startDateWeekdayTag.innerHTML = `
      ${en ? `Start date is <span class="text-indigo-600 font-semibold">${weekday}</span> (a workday).` : `起始日为 <span class="text-indigo-600 font-semibold">${weekday}</span>（工作日）。`}
    `;
  }
}

// ----------------------------------------------------
// 步骤 4：月历选择器核心逻辑 (Calendar Picker)
// ----------------------------------------------------

// 计算本次排班的完整可选区间（旧表流程自动切换到新起始日期区间）
function getScheduleDateRange() {
  if (state.mode === 'editOld') {
    return getEditScheduleDateRange();
  }
  const totalDays = state.scheduleAssignments ? state.scheduleAssignments.totalDays : 0;
  const { workdays } = computeScheduleDates(
    state.startDateStr || getTodayDateStr(),
    totalDays + 1,
    state.excludedHolidays,
    state.manualWorkdays
  );
  const allowedWorkdays = workdays.slice(0, totalDays);
  const fallbackDate = state.startDateStr || getTodayDateStr();

  return {
    start: fallbackDate,
    end: allowedWorkdays.length > 0 ? allowedWorkdays[allowedWorkdays.length - 1].dateStr : fallbackDate
  };
}

function isScheduleDateOutsideRange(dateStr, validRange) {
  return dateStr < validRange.start || dateStr > validRange.end;
}

function validateScheduleDateSelection(dateStr) {
  const validRange = getScheduleDateRange();
  if (isScheduleDateOutsideRange(dateStr, validRange)) {
    showToast(tf('onlyInRange', { s: validRange.start, e: validRange.end }) || `只能选择 ${validRange.start} 至 ${validRange.end} 内的日期`, '⚠️');
    return true;
  }
  return false;
}

function pruneScheduleDateSelections(rangeStart, rangeEnd) {
  const isOutside = dateStr => dateStr < rangeStart || dateStr > rangeEnd;
  Array.from(state.excludedHolidays).filter(isOutside).forEach(dateStr => state.excludedHolidays.delete(dateStr));
  Array.from(state.manualWorkdays).filter(isOutside).forEach(dateStr => state.manualWorkdays.delete(dateStr));
}

// 查找单日的状态机查询；dateStatus 供日历与快速选择器共用
function getQuickDateState(dateStr) {
  if (!dateStr) {
    return { dateStatus: 'unselected', allowedActions: { holiday: false, workday: false, reset: false }, message: t('qUnselected') || '请选择' };
  }

  const validRange = getScheduleDateRange();
  if (isScheduleDateOutsideRange(dateStr, validRange)) {
    return {
      dateStatus: 'outside',
      allowedActions: { holiday: false, workday: false, reset: false },
      message: t('qOutside') || '这天是：超出排班区间'
    };
  }

  const date = parseDate(dateStr);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isManualHoliday = state.excludedHolidays.has(dateStr);
  const isManualWorkday = state.manualWorkdays.has(dateStr);

  if (isManualHoliday) {
    return {
      dateStatus: 'manual-holiday',
      allowedActions: { holiday: false, workday: true, reset: true },
      message: t('qManualHoliday') || '这天是：手动节假日'
    };
  }

  if (isManualWorkday) {
    return {
      dateStatus: 'manual-workday',
      allowedActions: { holiday: true, workday: false, reset: true },
      message: t('qMakeup') || '这天是：调休补班'
    };
  }

  if (isWeekend) {
    return {
      dateStatus: 'weekend',
      allowedActions: { holiday: false, workday: true, reset: false },
      message: t('qWeekend') || '这天是：双休日'
    };
  }

  return {
    dateStatus: 'default-workday',
    allowedActions: { holiday: true, workday: false, reset: false },
    message: t('qDefault') || '这天是：默认排班'
  };
}

function updateQuickDateState() {
  const quickState = getQuickDateState(elements.calendarQuickDateInput.value);
  elements.calendarQuickDateButton.textContent = elements.calendarQuickDateInput.value
    ? elements.calendarQuickDateInput.value.replaceAll('-', '/')
    : t('qUnselected') || '请选择';
  elements.calendarQuickDateState.textContent = quickState.message;

  const statusStyles = {
    unselected: 'text-slate-500',
    outside: 'text-slate-500',
    'default-workday': 'text-[#3B82F6]',
    weekend: 'text-[#6B7280]',
    'manual-holiday': 'text-[#EF4444]',
    'manual-workday': 'text-[#22C55E]'
  };
  elements.calendarQuickDateState.className = `text-xs font-semibold ${statusStyles[quickState.dateStatus]}`;

  elements.btnQuickSetHoliday.disabled = !quickState.allowedActions.holiday;
  elements.btnQuickSetWorkday.disabled = !quickState.allowedActions.workday;
  elements.btnQuickResetDate.disabled = !quickState.allowedActions.reset;

  elements.btnQuickSetHoliday.classList.toggle('opacity-40', elements.btnQuickSetHoliday.disabled);
  elements.btnQuickSetHoliday.classList.toggle('cursor-not-allowed', elements.btnQuickSetHoliday.disabled);
  elements.btnQuickSetWorkday.classList.toggle('opacity-40', elements.btnQuickSetWorkday.disabled);
  elements.btnQuickSetWorkday.classList.toggle('cursor-not-allowed', elements.btnQuickSetWorkday.disabled);
  elements.btnQuickResetDate.classList.toggle('opacity-40', elements.btnQuickResetDate.disabled);
  elements.btnQuickResetDate.classList.toggle('cursor-not-allowed', elements.btnQuickResetDate.disabled);
}

function renderStep4Calendar() {
  const totalDays = state.scheduleAssignments.totalDays;
  const hasSchedule = Boolean(totalDays);

  // 兼容历史状态：渲染前强制清掉超出当前合法区间的选择
  const validRange = getScheduleDateRange();
  pruneScheduleDateSelections(validRange.start, validRange.end);
  const renderRange = getScheduleDateRange();

  // 扫描结束日的后一天，确保非法补班日期也能获得日历状态和不可选提示
  const { workdays, datesMap } = hasSchedule
    ? computeScheduleDates(
        state.startDateStr,
        totalDays + 1,
        state.excludedHolidays,
        state.manualWorkdays
      )
    : { workdays: [], datesMap: new Map() };

  // 更新排班区间卡片
  if (hasSchedule && workdays.length >= totalDays) {
    elements.calStatRangeStart.textContent = renderRange.start.replaceAll('-', '/');
    elements.calStatRangeEnd.textContent = renderRange.end.replaceAll('-', '/');
  } else {
    elements.calStatRangeStart.textContent = '-';
    elements.calStatRangeEnd.textContent = '-';
  }

  // 渲染排除与补班标记标签栏
  renderExcludedAndManualTags();

  // 渲染月历头部标题
  const year = state.calViewYear;
  const month = state.calViewMonth; // 0-11
  elements.calendarMonthTitle.textContent = `${year}/${String(month + 1).padStart(2, '0')}`;

  // 快速日期输入的范围需要随当前排班区间实时更新
  elements.calendarQuickDateInput.min = renderRange.start;
  if (renderRange.end > renderRange.start) {
    elements.calendarQuickDateInput.max = renderRange.end;
  } else {
    elements.calendarQuickDateInput.removeAttribute('max');
  }
  updateQuickDateState();

  // 渲染月历网格
  renderMonthGrid(year, month, datesMap, renderRange);
}

// 渲染月历格子 (7列 x 5~6行)；gridEl 缺省时渲染新流程的日历网格
function renderMonthGrid(year, month, datesMap, validRange, gridEl) {
  const grid = gridEl || elements.calendarGrid;
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = 周日, 1 = 周一, ...

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let cellsHtml = '';

  // 1. 上月留白填充格子
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, prevDayNum);
    const dateStr = formatDate(prevDate);
    cellsHtml += buildCalendarCellHtml(dateStr, prevDayNum, true, datesMap, validRange);
  }

  // 2. 当月日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    const dateStr = formatDate(curDate);
    cellsHtml += buildCalendarCellHtml(dateStr, day, false, datesMap, validRange);
  }

  // 3. 下月留白填充格子（补齐到7的倍数）
  const totalRendered = startDayOfWeek + daysInMonth;
  const remainingCells = (7 - (totalRendered % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    const dateStr = formatDate(nextDate);
    cellsHtml += buildCalendarCellHtml(dateStr, day, true, datesMap, validRange);
  }

  grid.innerHTML = cellsHtml;
}

// 构建单个日历格子的 HTML
function buildCalendarCellHtml(dateStr, dayNum, isOtherMonth, datesMap, validRange) {
  const dateObj = parseDate(dateStr);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

  const dayInfo = datesMap.get(dateStr);
  const isExcluded = state.excludedHolidays.has(dateStr);
  const isManual = state.manualWorkdays.has(dateStr);

  let cellBgClass = '';
  let borderClass = 'border-slate-200';
  let badgeHtml = '';
  let textColor = isOtherMonth ? 'text-slate-300' : 'text-slate-700';
  let isColored = false;
  const isDateDisabled = isScheduleDateOutsideRange(dateStr, validRange);

  if (isDateDisabled) {
    cellBgClass = 'bg-slate-50/60 cursor-not-allowed hover:bg-slate-50/60';
    borderClass = 'border-slate-200/80';
    badgeHtml = '';
    textColor = isOtherMonth ? 'text-slate-300' : 'text-slate-400';
  } else if (dayInfo && dayInfo.isWorkday) {
    if (isManual) {
      cellBgClass = 'bg-[#22C55E] border-[#22C55E] hover:opacity-90';
      badgeHtml = `<span class="text-[10px] font-bold text-white bg-white/25 px-1.5 py-0.5 rounded">${t('makeupShort') || '补'}</span>`;
      textColor = 'text-white font-bold';
      isColored = true;
    } else {
      cellBgClass = 'bg-[#3B82F6] border-[#3B82F6] hover:opacity-90';
      badgeHtml = `<span class="text-[10px] font-bold text-white bg-white/25 px-1.5 py-0.5 rounded">${t('setStateWorkday') || '班'}</span>`;
      textColor = 'text-white font-semibold';
      isColored = true;
    }
  } else if (isExcluded) {
    cellBgClass = 'bg-[#EF4444] border-[#EF4444] hover:opacity-90';
    badgeHtml = `<span class="text-[10px] font-bold text-white bg-white/25 px-1.5 py-0.5 rounded">${t('setStateHoliday') || '休'}</span>`;
    textColor = 'text-white line-through font-medium';
    isColored = true;
  } else if (isWeekend) {
    cellBgClass = isOtherMonth ? 'bg-slate-50/50' : 'bg-[#6B7280] border-[#6B7280] hover:opacity-90';
    badgeHtml = isOtherMonth ? '' : `<span class="text-[10px] font-bold text-white bg-white/25 px-1.5 py-0.5 rounded">${t('setStateHoliday') || '休'}</span>`;
    textColor = isOtherMonth ? 'text-slate-300' : 'text-white';
    if (!isOtherMonth) isColored = true;
  } else {
    cellBgClass = isOtherMonth ? 'bg-slate-50/50' : 'bg-white hover:bg-indigo-50/30';
    badgeHtml = '';
    textColor = isOtherMonth ? 'text-slate-300' : 'text-slate-600';
  }

  let titleTooltip = `${dateStr} (${weekdayName(dayOfWeek)})`;
  if (isDateDisabled) {
    titleTooltip += t('cellDisabled') || ' [不可选择] 仅允许修改起始日期至实际排班结束日期范围内的日期';
  } else if (dayInfo && dayInfo.isWorkday) {
    titleTooltip += tf('cellWorkday', { d: dayInfo.workdayIndex }) || ` [排班第${dayInfo.workdayIndex}天] 点击设为放假`;
  } else if (isExcluded) {
    titleTooltip += t('cellHoliday') || ' [放假跳过] 点击恢复排班';
  } else if (isWeekend) {
    titleTooltip += t('cellWeekend') || ' [周末] 点击设为调休补班';
  }

  return `
    <div class="calendar-cell p-2 select-none flex flex-col justify-between border ${borderClass} ${cellBgClass}"
         onclick="handleCalendarCellClick('${dateStr}')"
         title="${titleTooltip}">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold ${textColor}">${dayNum}</span>
        ${badgeHtml}
      </div>
      <div class="text-[10px] text-right ${isColored ? 'text-white/70' : 'text-slate-400'} font-mono">
        ${dateStr.slice(5)}
      </div>
    </div>
  `;
}

// 日历单元格点击事件交互
function handleCalendarCellClick(dateStr) {
  if (validateScheduleDateSelection(dateStr)) return;

  const quickState = getQuickDateState(dateStr);
  if (quickState.dateStatus === 'manual-holiday') {
    state.excludedHolidays.delete(dateStr);
    showToast(tf('restoredWork', { d: dateStr }) || `已恢复排班：${dateStr}`);
  } else if (quickState.dateStatus === 'manual-workday') {
    state.manualWorkdays.delete(dateStr);
    showToast(tf('restoredInitial', { d: dateStr }) || `已恢复初始状态：${dateStr}`);
  } else if (quickState.dateStatus === 'weekend') {
    state.manualWorkdays.add(dateStr);
    showToast(tf('setMakeup', { d: dateStr }) || `已将 ${dateStr} 设为调休排班！`, '✅');
  } else {
    state.excludedHolidays.add(dateStr);
    showToast(tf('setOff', { d: dateStr }) || `已将 ${dateStr} 设为跳过放假`, '🚫');
  }

  rerenderActiveCalendar();
}

// 按当前模式重新渲染对应的月历
function rerenderActiveCalendar() {
  if (state.mode === 'editOld') {
    renderEditCalendar();
  } else {
    renderStep4Calendar();
  }
}

// 渲染排除与补班的标签栏
function renderExcludedAndManualTags() {
  const hasItems = (state.excludedHolidays.size > 0 || state.manualWorkdays.size > 0);
  if (!hasItems) {
    elements.excludedTagsContainer.classList.add('hidden');
    return;
  }

  elements.excludedTagsContainer.classList.remove('hidden');

  let tagsHtml = '';

  const sortedHolidays = Array.from(state.excludedHolidays).sort();
  sortedHolidays.forEach(dateStr => {
    const d = parseDate(dateStr);
    const wk = weekdayName(d.getDay());
    tagsHtml += `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EF4444] border border-[#EF4444] text-white text-xs font-mono shadow-2xs">
        <span>🚫 ${dateStr} (${wk}) ${t('offTag') || '休'}</span>
        <button type="button" onclick="removeHolidayTag('${dateStr}')" class="hover:text-white/80 font-bold ml-1 text-sm leading-none" title="${t('undoHoliday') || '撤销放假'}">✕</button>
      </span>
    `;
  });

  const sortedManual = Array.from(state.manualWorkdays).sort();
  sortedManual.forEach(dateStr => {
    const d = parseDate(dateStr);
    const wk = weekdayName(d.getDay());
    tagsHtml += `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22C55E] border border-[#22C55E] text-white text-xs font-mono shadow-2xs">
        <span>✅ ${dateStr} (${wk}) ${t('makeupTag') || '补班'}</span>
        <button type="button" onclick="removeManualWorkdayTag('${dateStr}')" class="hover:text-white/80 font-bold ml-1 text-sm leading-none" title="${t('undoMakeup') || '撤销补班'}">✕</button>
      </span>
    `;
  });

  elements.excludedTagsList.innerHTML = tagsHtml;
}

function removeHolidayTag(dateStr) {
  if (validateScheduleDateSelection(dateStr)) return;
  state.excludedHolidays.delete(dateStr);
  showToast(tf('restoredWork', { d: dateStr }) || `已恢复排班：${dateStr}`);
  rerenderActiveCalendar();
}

function removeManualWorkdayTag(dateStr) {
  if (validateScheduleDateSelection(dateStr)) return;
  state.manualWorkdays.delete(dateStr);
  showToast(tf('restoredInitial', { d: dateStr }) || `已撤销补班：${dateStr}`);
  rerenderActiveCalendar();
}

function handleQuickSetHoliday() {
  const val = elements.calendarQuickDateInput.value;
  if (!val) {
    showToast(t('pickDateFirst') || '请先选择日期', '⚠️');
    return;
  }
  if (validateScheduleDateSelection(val)) return;
  const quickState = getQuickDateState(val);
  if (!quickState.allowedActions.holiday) {
    showToast(quickState.dateStatus === 'manual-holiday' ? (t('alreadyHoliday') || '该日期已是手动节假日') : (t('errDefaultToMakeup') || '默认排班日期不能设为调休补班'), '⚠️');
    return;
  }

  state.manualWorkdays.delete(val);
  state.excludedHolidays.add(val);
  renderStep4Calendar();
  showToast(tf('setOff', { d: val }) || `已将 ${val} 设为跳过放假`, '🚫');
  elements.calendarQuickDateInput.value = '';
  updateQuickDateState();
}

function handleQuickSetWorkday() {
  const val = elements.calendarQuickDateInput.value;
  if (!val) {
    showToast(t('pickDateFirst') || '请先选择日期', '⚠️');
    return;
  }
  if (validateScheduleDateSelection(val)) return;
  const quickState = getQuickDateState(val);
  if (!quickState.allowedActions.workday) {
    showToast(quickState.dateStatus === 'default-workday' ? (t('noMakeupNeeded') || '默认排班日期无需调休补班') : (t('errWeekendHoliday') || '双休日不能设为手动节假日'), '⚠️');
    return;
  }

  state.excludedHolidays.delete(val);
  state.manualWorkdays.add(val);
  renderStep4Calendar();
  showToast(tf('setMakeup', { d: val }) || `已将 ${val} 设为调休排班！`, '✅');
  elements.calendarQuickDateInput.value = '';
  updateQuickDateState();
}

function handleQuickResetDate() {
  const val = elements.calendarQuickDateInput.value;
  if (!val) {
    showToast(t('pickDateFirst') || '请先选择日期', '⚠️');
    return;
  }
  if (validateScheduleDateSelection(val)) return;

  const quickState = getQuickDateState(val);
  if (!quickState.allowedActions.reset) {
    showToast(t('alreadyInitial') || '该日期已是初始状态', '⚠️');
    return;
  }

  state.excludedHolidays.delete(val);
  state.manualWorkdays.delete(val);
  renderStep4Calendar();
  showToast(tf('restoredInitial', { d: val }) || `已恢复初始状态：${val}`);
  elements.calendarQuickDateInput.value = '';
  updateQuickDateState();
}

// ----------------------------------------------------
// 步骤 5：最终结果输出与可视化表格搜索（默认第1视图）
// ----------------------------------------------------

function renderFinalSchedule() {
  const totalDays = state.scheduleAssignments.totalDays;
  const { workdays } = computeScheduleDates(
    state.startDateStr,
    totalDays,
    state.excludedHolidays,
    state.manualWorkdays
  );

  state.finalScheduleItems = workdays.map((wd, idx) => ({
    dateStr: wd.dateStr,
    weekday: wd.weekday,
    isManualWorkday: wd.isManualWorkday,
    names: state.scheduleAssignments.dailyAssignments[idx]
  }));

  // 生成 Markdown
  state.markdownText = formatToMarkdown(state.finalScheduleItems);
  elements.markdownOutput.value = state.markdownText;

  // 渲染可视化表格（默认无筛选）
  renderFilterableTable('');
}

// 视图切换辅助函数
function setScheduleView(viewMode) {
  state.visualSubView = viewMode;
  const inactiveClass = 'px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium transition-all';
  const activeClass = 'px-2.5 py-1 rounded-md bg-white text-indigo-700 shadow-2xs font-bold transition-all';
  const isTextView = viewMode === 'text';
  const isCardsView = viewMode === 'cards';
  const els = getActiveViewEls();

  els.tabs.cards.className = isCardsView ? activeClass : inactiveClass;
  els.tabs.table.className = viewMode === 'table' ? activeClass : inactiveClass;
  els.tabs.text.className = isTextView ? activeClass : inactiveClass;

  els.cards.classList.toggle('hidden', !isCardsView);
  els.tableScroll.classList.toggle('hidden', viewMode !== 'table');
  els.text.classList.toggle('hidden', !isTextView);
  if (viewMode === 'text') {
    els.empty.classList.add('hidden');
  }
}

// 渲染支持搜索过滤的可视化排班（同时渲染卡片与表格）
function renderFilterableTable(query = '') {
  query = (query || '').trim().toLowerCase();
  const { items: scheduleItems } = getActiveScheduleData();
  const els = getActiveViewEls();

  // 查询中的空格归一化为中心点（人名存储形式如 Lando·Norris），带空格输入同样命中
  const normalizedQuery = query.replace(/\s+/g, '·');

  const filteredItems = scheduleItems.filter(item => {
    if (!query) return true;
    if (item.dateStr.toLowerCase().includes(query)) return true;
    if (item.weekday.toLowerCase().includes(query)) return true;
    if (window.APP_LANG === 'en') {
      const wdIdx = matchWeekdayToken(query);
      if (wdIdx !== null && item.weekday === weekdayName(wdIdx)) return true;
    }
    return item.names.some(name => name.toLowerCase().includes(normalizedQuery));
  });

  if (query) {
    els.btnClear.classList.remove('hidden');
    els.stats.innerHTML = window.APP_LANG === 'en'
      ? `Found <b class="text-indigo-600 font-bold">${filteredItems.length}</b> days (matching “${query}”)`
      : `共找到 <b class="text-indigo-600 font-bold">${filteredItems.length}</b> 天（匹配 “${query}”）`;
  } else {
    els.btnClear.classList.add('hidden');
    els.stats.textContent = window.APP_LANG === 'en' ? `${scheduleItems.length} days in total` : `共 ${scheduleItems.length} 天`;
  }

  if (state.visualSubView === 'text') {
    els.empty.classList.add('hidden');
    return;
  }

  if (filteredItems.length === 0) {
    els.tableBody.innerHTML = '';
    els.cards.innerHTML = '';
    els.empty.classList.remove('hidden');
    return;
  }

  els.empty.classList.add('hidden');

  // 1. 渲染电脑端表格行
  const rowsHtml = filteredItems.map((item, idx) => {
    const dateDisplay = highlightMatch(item.dateStr, query);
    const weekdayDisplay = highlightMatch(item.weekday, query);

    const namesHtml = item.names.map(name => {
      const isMatch = query && name.toLowerCase().includes(normalizedQuery);
      const highlightedName = highlightMatch(name, normalizedQuery);
      return `<span class="inline-block cursor-pointer px-2 py-0.5 rounded-md text-xs font-medium mr-1.5 my-0.5 border ${isMatch ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700'}" onclick="setTableSearch('${name}')" title="${t('filterThis') || '点击筛选此人排班'}">${highlightedName}</span>`;
    }).join(window.APP_LANG === 'en' ? ', ' : '，');

    const badge = item.isManualWorkday
      ? '<span class="text-[10px] font-bold text-white bg-[#22C55E] px-1.5 py-0.5 rounded ml-1.5">' + (t('makeupShort') || '补') + '</span>'
      : '';

    return `
      <tr class="hover:bg-indigo-50/30 transition-colors">
        <td class="py-2.5 px-4 font-mono text-slate-400">${idx + 1}</td>
        <td class="py-2.5 px-4 font-medium font-mono text-slate-900 flex items-center">${dateDisplay} ${badge}</td>
        <td class="py-2.5 px-4 text-slate-600 font-medium">${weekdayDisplay}</td>
        <td class="py-2.5 px-4">${namesHtml}</td>
      </tr>
    `;
  }).join('');
  els.tableBody.innerHTML = rowsHtml;

  // 2. 渲染手机端卡片流
  const cardsHtml = filteredItems.map((item, idx) => {
    const dateDisplay = highlightMatch(item.dateStr, query);
    const weekdayDisplay = highlightMatch(item.weekday, query);

    const cardChipsHtml = item.names.map(name => {
      const isMatch = query && name.toLowerCase().includes(normalizedQuery);
      const highlightedName = highlightMatch(name, normalizedQuery);
      return `<span class="mobile-person-chip inline-block cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium border ${isMatch ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-slate-100 border-slate-200 text-slate-800 active:bg-indigo-100 active:text-indigo-800'}" onclick="setTableSearch('${name}')" title="${t('filterThis') || '点击筛选此人排班'}">${highlightedName}</span>`;
    }).join('');

    const badge = item.isManualWorkday
      ? '<span class="text-[10px] font-bold text-white bg-[#22C55E] px-1.5 py-0.5 rounded ml-1">' + (t('makeupBadge') || '补班') + '</span>'
      : '';

    return `
      <div class="schedule-card bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">${tf('dayNBadge', { d: idx + 1 }) || `第 ${idx + 1} 天`}</span>
            <span class="text-xs sm:text-sm font-bold text-slate-900 font-mono">${dateDisplay}</span>
            ${badge}
          </div>
          <span class="text-xs font-semibold ${isWeekendName(item.weekday) ? 'text-amber-600' : 'text-slate-600'}">${weekdayDisplay}</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${cardChipsHtml}
        </div>
      </div>
    `;
  }).join('');
  els.cards.innerHTML = cardsHtml;
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setTableSearch(keyword) {
  getActiveViewEls().search.value = keyword;
  renderFilterableTable(keyword);
}

// 复制 Markdown 到剪贴板
function copyMarkdownToClipboard() {
  const { markdown } = getActiveScheduleData();
  if (!markdown) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(markdown).then(() => {
      showToast(t('copied') || '排班表 Markdown 已成功复制到剪贴板！');
    }).catch(() => {
      fallbackCopyText(markdown);
    });
  } else {
    fallbackCopyText(markdown);
  }
}

function fallbackCopyText(text) {
  getActiveViewEls().markdown.select();
  document.execCommand('copy');
  showToast(t('copied') || '排班表 Markdown 已成功复制到剪贴板！');
}

// 导出并下载排班表 CSV 文件 (带 BOM 防止 Excel 乱码)
function downloadCsvFile() {
  const { items } = getActiveScheduleData();
  if (!items || items.length === 0) return;

  const en = window.APP_LANG === 'en';
  const message = t('csvExportConfirm') || '导出 CSV 前请注意：\n• 打开后若日期显示为一行井号 "#"，需自行加宽单元格列宽；\n• CSV 不支持格式的保存，故您需要自行另存为 xlsx 等格式。\n\n是否继续导出？';
  if (!window.confirm(message)) return;

  const csvContent = formatToCsv(items);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const startDate = items[0]?.dateStr || '';
  const endDate = items[items.length - 1]?.dateStr || '';
  const fileName = window.APP_LANG === 'en' ? `Schedule_${startDate}_to_${endDate}.csv` : `排班表_${startDate}_至_${endDate}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(t('csvExported') || `排班表 CSV 文件已导出并开始下载！`);
}

/**
 * 生成独立的单文件 HTML 可视化排班表
 * 纯内联样式与脚本，无外部 CDN 依赖，双击即可直接在任何浏览器完美离线打开
 */
function generateStandaloneHtml(items, stats) {
  const itemsJson = JSON.stringify(items);
  const statsJson = JSON.stringify(stats);
  const markdownText = formatToMarkdown(items);
  const markdownJson = JSON.stringify(markdownText);
  const en = window.APP_LANG === 'en';
  const title = en ? `Schedule (${stats.startDate} to ${stats.endDate})` : `排班表 (${stats.startDate} 至 ${stats.endDate})`;
  const footerHtml = renderMarkdownFooter(siteFooterMarkdown);

  return `<!DOCTYPE html>
<html lang="${en ? 'en' : 'zh-CN'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
      padding: 16px 12px;
    }
    @media (min-width: 640px) {
      body { padding: 32px 16px; }
    }
    .container {
      max-width: 1024px;
      margin: 0 auto;
    }
    .header {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    @media (min-width: 640px) {
      .header { padding: 24px; margin-bottom: 24px; }
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    @media (min-width: 640px) {
      .title { font-size: 24px; }
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-csv {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-csv:hover {
      background: #1d4ed8;
    }
    .btn-print {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #4338ca;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    @media (min-width: 640px) {
      .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
    }
    .stat-card {
      background: #f1f5f9;
      border-radius: 10px;
      padding: 10px 12px;
      text-align: center;
    }
    .stat-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 2px;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    @media (min-width: 640px) {
      .stat-value { font-size: 20px; }
    }
    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .toolbar {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 420px;
    }
    .search-input {
      width: 100%;
      padding: 8px 30px 8px 32px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 13px;
      color: #1e293b;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 13px;
      pointer-events: none;
    }
    .btn-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #94a3b8;
      font-weight: bold;
      cursor: pointer;
      display: none;
      padding: 4px;
    }
    .btn-clear:hover { color: #475569; }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toolbar-info {
      font-size: 12px;
      color: #64748b;
    }
    .view-toggle {
      display: inline-flex;
      background: #e2e8f0;
      padding: 2px;
      border-radius: 8px;
    }
    .view-btn {
      border: none;
      background: none;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .view-btn.active {
      background: #ffffff;
      color: #4338ca;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .copy-wrapper {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 15;
    }
    .btn-copy {
      height: 36px;
      border: none;
      border-radius: 8px;
      background: #4f46e5;
      color: #ffffff;
      padding: 0 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(79,70,229,0.25);
      transition: background 0.2s;
    }
    .btn-copy:hover { background: #4338ca; }
    .markdown-wrapper {
      position: relative;
      overflow: visible;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      display: block;
    }
    .markdown-output {
      display: block;
      width: 100%;
      height: auto;
      min-height: 400px;
      padding: 44px 56px 16px 16px;
      background: transparent;
      color: #e2e8f0;
      border: none;
      outline: none;
      resize: none;
      font-family: Consolas, "Courier New", monospace;
      font-size: 13px;
      line-height: 1.65;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .markdown-output.copy-success {
      box-shadow: inset 0 0 0 2px #10b981;
    }
    .app-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      z-index: 60;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #1e293b;
      border-radius: 12px;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 10px 15px -3px rgba(15,23,42,0.25), 0 4px 6px -4px rgba(15,23,42,0.25);
      opacity: 0;
      transform: translate(-50%, -16px);
      transition: opacity 0.3s, transform 0.3s;
    }
    .app-toast.visible {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    /* 卡片样式 */
    .cards-wrapper {
      padding: 12px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .card-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .card-title-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-day-num {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    .card-date-text {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      font-family: monospace;
    }
    .card-weekday-text {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
    .card-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .mobile-person-chip {
      display: inline-block;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      touch-action: manipulation;
      transition: all 0.15s;
    }
    .mobile-person-chip:active {
      background: #e0e7ff;
      color: #3730a3;
    }
    .mobile-person-chip.active-match {
      background: #fef08a;
      color: #854d0e;
      border-color: #fde047;
      font-weight: 700;
    }
    /* 表格样式 */
    .table-wrapper {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
      min-width: 480px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 5;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    tr:nth-child(even) { background-color: #fafafa; }
    tr:hover { background-color: #f1f5f9; }
    .person-chip {
      display: inline-block;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 2px 8px;
      margin: 2px 4px 2px 0;
      font-weight: 500;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .person-chip:hover {
      background: #e0e7ff;
      color: #3730a3;
      border-color: #c7d2fe;
    }
    .person-chip.active-match {
      background: #fef08a;
      color: #854d0e;
      border-color: #fde047;
      font-weight: 700;
    }
    .badge-makeup {
      font-size: 10px;
      font-weight: 700;
      color: #ffffff;
      background: #22C55E;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }
    mark.highlight {
      background-color: #fef08a;
      color: #854d0e;
      padding: 1px 3px;
      border-radius: 3px;
      font-weight: 700;
    }
    .empty-state {
      padding: 48px 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      display: none;
    }
    .site-footer {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      background-color: #ffffff;
      padding: 12px 12px;
      text-align: center;
    }
    .site-footer-content {
      max-width: 1024px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      line-height: 1.5;
      color: #475569;
    }
    .site-footer-content p {
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .site-footer-content .site-footer-line {
      flex-basis: 100%;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .site-footer-content a {
      color: #4f46e5;
      text-decoration: none;
    }
    .site-footer-content img {
      height: 20px;
      width: auto;
      max-width: 100%;
      display: inline-block;
      vertical-align: middle;
    }
    .hidden { display: none !important; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .header { border: none; box-shadow: none; padding: 0 0 16px 0; }
      .btn-print, .btn-csv, .header-actions, .toolbar, .cards-wrapper, .view-toggle, .markdown-wrapper { display: none !important; }
      .table-wrapper { display: block !important; max-height: none; overflow: visible; }
      .table-container { border: 1px solid #000000; box-shadow: none; }
      th, td { border-bottom: 1px solid #cccccc; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <div>
          <div class="title">${en ? 'Schedule' : '排班表'}</div>
          <div class="subtitle">${en ? `Schedule period: ${stats.startDate} to ${stats.endDate} <br> Click a name to filter quickly.` : `排班区间：${stats.startDate} 至 ${stats.endDate} <br> 点击人名亦可快速筛选。`}</div>
        </div>
        <div class="header-actions">
          <button class="btn-csv" onclick="downloadCsv()">${en ? 'CSV' : '表格'}</button>
          <button class="btn-print" onclick="window.print()">PDF</button>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">${en ? 'Total People' : '总参与人数'}</div>
          <div class="stat-value">${stats.totalPeople} ${en ? '' : '人'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${en ? 'People per Day' : '每日值班人数'}</div>
          <div class="stat-value">${stats.dailyPeople} ${en ? '' : '人'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${en ? 'Days in Cycle' : '排班总天数'}</div>
          <div class="stat-value">${stats.totalDays} ${en ? '' : '天整'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${en ? 'Shifts per Person' : '每人轮值次数'}</div>
          <div class="stat-value">${stats.shiftsPerPerson} ${en ? '' : '次'}</div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <div class="toolbar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" class="search-input" placeholder="${en ? 'Search by name, date or weekday...' : '输入姓名、日期或星期搜索...'}">
          <button id="btnClear" class="btn-clear" onclick="clearSearch()">✕</button>
        </div>
        <div class="toolbar-right">
          <div id="statsInfo" class="toolbar-info">${en ? items.length + ' days in total' : '共 ' + items.length + ' 天'}</div>
          <div class="view-toggle">
            <button id="btnCards" class="view-btn" onclick="setViewMode('cards')">${en ? 'Cards' : '卡片'}</button>
            <button id="btnTable" class="view-btn" onclick="setViewMode('table')">${en ? 'Table' : '表格'}</button>
            <button id="btnText" class="view-btn" onclick="setViewMode('text')">${en ? 'Text' : '文本'}</button>
          </div>
        </div>
      </div>

      <!-- 手机端卡片流容器 -->
      <div id="cardsWrapper" class="cards-wrapper"></div>

      <!-- 电脑端表格容器 -->
      <div id="tableWrapper" class="table-wrapper hidden">
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">${en ? 'No.' : '序号'}</th>
              <th style="width: 130px;">${en ? 'Date' : '日期'}</th>
              <th style="width: 80px;">${en ? 'Weekday' : '星期'}</th>
              <th>${en ? 'On Duty' : '值班人员'}</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>

      <div id="emptyState" class="empty-state">
        <div style="font-size: 28px; margin-bottom: 8px;">🔍</div>
        ${en ? 'No schedule records match the keyword' : '未找到与关键词匹配的排班记录'}
      </div>

      <div id="markdownWrapper" class="markdown-wrapper">
        <div class="copy-wrapper">
          <button id="btnCopy" class="btn-copy" onclick="copyMarkdown()" aria-label="${en ? 'Copy Markdown text' : '复制 Markdown 文本'}" title="${en ? 'Copy Markdown text' : '复制 Markdown 文本'}">${en ? 'Copy' : '复制'}</button>
        </div>
        <textarea id="markdownOutput" class="markdown-output" readonly></textarea>
      </div>
    </div>
  </div>

  <footer class="site-footer" aria-label="${en ? 'Footer' : '页脚'}">
    <div id="footerContent" class="site-footer-content"></div>
  </footer>

  <div id="appToast" class="app-toast">
    <span>✓</span>
    <span id="appToastMessage">${en ? 'Operation successful' : '操作成功'}</span>
  </div>

  <script>
    const scheduleData = ${itemsJson};
    const statsData = ${statsJson};
    const langEn = ${en ? 'true' : 'false'};

    // 按语言取文本：en 模式返回英文，否则回退到传入的中文默认值
    function L(zh, enText) { return langEn ? enText : zh; }
    const WEEKDAY_EN_NAMES = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
    function weekdayNameEn(i) { return WEEKDAY_EN_NAMES[i]; }
    // 英文星期别名映射（供搜索匹配）
    function matchWeekdayEn(q) {
      const tokens = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };
      const full = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
      const t0 = q.replace(/\\.+$/, '').toLowerCase();
      if (tokens[t0] !== undefined) return tokens[t0];
      return full[t0] !== undefined ? full[t0] : null;
    }
    const markdownText = ${markdownJson};
    let currentView = window.innerWidth < 640 ? 'cards' : 'table';

    const searchInput = document.getElementById('searchInput');
    const btnClear = document.getElementById('btnClear');
    const tableBody = document.getElementById('tableBody');
    const cardsWrapper = document.getElementById('cardsWrapper');
    const tableWrapper = document.getElementById('tableWrapper');
    const btnCards = document.getElementById('btnCards');
    const btnTable = document.getElementById('btnTable');
    const btnText = document.getElementById('btnText');
    const statsInfo = document.getElementById('statsInfo');
    const emptyState = document.getElementById('emptyState');
    const markdownWrapper = document.getElementById('markdownWrapper');
    const markdownOutput = document.getElementById('markdownOutput');
    const btnCopy = document.getElementById('btnCopy');
    const appToast = document.getElementById('appToast');
    const appToastMessage = document.getElementById('appToastMessage');

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
    }

    function escapeReg(str) {
      return str.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    }

    function highlight(text, query) {
      if (!query) return escapeHtml(text);
      const reg = new RegExp('(' + escapeReg(query) + ')', 'gi');
      return escapeHtml(text).replace(reg, '<mark class="highlight">$1</mark>');
    }

    function setViewMode(mode) {
      currentView = mode;
      btnCards.className = mode === 'cards' ? 'view-btn active' : 'view-btn';
      btnTable.className = mode === 'table' ? 'view-btn active' : 'view-btn';
      btnText.className = mode === 'text' ? 'view-btn active' : 'view-btn';
      cardsWrapper.classList.toggle('hidden', mode !== 'cards');
      tableWrapper.classList.toggle('hidden', mode !== 'table');
      markdownWrapper.classList.toggle('hidden', mode !== 'text');
      if (mode === 'text') emptyState.style.display = 'none';
    }

    function render(query = '') {
      query = query.trim().toLowerCase();
      btnClear.style.display = query ? 'block' : 'none';

      // 查询中的空格归一化为中心点（人名存储形式如 Lando·Norris）
      const normalizedQuery = query.replace(/\\s+/g, '·');
      const filtered = scheduleData.filter(item => {
        if (!query) return true;
        if (item.dateStr.toLowerCase().includes(query)) return true;
        if (item.weekday.toLowerCase().includes(query)) return true;
        if (langEn) {
          const wdIdx = matchWeekdayEn(query);
          if (wdIdx !== null && item.weekday === weekdayNameEn(wdIdx)) return true;
        }
        return item.names.some(name => name.toLowerCase().includes(normalizedQuery));
      });

      if (query) {
        statsInfo.innerHTML = L('共找到 <b>' + filtered.length + '</b> 天（匹配 “' + escapeHtml(query) + '”）', 'Found <b>' + filtered.length + '</b> days (matching “' + escapeHtml(query) + '”)');
      } else {
        statsInfo.textContent = L('共 ' + scheduleData.length + ' 天', scheduleData.length + ' days in total');
      }

      if (currentView === 'text') {
        emptyState.style.display = 'none';
        return;
      }

      if (filtered.length === 0) {
        tableBody.innerHTML = '';
        cardsWrapper.innerHTML = '';
        emptyState.style.display = 'block';
        return;
      }
      emptyState.style.display = 'none';

      let tableHtml = '';
      let cardsHtml = '';

      filtered.forEach((item, idx) => {
        const makeupBadge = item.isManualWorkday ? '<span class="badge-makeup">' + L('补','Makeup') + '</span>' : '';
        const makeupCardBadge = item.isManualWorkday ? '<span class="badge-makeup">' + L('补班','Makeup') + '</span>' : '';

        // 表格行
        const tableNamesHtml = item.names.map(name => {
          const isMatch = query && name.toLowerCase().includes(normalizedQuery);
          return '<span class="person-chip ' + (isMatch ? 'active-match' : '') + '" data-name="' + escapeHtml(name) + '" title="' + L('点击筛选', 'Click to filter') + '">' + highlight(name, normalizedQuery) + '</span>';
        }).join(L('，', ', '));

        tableHtml += '<tr>' +
          '<td style="color: #94a3b8; font-family: monospace;">' + (idx + 1) + '</td>' +
          '<td style="font-weight: 600; font-family: monospace;">' + highlight(item.dateStr, query) + makeupBadge + '</td>' +
          '<td style="color: #475569;">' + highlight(item.weekday, query) + '</td>' +
          '<td>' + tableNamesHtml + '</td>' +
        '</tr>';

        // 卡片项
        const cardChipsHtml = item.names.map(name => {
          const isMatch = query && name.toLowerCase().includes(normalizedQuery);
          return '<span class="mobile-person-chip ' + (isMatch ? 'active-match' : '') + '" data-name="' + escapeHtml(name) + '" title="' + L('点击筛选', 'Click to filter') + '">' + highlight(name, normalizedQuery) + '</span>';
        }).join('');

        cardsHtml += '<div class="card-item">' +
          '<div class="card-header">' +
            '<div class="card-title-left">' +
              '<span class="card-day-num">' + L('第 ' + (idx + 1) + ' 天', 'Day ' + (idx + 1)) + '</span>' +
              '<span class="card-date-text">' + highlight(item.dateStr, query) + '</span>' +
              makeupCardBadge +
            '</div>' +
            '<span class="card-weekday-text">' + highlight(item.weekday, query) + '</span>' +
          '</div>' +
          '<div class="card-chips">' + cardChipsHtml + '</div>' +
        '</div>';
      });

      tableBody.innerHTML = tableHtml;
      cardsWrapper.innerHTML = cardsHtml;
    }

    function filterByName(name) {
      searchInput.value = name;
      render(name);
    }

    let copyFeedbackTimer = null;
    function copyMarkdown() {
      markdownOutput.value = markdownText;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(markdownText).then(showCopySuccess).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    }

    function fallbackCopy() {
      markdownOutput.focus();
      markdownOutput.select();
      document.execCommand('copy');
      showCopySuccess();
    }

    function showCopySuccess() {
      markdownOutput.classList.add('copy-success');
      appToastMessage.textContent = L('排班表 Markdown 已成功复制到剪贴板！', 'Schedule Markdown copied to the clipboard!');
      appToast.classList.add('visible');
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = setTimeout(function() {
        markdownOutput.classList.remove('copy-success');
        appToast.classList.remove('visible');
      }, 2200);
    }

    function clearSearch() {
      searchInput.value = '';
      render('');
      searchInput.focus();
    }

    document.addEventListener('click', function(e) {
      const chip = e.target.closest('.person-chip, .mobile-person-chip');
      if (chip && chip.dataset.name) {
        filterByName(chip.dataset.name);
      }
    });

    searchInput.addEventListener('input', function(e) { render(e.target.value); });

    function downloadCsv() {
      const confirmMessage = L('导出 CSV 前请注意：\\n• 打开后若日期显示为一行井号 \"#\"，需自行加宽单元格列宽；\\n• CSV 不支持格式的保存，故您需要自行另存为 xlsx 等格式。\\n\\n是否继续导出？', 'Note before exporting CSV:\\n• If a date is displayed as a row of hash symbols (\"#\") after opening, you need to widen the cell column yourself.\\n• CSV does not support saving formatting, so you need to save the file as xlsx or another format yourself.\\n\\nExport CSV anyway?');
      if (!window.confirm(confirmMessage)) return;
      const maxNames = scheduleData.reduce(function(m, item) { return Math.max(m, (item.names || []).length); }, 0);
      const headers = L(['序号', '日期', '星期', '排班名单'], ['No.', 'Date', 'Weekday', 'Names']);
      if (maxNames > 1) {
        for (let i = 1; i <= maxNames; i++) {
          headers.push(L('人员' + i, 'Person ' + i));
        }
      }

      const rows = scheduleData.map(function(item, index) {
        const seq = index + 1;
        const date = item.dateStr;
        const weekday = item.weekday;
        const names = item.names || [];
        const namesStr = names.join(L('，', ', '));
        const safeNames = '"' + namesStr.replace(/"/g, '""') + '"';
        const row = [seq, date, weekday, safeNames];

        if (maxNames > 1) {
          for (let i = 0; i < maxNames; i++) {
            const n = names[i] || '';
            row.push('"' + n.replace(/"/g, '""') + '"');
          }
        }
        return row.join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\\r\\n');
      const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = L('排班表_' + (statsData.startDate || '') + '_至_' + (statsData.endDate || '') + '.csv', 'Schedule_' + (statsData.startDate || '') + '_to_' + (statsData.endDate || '') + '.csv');
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setViewMode(currentView);
    render('');
    markdownOutput.value = markdownText;

    var footerContent = document.getElementById('footerContent');
    if (footerContent) footerContent.innerHTML = ${JSON.stringify(footerHtml)};
  </script>
</body>
</html>`;
}

// 导出并下载独立可视化 HTML 文件
function downloadHtmlFile() {
  const { items } = getActiveScheduleData();
  if (!items || items.length === 0) return;

  const startDate = items[0]?.dateStr || '';
  const endDate = items[items.length - 1]?.dateStr || '';

  let stats;
  if (state.mode === 'editOld') {
    //  顺延自旧排班表：由生成结果反推统计指标
    const peopleSet = new Set();
    let dailyPeople = 0;
    items.forEach(item => {
      item.names.forEach(n => peopleSet.add(n));
      dailyPeople = Math.max(dailyPeople, item.names.length);
    });
    const totalShifts = items.reduce((sum, item) => sum + item.names.length, 0);
    stats = {
      totalPeople: peopleSet.size,
      dailyPeople,
      totalDays: items.length,
      shiftsPerPerson: items.length > 0 ? Math.round(totalShifts / peopleSet.size) : 0,
      startDate,
      endDate
    };
  } else {
    stats = {
      totalPeople: state.names.length,
      dailyPeople: state.dailyCount,
      totalDays: state.scheduleAssignments.totalDays,
      shiftsPerPerson: state.scheduleAssignments.shiftsPerPerson,
      startDate,
      endDate
    };
  }

  const htmlContent = generateStandaloneHtml(items, stats);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = window.APP_LANG === 'en' ? `Schedule_${startDate}_to_${endDate}.html` : `可视化排班表_${startDate}_至_${endDate}.html`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(t('htmlExported') || `已导出独立可视化排班表 HTML 文件`);
}

// ----------------------------------------------------
//  顺延自旧排班表：四步流程（导入旧表 → 检查日期 → 选择日期 → 成功生成）
// ----------------------------------------------------

// 步骤跳转控制（?editStep=1~4，与新流程 ?step=0~5 互不冲突）
function goToEditStep(targetStep) {
  if (targetStep < 1 || targetStep > 4) return;
  const edit = state.editOld;

  // 进入旧表流程：切换模式并备份新流程的假期设置（仅首次）
  if (state.mode !== 'editOld') {
    state.mode = 'editOld';
    savedNewHolidays = state.excludedHolidays;
    savedNewWorkdays = state.manualWorkdays;
  }

  // 逐步前置校验
  if (targetStep >= 2 && edit.importedItems.length === 0) {
    showToast(t('errImportFirst') || '请先成功导入旧排班表', '⚠️');
    return;
  }
  if (targetStep >= 3) {
    if (!edit.executedThrough) {
      showToast(t('errPickThrough') || '请先选择已执行截止日期', '⚠️');
      return;
    }
    if (edit.remainingItems.length === 0) {
      showToast(t('errNoRemaining') || '没有剩余需要重新编排的班次', '⚠️');
      return;
    }
  }
  if (targetStep >= 4 && !edit.newStartDate) {
    showToast(t('errPickNewStart') || '请先选择重新编排的起始日期', '⚠️');
    return;
  }

  // 进入第 3 步：清空共享假期集合，日历定位到新起始日期所在月
  if (targetStep === 3) {
    if (!edit.newStartDate) {
      edit.newStartDate = getTodayDateStr();
      elements.editNewStartDateInput.value = edit.newStartDate;
    }
    state.excludedHolidays.clear();
    state.manualWorkdays.clear();
    const startD = parseDate(edit.newStartDate);
    state.calViewYear = startD.getFullYear();
    state.calViewMonth = startD.getMonth();
    renderEditCalendar();
  }

  // 进入第 4 步：生成新排班并渲染结果视图
  if (targetStep === 4) {
    if (!generateEditFinalSchedule()) return;
    elements.editMarkdownOutput.value = edit.markdownText;
    renderFilterableTable('');
    setScheduleView(state.visualSubView);
  }

  // 更新面板可见性（同时隐藏新流程面板）
  elements.editPanels.forEach((panel, i) => {
    if (!panel) return;
    if (i === targetStep) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });
  elements.panels.forEach(p => p && p.classList.add('hidden'));

  state.currentStep = targetStep;
  // 将当前步骤同步到网址参数 (?editStep=N)
  history.replaceState(null, '', `${location.pathname}?${window.APP_LANG === 'en' ? 'lang=en&' : ''}editStep=${targetStep}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 生成新的排班结果：剩余班次按原顺序映射到新起始日期之后的工作日
function generateEditFinalSchedule() {
  const edit = state.editOld;
  const { workdays } = computeScheduleDates(
    edit.newStartDate,
    edit.remainingItems.length,
    state.excludedHolidays,
    state.manualWorkdays
  );

  // 假期设置可能导致可用工作日不足，需阻断并提示
  if (workdays.length < edit.remainingItems.length) {
    showToast(tf('errNotEnoughDays', { need: edit.remainingItems.length, have: workdays.length }) || `可用工作日不足：需要 ${edit.remainingItems.length} 天，仅找到 ${workdays.length} 天，请检查假期设置`, '⚠️');
    return false;
  }

  edit.finalItems = workdays.map((wd, i) => ({
    dateStr: wd.dateStr,
    weekday: wd.weekday,
    isManualWorkday: wd.isManualWorkday,
    names: edit.remainingItems[i].names
  }));
  edit.markdownText = formatToMarkdown(edit.finalItems);
  return true;
}

// 第 1 步：导入 CSV 文件（读取为文本后走统一解析入口）
function handleEditImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    elements.editImportTextarea.value = String(reader.result || '');
    handleEditParseText();
  };
  reader.onerror = () => showToast(t('fileReadFailed') || '文件读取失败，请重试', '✗');
  reader.readAsText(file, 'UTF-8');
  // 清空 input.value 以便再次选择同一文件时仍能触发 change
  event.target.value = '';
}

// 第 1 步：解析文本框内容（自动识别 Markdown / CSV）
function handleEditParseText() {
  const text = elements.editImportTextarea.value;
  const result = parseOldRoster(text);

  if (result.errors.length > 0) {
    elements.editImportError.innerHTML = `
      <div class="font-bold flex items-center space-x-1.5 text-red-900 mb-1">${t('parseProblems') || '解析发现问题：'}</div>
      <ul class="list-disc list-inside space-y-0.5 font-mono">${result.errors.map(err => `<li>${err}</li>`).join('')}</ul>
    `;
    elements.editImportError.classList.remove('hidden');
  } else {
    elements.editImportError.classList.add('hidden');
    elements.editImportError.innerHTML = '';
  }

  if (result.items.length === 0) {
    showToast(t('parseFailed') || '解析失败，请检查内容格式', '✗');
    return false;
  }

  state.editOld.importedItems = result.items;
  // 导入内容变化后，此前的截止日选择不再可靠，重置后续状态
  state.editOld.executedThrough = '';
  state.editOld.remainingItems = [];
  state.editOld.finalItems = [];
  elements.editExecutedThroughInput.value = '';
  elements.editExecutedWeekdayTag.textContent = '';
  elements.editStatRemaining.textContent = '';

  if (result.warnings.length > 0) {
    showToast(tf('parseWarn', { n: result.items.length, w: result.warnings.length }) || `成功解析 ${result.items.length} 天（含 ${result.warnings.length} 条警告）`, '⚠️');
  } else {
    showToast(tf('parseOk', { n: result.items.length }) || `成功解析 ${result.items.length} 天排班记录！`);
  }
  return true;
}

// 第 1 步「继续」：先解析输入内容，成功才进入第 2 步
function handleEditToStep2() {
  if (!handleEditParseText()) return;
  goToEditStep(2);
}

// 第 2 步：渲染导入的旧排班卡片视图，已执行日期置灰并标注
function renderEditImportedCards() {
  const edit = state.editOld;
  const total = edit.importedItems.length;
  const executedCount = edit.executedThrough
    ? edit.importedItems.filter(item => item.dateStr <= edit.executedThrough).length
    : 0;
  const remaining = total - executedCount;

  if (edit.executedThrough) {
    elements.editStatRemaining.innerHTML = `
      ${window.APP_LANG === 'en'
        ? `Imported <b class="text-indigo-600">${total}</b> days in total;<br>
      Executed <b class="text-slate-500">${executedCount}</b> days;<br>
      <b class="text-emerald-600">${remaining}</b> days remain to be re-scheduled.`
        : `导入原 <b class="text-indigo-600">${total}</b> 天；<br>
      已执行 <b class="text-slate-500">${executedCount}</b> 天；<br>
      剩余 <b class="text-emerald-600">${remaining}</b> 天待编排。`}
    `;
  } else {
    elements.editStatRemaining.textContent = `共 ${total} 天 · 请选择已执行截止日期`;
  }

  elements.editImportedCardsContainer.innerHTML = edit.importedItems.map((item, idx) => {
    const isExecuted = edit.executedThrough && item.dateStr <= edit.executedThrough;
    const executedBadge = isExecuted
      ? `<span class="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">${t('executedBadge') || '已执行'}</span>`
      : `<span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">${tf('remainBadge', { n: idx - executedCount + 1 }) || `剩余 第 ${idx - executedCount + 1} 班`}</span>`;
    const cardClass = isExecuted ? 'opacity-50 bg-slate-50' : 'bg-white';
    const weekdayColor = isWeekendName(item.weekday) ? 'text-amber-600' : 'text-slate-600';

    return `
      <div class="schedule-card rounded-xl border border-slate-200 p-3 shadow-2xs ${cardClass}">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">${tf('dayNBadge', { d: idx + 1 }) || `第 ${idx + 1} 天`}</span>
            <span class="text-xs sm:text-sm font-bold text-slate-900 font-mono">${item.dateStr}</span>
            ${executedBadge}
          </div>
          <span class="text-xs font-semibold ${weekdayColor}">${item.weekday}</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${item.names.map(name =>
            `<span class="inline-block px-2.5 py-1 rounded-lg text-xs font-medium border bg-slate-100 border-slate-200 text-slate-800">${name}</span>`
          ).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// 第 2 步：已执行截止日变化（含该天）
function handleEditExecutedThroughChange() {
  const val = elements.editExecutedThroughInput.value;
  if (!val) return;
  const edit = state.editOld;

  // 至少已执行 1 天：不允许早于导入列表的第一天
  const firstDate = edit.importedItems[0]?.dateStr;
  if (firstDate && val < firstDate) {
    elements.editExecutedThroughInput.value = '';
    edit.executedThrough = '';
    edit.remainingItems = [];
    elements.editExecutedWeekdayTag.innerHTML = '';
    elements.editStatRemaining.textContent = '请选择已执行截止日期';
    renderEditImportedCards();
    elements.editImportError.innerHTML = `已执行截止日期不能早于导入排班的第一天（${firstDate}）：至少需要已执行 1 天。`;
    elements.editImportError.classList.remove('hidden');
    showToast(t('errThroughEarlyToast') || '已执行截止日期过早，至少需已执行 1 天', '⚠️');
    return;
  }

  elements.editImportError.classList.add('hidden');
  elements.editImportError.innerHTML = '';
  edit.executedThrough = val;

  const date = parseDate(val);
  elements.editExecutedWeekdayTag.innerHTML =
    window.APP_LANG === 'en'
    ? `Executed through <span class="text-indigo-600 font-semibold">${weekdayName(date.getDay())}</span>;<br>shifts on and before this day will be ignored.`
    : `已执行截止日为 <span class="text-indigo-600 font-semibold">${weekdayName(date.getDay())}</span>，<br>该天及之前的班次将被忽略。`;

  // 字符串比较对 YYYY-MM-DD 即为时间顺序
  state.editOld.remainingItems = state.editOld.importedItems.filter(item => item.dateStr > val);
  renderEditImportedCards();
}

// 第 3 步：新起始日期变化
function handleEditNewStartDateChange() {
  const val = elements.editNewStartDateInput.value;
  if (!val) return;
  state.editOld.newStartDate = val;

  const date = parseDate(val);
  const dayOfWeek = date.getDay();
  const weekday = weekdayName(dayOfWeek);
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    elements.editNewWeekdayTag.innerHTML = `
      ${en
        ? `<span class="text-amber-600 font-bold">This date is ${weekday} (a non-workday)</span>. Scheduling will begin on the nearest workday or adjusted makeup workday.`
        : `<span class="text-amber-600 font-bold">该日为 ${weekday}（非工作日）</span>，排班将从最近的工作日或调休补班日开始。`}
    `;
  } else {
    elements.editNewWeekdayTag.innerHTML = `
      ${en ? `Start date is <span class="text-indigo-600 font-semibold">${weekday}</span> (a workday).` : `起始日为 <span class="text-indigo-600 font-semibold">${weekday}</span>（工作日）。`}
    `;
  }

  const startD = parseDate(val);
  state.calViewYear = startD.getFullYear();
  state.calViewMonth = startD.getMonth();
  // 起始日期变化后，合法选择区间随之变化，清理超出范围的假期记录
  pruneScheduleDateSelections(val, '9999-12-31');
  renderEditCalendar();
}

// 旧表流程的日历合法区间：从新起始日期到最后一班（上不封顶地扫描）
function getEditScheduleDateRange() {
  const edit = state.editOld;
  const { workdays } = computeScheduleDates(
    edit.newStartDate || getTodayDateStr(),
    edit.remainingItems.length + 1,
    state.excludedHolidays,
    state.manualWorkdays
  );
  const allowed = workdays.slice(0, edit.remainingItems.length);
  const fallback = edit.newStartDate || getTodayDateStr();
  return {
    start: fallback,
    end: allowed.length > 0 ? allowed[allowed.length - 1].dateStr : fallback
  };
}

// 第 3 步：渲染假期修改月历（镜像 renderStep4Calendar，作用于旧表流程）
function renderEditCalendar() {
  const edit = state.editOld;
  const totalDays = edit.remainingItems.length;

  // 渲染前强制清掉超出当前合法区间的选择
  const renderRange = getEditScheduleDateRange();
  pruneScheduleDateSelections(renderRange.start, renderRange.end);

  // 扫描结束日的后一天，确保非法补班日期也能获得日历状态
  const { workdays, datesMap } = totalDays > 0
    ? computeScheduleDates(edit.newStartDate, totalDays + 1, state.excludedHolidays, state.manualWorkdays)
    : { workdays: [], datesMap: new Map() };

  if (totalDays > 0 && workdays.length >= totalDays) {
    elements.editCalStatRangeStart.textContent = renderRange.start.replaceAll('-', '/');
    elements.editCalStatRangeEnd.textContent = renderRange.end.replaceAll('-', '/');
  } else {
    elements.editCalStatRangeStart.textContent = '-';
    elements.editCalStatRangeEnd.textContent = '-';
  }

  renderEditExcludedAndManualTags();

  const year = state.calViewYear;
  const month = state.calViewMonth;
  elements.editCalendarMonthTitle.textContent = `${year}/${String(month + 1).padStart(2, '0')}`;

  renderMonthGrid(year, month, datesMap, renderRange, elements.editCalendarGrid);
}

// 渲染旧表流程的排除与补班标签栏
function renderEditExcludedAndManualTags() {
  const hasItems = (state.excludedHolidays.size > 0 || state.manualWorkdays.size > 0);
  if (!hasItems) {
    elements.editExcludedTagsContainer.classList.add('hidden');
    return;
  }

  elements.editExcludedTagsContainer.classList.remove('hidden');

  let tagsHtml = '';
  Array.from(state.excludedHolidays).sort().forEach(dateStr => {
    const d = parseDate(dateStr);
    const wk = weekdayName(d.getDay());
    tagsHtml += `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EF4444] border border-[#EF4444] text-white text-xs font-mono shadow-2xs">
        <span>🚫 ${dateStr} (${wk}) ${t('offTag') || '休'}</span>
        <button type="button" onclick="removeHolidayTag('${dateStr}')" class="hover:text-white/80 font-bold ml-1 text-sm leading-none" title="${t('undoHoliday') || '撤销放假'}">✕</button>
      </span>
    `;
  });
  Array.from(state.manualWorkdays).sort().forEach(dateStr => {
    const d = parseDate(dateStr);
    const wk = weekdayName(d.getDay());
    tagsHtml += `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22C55E] border border-[#22C55E] text-white text-xs font-mono shadow-2xs">
        <span>✅ ${dateStr} (${wk}) ${t('makeupTag') || '补班'}</span>
        <button type="button" onclick="removeManualWorkdayTag('${dateStr}')" class="hover:text-white/80 font-bold ml-1 text-sm leading-none" title="${t('undoMakeup') || '撤销补班'}">✕</button>
      </span>
    `;
  });

  elements.editExcludedTagsList.innerHTML = tagsHtml;
}

// 旧表流程"重新开始"：清空全部旧表状态并回到第 1 步
function resetEditOldFlow() {
  state.editOld.importedItems = [];
  state.editOld.executedThrough = '';
  state.editOld.remainingItems = [];
  state.editOld.newStartDate = '';
  state.editOld.finalItems = [];
  state.editOld.markdownText = '';
  elements.editImportTextarea.value = '';
  elements.editExecutedThroughInput.value = '';
  elements.editNewStartDateInput.value = '';
  elements.editExecutedWeekdayTag.textContent = '';
  elements.editNewWeekdayTag.textContent = '';
  elements.editStatRemaining.textContent = '';
  elements.editImportError.classList.add('hidden');
  goToEditStep(1);
}

// 绑定各事件监听
function setupEventListeners() {
  // Step 1: 名单与人数输入
  elements.namesInput.addEventListener('input', handleStep1Inputs);
  elements.dailyCountInput.addEventListener('input', handleStep1Inputs);

  elements.btnLoadSample.addEventListener('click', () => {
    elements.namesInput.value = getSampleNamesText();
    handleStep1Inputs();
    showToast(t('success') || '成功');
  });

  elements.btnClearNames.addEventListener('click', () => {
    elements.namesInput.value = '';
    handleStep1Inputs();
    showToast(t('success') || '成功');
  });

  elements.btnDecreaseDaily.addEventListener('click', () => {
    let cur = parseInt(elements.dailyCountInput.value, 10) || 4;
    if (cur > 1) {
      elements.dailyCountInput.value = cur - 1;
      handleStep1Inputs();
    }
  });

  elements.btnIncreaseDaily.addEventListener('click', () => {
    let cur = parseInt(elements.dailyCountInput.value, 10) || 4;
    elements.dailyCountInput.value = cur + 1;
    handleStep1Inputs();
  });

  elements.btnToStep2.addEventListener('click', () => goToStep(2));

  // Step 2: 标签切换与重新打乱
  elements.tabStep2Days.addEventListener('click', () => {
    elements.tabStep2Days.className = 'px-3 py-1 rounded-md font-semibold bg-white text-indigo-600 shadow-xs border border-slate-200';
    elements.tabStep2People.className = 'px-3 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900';
    elements.schedulePreviewList.classList.remove('hidden');
    elements.schedulePersonStatsList.classList.add('hidden');
  });

  elements.tabStep2People.addEventListener('click', () => {
    elements.tabStep2People.className = 'px-3 py-1 rounded-md font-semibold bg-white text-indigo-600 shadow-xs border border-slate-200';
    elements.tabStep2Days.className = 'px-3 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900';
    elements.schedulePersonStatsList.classList.remove('hidden');
    elements.schedulePreviewList.classList.add('hidden');
  });

  elements.btnEditAssignments.addEventListener('click', openEditAssignmentsModal);
  elements.btnCloseEditModal.addEventListener('click', closeEditAssignmentsModal);
  elements.btnCancelEditModal.addEventListener('click', closeEditAssignmentsModal);
  elements.btnResetEditModal.addEventListener('click', resetEditAssignmentsModal);
  elements.btnSaveEditModal.addEventListener('click', saveEditAssignmentsModal);
  elements.modalEditAssignments.addEventListener('click', (e) => {
    if (e.target === elements.modalEditAssignments) {
      closeEditAssignmentsModal();
    }
  });

  elements.btnReshuffle.addEventListener('click', () => {
    generateAssignments();
    showToast(t('success') || '成功', '✓');
  });
  elements.btnToStep3.addEventListener('click', () => goToStep(3));

  // Step 3: 开始日期
  elements.startDateInput.addEventListener('change', handleStartDateChange);
  elements.btnToStep4.addEventListener('click', () => goToStep(4));

  // Step 4: 月历选择器交互
  elements.calendarQuickDateInput.addEventListener('change', updateQuickDateState);
  elements.calendarQuickDateButton.addEventListener('click', () => {
    if (typeof elements.calendarQuickDateInput.showPicker === 'function') {
      elements.calendarQuickDateInput.showPicker();
    } else {
      elements.calendarQuickDateInput.click();
    }
  });

  elements.btnPrevMonth.addEventListener('click', () => {
    state.calViewMonth--;
    if (state.calViewMonth < 0) {
      state.calViewMonth = 11;
      state.calViewYear--;
    }
    renderStep4Calendar();
  });

  elements.btnNextMonth.addEventListener('click', () => {
    state.calViewMonth++;
    if (state.calViewMonth > 11) {
      state.calViewMonth = 0;
      state.calViewYear++;
    }
    renderStep4Calendar();
  });

  elements.btnJumpStartMonth.addEventListener('click', () => {
    const startD = parseDate(state.startDateStr || getTodayDateStr());
    state.calViewYear = startD.getFullYear();
    state.calViewMonth = startD.getMonth();
    renderStep4Calendar();
  });

  elements.btnJumpEndMonth.addEventListener('click', () => {
    const totalDays = state.scheduleAssignments.totalDays;
    const { workdays } = computeScheduleDates(state.startDateStr, totalDays, state.excludedHolidays, state.manualWorkdays);
    if (workdays.length > 0) {
      const endD = workdays[workdays.length - 1].date;
      state.calViewYear = endD.getFullYear();
      state.calViewMonth = endD.getMonth();
      renderStep4Calendar();
    }
  });

  elements.btnCalClearAll.addEventListener('click', () => {
    state.excludedHolidays.clear();
    state.manualWorkdays.clear();
    renderStep4Calendar();
    showToast(t('successReset') || '成功重置');
  });

  elements.btnQuickSetHoliday.addEventListener('click', handleQuickSetHoliday);
  elements.btnQuickSetWorkday.addEventListener('click', handleQuickSetWorkday);
  elements.btnQuickResetDate.addEventListener('click', handleQuickResetDate);

  elements.btnToStep5.addEventListener('click', () => goToStep(5));

  // Step 5: 搜索、切换视图与导出
  elements.tableSearchInput.addEventListener('input', (e) => {
    renderFilterableTable(e.target.value);
  });

  elements.btnClearTableSearch.addEventListener('click', () => {
    elements.tableSearchInput.value = '';
    renderFilterableTable('');
  });

  elements.btnDownloadHtml.addEventListener('click', downloadHtmlFile);
  elements.btnDownloadCsv.addEventListener('click', downloadCsvFile);
  elements.btnCopyMarkdown.addEventListener('click', copyMarkdownToClipboard);

  // 视图切换：卡片 / 表格 / 文本
  elements.btnSubviewCards.addEventListener('click', () => setScheduleView('cards'));
  elements.btnSubviewTable.addEventListener('click', () => setScheduleView('table'));
  elements.btnSubviewText.addEventListener('click', () => setScheduleView('text'));

  elements.btnRestart.addEventListener('click', () => {
    if (confirm(t('confirmRestart') || '确定要重新开始排班吗？当前所有配置将被重置。')) {
      state.excludedHolidays.clear();
      state.manualWorkdays.clear();
      state.scheduleAssignments = null;
      goToStep(1);
    }
  });

  // ----------------------------------------------------
  //  顺延自旧排班表流程
  // ----------------------------------------------------
  elements.btnEditImportFile.addEventListener('click', () => elements.editImportFileInput.click());
  elements.editImportFileInput.addEventListener('change', handleEditImportFile);
  elements.btnEditTo2.addEventListener('click', handleEditToStep2);
  elements.btnEditTo3.addEventListener('click', () => goToEditStep(3));
  elements.editExecutedThroughInput.addEventListener('change', handleEditExecutedThroughChange);
  elements.editNewStartDateInput.addEventListener('change', handleEditNewStartDateChange);

  elements.btnEditPrevMonth.addEventListener('click', () => {
    state.calViewMonth--;
    if (state.calViewMonth < 0) {
      state.calViewMonth = 11;
      state.calViewYear--;
    }
    renderEditCalendar();
  });

  elements.btnEditNextMonth.addEventListener('click', () => {
    state.calViewMonth++;
    if (state.calViewMonth > 11) {
      state.calViewMonth = 0;
      state.calViewYear++;
    }
    renderEditCalendar();
  });

  elements.btnEditJumpStartMonth.addEventListener('click', () => {
    const startD = parseDate(state.editOld.newStartDate || getTodayDateStr());
    state.calViewYear = startD.getFullYear();
    state.calViewMonth = startD.getMonth();
    renderEditCalendar();
  });

  // 跳至结束月：定位到最后一班所在月份
  elements.btnEditJumpEndMonth.addEventListener('click', () => {
    const edit = state.editOld;
    if (edit.remainingItems.length === 0) return;
    const { workdays } = computeScheduleDates(
      edit.newStartDate || getTodayDateStr(),
      edit.remainingItems.length,
      state.excludedHolidays,
      state.manualWorkdays
    );
    if (workdays.length > 0) {
      const endD = parseDate(workdays[workdays.length - 1].dateStr);
      state.calViewYear = endD.getFullYear();
      state.calViewMonth = endD.getMonth();
      renderEditCalendar();
    }
  });

  elements.btnEditCalClearAll.addEventListener('click', () => {
    state.excludedHolidays.clear();
    state.manualWorkdays.clear();
    renderEditCalendar();
    showToast(t('successReset') || '成功重置');
  });

  elements.btnEditGenerate.addEventListener('click', () => goToEditStep(4));

  // 第 4 步：搜索、切换视图与导出（复用按模式取值接口）
  elements.editTableSearchInput.addEventListener('input', (e) => {
    renderFilterableTable(e.target.value);
  });

  elements.btnEditClearTableSearch.addEventListener('click', () => {
    elements.editTableSearchInput.value = '';
    renderFilterableTable('');
  });

  elements.btnEditDownloadHtml.addEventListener('click', downloadHtmlFile);
  elements.btnEditDownloadCsv.addEventListener('click', downloadCsvFile);
  elements.btnEditCopyMarkdown.addEventListener('click', copyMarkdownToClipboard);

  elements.btnEditSubviewCards.addEventListener('click', () => setScheduleView('cards'));
  elements.btnEditSubviewTable.addEventListener('click', () => setScheduleView('table'));
  elements.btnEditSubviewText.addEventListener('click', () => setScheduleView('text'));

  elements.btnEditRestart.addEventListener('click', () => {
    if (confirm(t('confirmRestartEdit') || '确定要重新开始修改旧排班表吗？当前导入内容与设置将被重置。')) {
      resetEditOldFlow();
    }
  });
}

// 页面加载启动
document.addEventListener('DOMContentLoaded', () => {
  // 英文模式：先替换静态 HTML 文案再初始化
  applyStaticI18n();
  setupEventListeners();
  loadSiteFooter();

  document.addEventListener('click', (event) => {
    if (!elements.activeStepMenuAnchor) return;
    if (event.target.closest('.step-title-button')) return;
    // 点击弹窗内容（列表）不关闭；点击遮罩或页面其他区域关闭
    if (event.target.closest('.step-menu-list')) return;
    closeStepMenu(elements.activeStepMenuAnchor);
  });

  window.addEventListener('resize', () => {
    if (elements.activeStepMenuAnchor) closeStepMenu(elements.activeStepMenuAnchor);
  });

  window.addEventListener('scroll', (event) => {
    if (!elements.activeStepMenuAnchor) return;
    // 菜单列表自身的滚动不关闭弹窗
    if (event.target.closest && event.target.closest('.step-menu')) return;
    closeStepMenu(elements.activeStepMenuAnchor);
  });

  // 默认预载入示例名单
  elements.namesInput.value = getSampleNamesText();
  elements.dailyCountInput.value = 4;
  handleStep1Inputs();

  // 默认预置今天为开始日期
  const todayStr = getTodayDateStr();
  state.startDateStr = todayStr;
  elements.startDateInput.value = todayStr;
  handleStartDateChange();

  // 每次进入网站默认从第 0 步（主页）开始；若网址带有合法参数则直接跳转对应步骤
  // ?editStep=1~4 为 顺延自旧排班表流程（导入数据不跨刷新保留，守卫会回落到第 1 步）
  // ?step=1~5 为新建排班流程
  const urlParams = new URLSearchParams(location.search);
  const urlEditStep = parseInt(urlParams.get('editStep'), 10);
  if (Number.isInteger(urlEditStep) && urlEditStep >= 1 && urlEditStep <= 4) {
    goToEditStep(urlEditStep);
  } else {
    const urlStep = parseInt(urlParams.get('step'), 10);
    if (Number.isInteger(urlStep) && urlStep >= 1 && urlStep <= 5) {
      goToStep(urlStep);
    }
  }
});
