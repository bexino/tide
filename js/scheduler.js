/**
 * 在线排班应用 - 核心算法模块
 */

// 计算最大公约数 (Greatest Common Divisor)
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// 计算最小公倍数 (Least Common Multiple)
function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * 解析输入的人员名单字符串
 * 兼容中英文逗号、换行、制表符与空格，去除首尾空白并过滤空项
 * 名字内部的空格统一替换为中心点 “·”（如 "Lando Norris" → "Lando·Norris"），中英文均适用
 * @param {string} rawText
 * @returns {string[]} 解析出的人员名单
 */
function parseNames(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  return rawText
    .split(/[,，\r\n\t]+/)
    .map(name => name.trim().replace(/\s+/g, '·'))
    .filter(name => name.length > 0);
}

/**
 * 计算实现“无余数、每个人排班次数严格相等”所需的最小周期参数
 * @param {number} N 总人数
 * @param {number} K 每日值班人数
 * @returns {{ totalDays: number, shiftsPerPerson: number, totalShifts: number, g: number }}
 */
function calculateCycle(N, K) {
  if (N <= 0 || K <= 0) {
    return { totalDays: 0, shiftsPerPerson: 0, totalShifts: 0, g: 0 };
  }
  const g = gcd(N, K);
  const totalLcm = (N * K) / g;
  const totalDays = totalLcm / K;          // 即 N / g
  const shiftsPerPerson = totalLcm / N;    // 即 K / g
  return {
    totalDays,
    shiftsPerPerson,
    totalShifts: totalLcm,
    g
  };
}

/**
 * Fisher-Yates 永远随机打乱算法
 * @param {Array} array 
 * @returns {Array} 打乱后的新数组（不修改原数组）
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 生成排班序列（人员分组）
 * 1. 将人员名单永远随机打乱
 * 2. 严格按最小无余数整周期生成（shiftsPerPerson 轮完整名单）
 * 3. 循环轮替切分成每日 K 个人，保证无余数且每人排班次数完全一致
 * @param {string[]} names 人员名单
 * @param {number} dailyCount 每日人数
 * @returns {{ shuffledNames: string[], dailyAssignments: string[][], totalDays: number, shiftsPerPerson: number, totalShifts: number }}
 */
function generateScheduleAssignments(names, dailyCount) {
  const N = names.length;
  const K = dailyCount;
  if (N < K || K <= 0) {
    throw new Error(isEnglish() ? 'People per shift cannot exceed the total number of people, and must be greater than 0' : '每日值班人数不能超过总人数，且必须大于0');
  }

  const { totalDays, shiftsPerPerson, totalShifts } = calculateCycle(N, K);

  // 1. 永远随机打乱
  const shuffled = shuffleArray(names);

  // 2. 拼接 shiftsPerPerson 轮完整名单
  const fullSequence = [];
  for (let round = 0; round < shiftsPerPerson; round++) {
    fullSequence.push(...shuffled);
  }

  // 3. 切分成每日 K 个人
  const dailyAssignments = [];
  for (let i = 0; i < totalDays; i++) {
    const dayGroup = fullSequence.slice(i * K, (i + 1) * K);
    dailyAssignments.push(dayGroup);
  }

  return {
    shuffledNames: shuffled,
    dailyAssignments,
    totalDays,
    shiftsPerPerson,
    totalShifts
  };
}

/**
 * 星期名称映射：按界面语言（window.APP_LANG）取中文全称或英文缩写
 */
const WEEKDAY_NAMES_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAY_NAMES_EN = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];

// 英文星期别名（小写、无点），供导入解析与搜索匹配使用
const WEEKDAY_EN_TOKENS = ['sun', 'mon', 'tue', 'tues', 'wed', 'thu', 'thur', 'thurs', 'fri', 'sat'];
const WEEKDAY_EN_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// 是否为英文界面模式（scheduler.js 先于 app.js 加载，运行时读取全局语言标记）
function isEnglish() {
  return typeof window !== 'undefined' && window.APP_LANG === 'en';
}

// 按当前界面语言取星期名称
function weekdayName(dayOfWeek) {
  return (isEnglish() ? WEEKDAY_NAMES_EN : WEEKDAY_NAMES_ZH)[dayOfWeek];
}

// 将星期写法（中文全称/周X/英文缩写或全称，忽略大小写与末尾句点）解析为星期索引，无法识别返回 null
function matchWeekdayToken(token) {
  const t = String(token || '').trim().replace(/\.+$/, '').toLowerCase();
  if (!t) return null;
  const zhIdx = WEEKDAY_NAMES_ZH.findIndex(z => z === t);
  if (zhIdx >= 0) return zhIdx;
  if (t === '周天') return 0;
  const enIdx = WEEKDAY_EN_TOKENS.indexOf(t);
  if (enIdx >= 0) return [0, 1, 2, 2, 3, 4, 4, 4, 5, 6][enIdx];
  return WEEKDAY_EN_FULL.indexOf(t) >= 0 ? WEEKDAY_EN_FULL.indexOf(t) : null;
}

/**
 * 格式化 Date 为 YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 解析 YYYY-MM-DD 字符串为本地 Date
 * @param {string} str 
 * @returns {Date}
 */
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 计算实际排班日期序列（自动跳过周末及指定节假日，同时支持手动加入排班日/周末调休补班）
 * @param {string} startDateStr 起始日期 (YYYY-MM-DD)
 * @param {number} totalDays 所需排班工作日总天数（由最小公倍数严格确定）
 * @param {Set<string>|Array<string>} excludedDates 排除的节假日集合 (YYYY-MM-DD)
 * @param {Set<string>|Array<string>} manualWorkdays 手动加入的排班日集合 (YYYY-MM-DD，例如周末调休补班)
 * @returns {{ workdays: Array<{ dateStr: string, weekday: string, date: Date, isManualWorkday: boolean }>, scannedDays: Array<{ dateStr: string, weekday: string, isWeekend: boolean, isExcluded: boolean, isManualWorkday: boolean, isWorkday: boolean }>, datesMap: Map<string, object> }}
 */
function computeScheduleDates(startDateStr, totalDays, excludedDates = new Set(), manualWorkdays = new Set()) {
  const excludedSet = excludedDates instanceof Set ? excludedDates : new Set(excludedDates);
  const manualSet = manualWorkdays instanceof Set ? manualWorkdays : new Set(manualWorkdays);
  const workdays = [];
  const scannedDays = [];
  const datesMap = new Map();

  const curDate = parseDate(startDateStr);

  // 安全上限：避免死循环
  const maxIterations = Math.max(totalDays * 10 + 365, 3650);
  let iterations = 0;

  while (workdays.length < totalDays && iterations < maxIterations) {
    iterations++;
    const dateStr = formatDate(curDate);
    const dayOfWeek = curDate.getDay(); // 0 是周日, 6 是周六
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isExcluded = excludedSet.has(dateStr);
    const isManualWorkday = manualSet.has(dateStr);

    let isWorkday = false;
    if (isExcluded) {
      isWorkday = false;
    } else if (isManualWorkday) {
      isWorkday = true;
    } else {
      isWorkday = !isWeekend;
    }

    const weekday = weekdayName(dayOfWeek);
    const dayInfo = {
      dateStr,
      weekday,
      isWeekend,
      isExcluded,
      isManualWorkday,
      isWorkday,
      workdayIndex: isWorkday ? workdays.length + 1 : null
    };

    scannedDays.push(dayInfo);
    datesMap.set(dateStr, dayInfo);

    if (isWorkday) {
      workdays.push({
        dateStr,
        weekday,
        date: new Date(curDate),
        isManualWorkday
      });
    }

    curDate.setDate(curDate.getDate() + 1);
  }

  return {
    workdays,
    scannedDays,
    datesMap
  };
}

/**
 * 输出符合格式要求的 Markdown 文本
 * 格式：
 * ## yyyy-MM-dd，周几
 * 人员1，人员2，人员3，人员4
 * 
 * 全角逗号。
 * @param {Array<{ dateStr: string, weekday: string, names: string[] }>} scheduleItems 
 * @returns {string}
 */
// 按界面语言取人名连接符：中文全角逗号 / 英文半角逗号加空格
function namesSeparator() {
  return isEnglish() ? ', ' : '，';
}

function formatToMarkdown(scheduleItems) {
  const sep = namesSeparator();
  return scheduleItems.map(item => {
    const header = isEnglish() ? `## ${item.dateStr}, ${item.weekday}` : `## ${item.dateStr}，${item.weekday}`;
    const namesLine = item.names.join(sep);
    return `${header}\n${namesLine}`;
  }).join('\n\n');
}

/**
 * 输出符合 Excel / 表格软件规范的 CSV 文本
 * 包含序号、日期、星期、排班名单及各人员拆分列
 * @param {Array<{ dateStr: string, weekday: string, names: string[] }>} scheduleItems 
 * @returns {string}
 */
function formatToCsv(scheduleItems) {
  if (!scheduleItems || scheduleItems.length === 0) return '';

  const maxNames = scheduleItems.reduce((m, item) => Math.max(m, (item.names || []).length), 0);
  const headers = isEnglish() ? ['No.', 'Date', 'Weekday', 'Names'] : ['序号', '日期', '星期', '排班名单'];
  if (maxNames > 1) {
    for (let i = 1; i <= maxNames; i++) {
      headers.push(isEnglish() ? `Person ${i}` : `人员${i}`);
    }
  }

  const rows = scheduleItems.map((item, index) => {
    const seq = index + 1;
    const date = item.dateStr;
    const weekday = item.weekday;
    const names = item.names || [];
    const namesStr = names.join(namesSeparator());
    const safeNames = `"${namesStr.replace(/"/g, '""')}"`;
    const row = [seq, date, weekday, safeNames];

    if (maxNames > 1) {
      for (let i = 0; i < maxNames; i++) {
        const n = names[i] || '';
        row.push(`"${n.replace(/"/g, '""')}"`);
      }
    }
    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * 将轮换分配数组输出为第 2 步专用的 Markdown 格式
 * 格式：
 * ## 第 1 天
 * 人员1，人员2，人员3，人员4
 * @param {string[][]} dailyAssignments 
 * @returns {string}
 */
function formatAssignmentsToMarkdown(dailyAssignments) {
  if (!dailyAssignments || !Array.isArray(dailyAssignments)) return '';
  return dailyAssignments.map((dayGroup, index) => {
    const dayHeader = isEnglish() ? `## Day ${index + 1}` : `## 第 ${index + 1} 天`;
    const namesLine = dayGroup.join(namesSeparator());
    return `${dayHeader}\n${namesLine}`;
  }).join('\n\n');
}

/**
 * 解析并严格校验第 2 步修改后的 Markdown 文本
 * 校验规则：
 * 1. 严格天数：解析出的天数必须完全等于 expectedDays（不可增删天数）
 * 2. 每日人数：每天人数必须完全等于 expectedDailyCount
 * 3. 无未知人员：名单必须全部属于 originalNames
 * 4. 严格均等轮替：每人出现的次数必须完全等于 expectedShiftsPerPerson
 * 
 * @param {string} markdownText 
 * @param {number} expectedDays 
 * @param {number} expectedDailyCount 
 * @param {string[]} originalNames 
 * @param {number} expectedShiftsPerPerson 
 * @returns {{ isValid: boolean, errors: string[], dailyAssignments: string[][] }}
 */
function parseAndValidateAssignmentsMarkdown(markdownText, expectedDays, expectedDailyCount, originalNames, expectedShiftsPerPerson) {
  const errors = [];
  if (!markdownText || typeof markdownText !== 'string' || !markdownText.trim()) {
    return { isValid: false, errors: [isEnglish() ? 'Content cannot be empty. Please enter valid rotation Markdown text' : '内容不能为空，请输入有效的轮换 Markdown 文本'], dailyAssignments: [] };
  }

  const rawLines = markdownText.split(/\r?\n/);
  const daysBlocks = [];
  let currentHeader = null;
  let currentLines = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    // 兼容中文 "## 第 X 天" 与英文 "## Day X" 两种标题格式
    const headerMatch = trimmed.match(/^##\s*(?:第|day)?\s*(\d+)\s*天?/i);
    if (headerMatch) {
      if (currentHeader !== null) {
        daysBlocks.push({ header: currentHeader, lines: currentLines });
      }
      currentHeader = headerMatch[1];
      currentLines = [];
    } else if (currentHeader !== null && trimmed.length > 0) {
      currentLines.push(trimmed);
    }
  }

  if (currentHeader !== null) {
    daysBlocks.push({ header: currentHeader, lines: currentLines });
  }

  if (daysBlocks.length === 0) {
    return {
      isValid: false,
      errors: [isEnglish()
        ? 'No valid day sections found. Make sure each section starts with "## Day X"'
        : '未能解析到任何有效天数段落。请确保每段以 "## 第 X 天" 开头'],
      dailyAssignments: []
    };
  }

  // 校验 1：天数严格一致（检测掉天数修改直接报错）
  if (daysBlocks.length !== expectedDays) {
    errors.push(isEnglish()
      ? `Day count mismatch: the cycle must be exactly ${expectedDays} days, but ${daysBlocks.length} were found`
      : `天数不匹配：设定周期必须为 ${expectedDays} 天整，当前解析到 ${daysBlocks.length} 天`);
  }

  const parsedAssignments = [];
  const personCountMap = new Map();
  const originalNameSet = new Set(originalNames);

  // 初始化计数器
  originalNames.forEach(name => personCountMap.set(name, 0));

  daysBlocks.forEach((block, idx) => {
    const dayIndex = idx + 1;
    const allNamesText = block.lines.join(' ');
    // 拆分人名（兼容中英文逗号、顿号、制表符、多重空格）
    const dayNames = allNamesText
      .split(/[,，、\s\t]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    // 校验 2：每日人数严格一致
    if (dayNames.length !== expectedDailyCount) {
      errors.push(isEnglish()
        ? `Day ${dayIndex} has an incorrect number of people: expected ${expectedDailyCount}, but found ${dayNames.length} (${dayNames.join(', ') || 'empty'})`
        : `第 ${dayIndex} 天人员数量不正确：要求为 ${expectedDailyCount} 人，实际解析到 ${dayNames.length} 人 (${dayNames.join('、') || '空'})`);
    }

    // 检查单日是否出现同名重复
    const daySet = new Set();
    const duplicates = [];
    dayNames.forEach(name => {
      if (daySet.has(name)) {
        duplicates.push(name);
      }
      daySet.add(name);
    });
    if (duplicates.length > 0) {
      errors.push(isEnglish()
        ? `Day ${dayIndex} contains duplicate people: ${duplicates.join(', ')}`
        : `第 ${dayIndex} 天存在重复排班人员：${duplicates.join('、')}`);
    }

    // 校验 3：检查是否引入了名单外人员
    const unknownNames = dayNames.filter(name => !originalNameSet.has(name));
    if (unknownNames.length > 0) {
      errors.push(isEnglish()
        ? `Day ${dayIndex} contains unknown or unregistered people: ${unknownNames.join(', ')}`
        : `第 ${dayIndex} 天包含未知或未登记人员：${unknownNames.join('、')}`);
    }

    // 统计各人员轮值频次
    dayNames.forEach(name => {
      if (personCountMap.has(name)) {
        personCountMap.set(name, personCountMap.get(name) + 1);
      }
    });

    parsedAssignments.push(dayNames);
  });

  // 校验 4：每人轮值次数严格均等
  const shiftMismatches = [];
  personCountMap.forEach((count, name) => {
    if (count !== expectedShiftsPerPerson) {
      shiftMismatches.push(isEnglish()
        ? `${name} (found ${count}, expected ${expectedShiftsPerPerson})`
        : `${name}（实际 ${count} 次，应为 ${expectedShiftsPerPerson} 次）`);
    }
  });

  if (shiftMismatches.length > 0) {
    errors.push(isEnglish()
      ? `Shifts are not evenly distributed: ${shiftMismatches.slice(0, 8).join(', ')}${shiftMismatches.length > 8 ? `, and ${shiftMismatches.length - 8} more` : ''}`
      : `人员轮值次数不均等：${shiftMismatches.slice(0, 8).join('、')}${shiftMismatches.length > 8 ? ` 等共 ${shiftMismatches.length} 人` : ''}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    dailyAssignments: parsedAssignments
  };
}

// ----------------------------------------------------
//  顺延自旧排班表：导入解析器（CSV / Markdown）
// 解析器不抛异常，统一返回 { items, errors, warnings }
// ----------------------------------------------------

// 规范化日期字符串为 YYYY-MM-DD，兼容 YYYY-M-D 与 YYYY/M/D；无法解析返回 null
function normalizeRosterDate(raw) {
  const match = String(raw || '').trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return formatDate(date);
}

// 校验星期与日期是否一致（以日期为准），不一致返回警告文案（同时接受中英文星期写法）
function checkWeekdayMismatch(dateStr, weekday) {
  if (!weekday) return null;
  const declaredIdx = matchWeekdayToken(weekday);
  const actualIdx = parseDate(dateStr).getDay();
  // 无法识别的写法不做一致性校验，直接按日期为准
  if (declaredIdx === null || declaredIdx === actualIdx) return null;
  const actual = weekdayName(actualIdx);
  return isEnglish()
    ? `Date ${dateStr} is actually ${actual}, but the table says ${weekday} (using the date as the source of truth)`
    : `日期 ${dateStr} 实际为 ${actual}，但表中标注为 ${weekday}（已按日期为准）`;
}

/**
 * 解析旧排班表 CSV 文本（本应用导出格式或列序可变的近似格式）
 * @param {string} text
 * @returns {{ items: Array<{dateStr: string, weekday: string, names: string[]}>, errors: string[], warnings: string[] }}
 */
function parseOldRosterCsv(text) {
  const items = [];
  const errors = [];
  const warnings = [];
  if (!text || typeof text !== 'string' || !text.trim()) {
    errors.push(isEnglish() ? 'Content is empty. Please import or paste an old roster first' : '内容为空，请先导入或粘贴旧排班表');
    return { items, errors, warnings };
  }

  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  // 识别表头行（包含“日期”或英文 "Date"）并定位各列（中英文表头均可）
  let headerIndex = -1;
  let colDate = -1, colWeekday = -1, colNames = -1, colPersonStart = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    const hasDate = lines[i].includes('日期') || /\bdate\b/i.test(lower);
    if (hasDate) {
      const cols = lines[i].split(',').map(c => c.trim());
      colDate = cols.findIndex(c => c.includes('日期') || /^"?date"?$/i.test(c));
      colWeekday = cols.findIndex(c => c.includes('星期') || /^"?weekday"?( of week)?$/i.test(c) || /^"?day of week"?$/i.test(c));
      colNames = cols.findIndex(c => c.includes('排班名单') || /^"?names"?( roster| list)?$/i.test(c));
      colPersonStart = cols.findIndex(c => /^人员/.test(c) || /^"?person \d+"?$/i.test(c));
      if (colDate >= 0) {
        headerIndex = i;
        break;
      }
    }
  }

  const dataLines = headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines;

  dataLines.forEach((line, rowIdx) => {
    const cols = line.split(',').map(c => c.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim());
    const rowNo = headerIndex >= 0 ? rowIdx + 2 : rowIdx + 1;

    let dateStr = null;
    let weekday = '';
    let namesText = '';

    if (headerIndex >= 0 && colDate >= 0) {
      dateStr = normalizeRosterDate(cols[colDate]);
      weekday = colWeekday >= 0 ? cols[colWeekday] : '';
      if (colNames >= 0) {
        namesText = cols[colNames];
      } else if (colPersonStart >= 0) {
        namesText = cols.slice(colPersonStart).join('，');
      } else {
        // 无名单列时回退：取除日期/星期外的所有列
        namesText = cols.filter((c, i) => i !== colDate && i !== colWeekday).join('，');
      }
    } else {
      // 无表头：按内容推断列
      const dateIdx = cols.findIndex(c => /^\d{4}[-/]/.test(c));
      if (dateIdx >= 0) {
        dateStr = normalizeRosterDate(cols[dateIdx]);
        // 星期列：中文全称或英文缩写均可
        const weekIdx = cols.findIndex(c => /^周[一二三四五六日天]$/.test(c) || matchWeekdayToken(c) !== null);
        weekday = weekIdx >= 0 ? cols[weekIdx] : '';
        namesText = cols.filter((c, i) => i !== dateIdx && i !== weekIdx).join('，');
      }
    }

    if (!dateStr) {
      errors.push(isEnglish()
        ? `Row ${rowNo}: unrecognized date (${line.slice(0, 40)}), skipped`
        : `第 ${rowNo} 行无法识别日期（${line.slice(0, 40)}），已跳过`);
      return;
    }

    // 星期清洗：截取开头的中文全称或英文缩写写法
    const weekdayClean = (weekday.match(/^周[一二三四五六日天]/) || [''])[0]
      || String(weekday || '').trim().match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)(?:\.|day|sday|nesday|rsday|urday)?\.?/i)?.[0]
      || '';
    const mismatch = checkWeekdayMismatch(dateStr, weekdayClean);
    if (mismatch) warnings.push(mismatch);

    const names = parseNames(namesText);
    if (names.length === 0) {
      errors.push(isEnglish()
        ? `Row ${rowNo} (${dateStr}): no duty people found, skipped`
        : `第 ${rowNo} 行（${dateStr}）未解析到值班人员，已跳过`);
      return;
    }

    items.push({ dateStr, weekday: weekdayName(parseDate(dateStr).getDay()), names });
  });

  if (items.length === 0 && errors.length === 0) {
    errors.push(isEnglish() ? 'No valid roster records found. Please check the CSV format' : '未能解析到任何有效排班记录，请检查 CSV 格式');
  }
  return { items, errors, warnings };
}

/**
 * 解析旧排班表 Markdown 文本，格式：
 * ## 2026-09-01，周二
 * 张三，李四
 * 英文格式同样支持：## 2026-09-01, Tue.
 * @param {string} text
 * @returns {{ items: Array<{dateStr: string, weekday: string, names: string[]}>, errors: string[], warnings: string[] }}
 */
function parseOldRosterMarkdown(text) {
  const items = [];
  const errors = [];
  const warnings = [];
  if (!text || typeof text !== 'string' || !text.trim()) {
    errors.push(isEnglish() ? 'Content is empty. Please import or paste an old roster first' : '内容为空，请先导入或粘贴旧排班表');
    return { items, errors, warnings };
  }

  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  // 标题兼容中文星期（周X）与英文缩写/全称（Tue. / Tuesday）
  const headerRegex = /^##\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s*[，,]?\s*(周[一二三四五六日天]|(Sun|Mon|Tue|Wed|Thu|Fri|Sat)(?:\.|day|sday|nesday|rsday|urday)?)?\s*\.?\s*$/i;

  let currentDateStr = null;
  let currentNamesLines = [];

  const flushBlock = () => {
    if (!currentDateStr) return;
    const names = parseNames(currentNamesLines.join('，').replace(/[,，、\t]/g, '，'));
    if (names.length === 0) {
      errors.push(isEnglish()
        ? `Section ${currentDateStr}: no duty people found, skipped`
        : `${currentDateStr} 段未解析到值班人员，已跳过`);
    } else {
      items.push({ dateStr: currentDateStr, weekday: weekdayName(parseDate(currentDateStr).getDay()), names });
    }
    currentDateStr = null;
    currentNamesLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      flushBlock();
      const dateStr = normalizeRosterDate(headerMatch[1]);
      if (!dateStr) {
        errors.push(isEnglish() ? `Unrecognized date header: ${line}, skipped` : `无法识别日期标题：${line}，已跳过`);
        continue;
      }
      const mismatch = checkWeekdayMismatch(dateStr, headerMatch[2] || '');
      if (mismatch) warnings.push(mismatch);
      currentDateStr = dateStr;
    } else if (currentDateStr && line.length > 0) {
      currentNamesLines.push(line);
    }
  }
  flushBlock();

  if (items.length === 0 && errors.length === 0) {
    errors.push(isEnglish()
      ? 'No valid roster sections found. Make sure each section starts with "## 2026-09-01, Mon."'
      : '未能解析到任何有效排班段落。请确保每段以 “## 2026-09-01，周二” 开头');
  }
  return { items, errors, warnings };
}

/**
 * 自动检测格式并解析旧排班表（CSV 或 Markdown）
 * @param {string} text
 * @returns {{ format: string, items: Array<{dateStr: string, weekday: string, names: string[]}>, errors: string[], warnings: string[] }}
 */
function parseOldRoster(text) {
  const looksMarkdown = /^\s*##\s*\d{4}[-/]/m.test(text || '');
  // 格式嗅探：中文“日期”表头、英文 Date 表头或行首日期+逗号
  const looksCsv = /日期/.test((text || '').slice(0, 500))
    || /\bdate\b/i.test((text || '').slice(0, 500))
    || /^\s*\d{4}[-/]\d{1,2}[-/]\d{1,2}\s*,/m.test(text || '');

  if (looksMarkdown && !looksCsv) {
    return { format: 'markdown', ...parseOldRosterMarkdown(text) };
  }
  if (looksCsv && !looksMarkdown) {
    return { format: 'csv', ...parseOldRosterCsv(text) };
  }
  // 格式不明确：两种都尝试，取解析结果更好（错误更少）的一种
  const md = parseOldRosterMarkdown(text);
  const csv = parseOldRosterCsv(text);
  if (md.items.length === 0 && csv.items.length === 0) {
    return {
      format: 'unknown',
      items: [],
      errors: [isEnglish()
        ? 'Unrecognized content format: paste a Markdown roster or CSV file content'
        : '无法识别内容格式：请粘贴 Markdown 排班表或 CSV 文件内容'],
      warnings: []
    };
  }
  return md.items.length >= csv.items.length
    ? { format: 'markdown', ...md }
    : { format: 'csv', ...csv };
}

// 导出兼容浏览器与 Node.js 测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gcd,
    lcm,
    parseNames,
    calculateCycle,
    shuffleArray,
    generateScheduleAssignments,
    formatDate,
    parseDate,
    computeScheduleDates,
    formatToMarkdown,
    formatToCsv,
    formatAssignmentsToMarkdown,
    parseAndValidateAssignmentsMarkdown,
    parseOldRosterCsv,
    parseOldRosterMarkdown,
    parseOldRoster,
    WEEKDAY_NAMES_ZH,
    WEEKDAY_NAMES_EN,
    weekdayName,
    matchWeekdayToken
  };
}
