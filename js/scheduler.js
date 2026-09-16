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
 * 兼容中英文逗号、换行、制表符与空格，去除多余空白并过滤空项
 * @param {string} rawText 
 * @returns {string[]} 解析出的人员名单
 */
function parseNames(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  return rawText
    .split(/[,，\r\n\t]+/)
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * 计算实现“无余数、每个人排班次数严格相等”所需的最小周期参数
 * @param {number} N 总人数
 * @param {number} K 每日排班人数
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
    throw new Error('每日排班人数不能超过总人数，且必须大于0');
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
 * 中文星期名称映射
 */
const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

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

    const weekday = WEEKDAY_NAMES[dayOfWeek];
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
function formatToMarkdown(scheduleItems) {
  return scheduleItems.map(item => {
    const header = `## ${item.dateStr}，${item.weekday}`;
    const namesLine = item.names.join('，');
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
  const headers = ['序号', '日期', '星期', '排班名单'];
  if (maxNames > 1) {
    for (let i = 1; i <= maxNames; i++) {
      headers.push(`人员${i}`);
    }
  }

  const rows = scheduleItems.map((item, index) => {
    const seq = index + 1;
    const date = item.dateStr;
    const weekday = item.weekday;
    const names = item.names || [];
    const namesStr = names.join('，');
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
    const dayHeader = `## 第 ${index + 1} 天`;
    const namesLine = dayGroup.join('，');
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
    return { isValid: false, errors: ['内容不能为空，请输入有效的轮换 Markdown 文本'], dailyAssignments: [] };
  }

  const rawLines = markdownText.split(/\r?\n/);
  const daysBlocks = [];
  let currentHeader = null;
  let currentLines = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^##\s*第?\s*(\d+)\s*天?/i);
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
      errors: ['未能解析到任何有效天数段落。请确保每段以 "## 第 X 天" 开头'],
      dailyAssignments: []
    };
  }

  // 校验 1：天数严格一致（检测掉天数修改直接报错）
  if (daysBlocks.length !== expectedDays) {
    errors.push(`天数不匹配：设定周期必须为 ${expectedDays} 天整，当前解析到 ${daysBlocks.length} 天（系统已开启严格检测，不可增删天数）`);
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
      errors.push(`第 ${dayIndex} 天人员数量不正确：要求为 ${expectedDailyCount} 人，实际解析到 ${dayNames.length} 人 (${dayNames.join('、') || '空'})`);
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
      errors.push(`第 ${dayIndex} 天存在重复排班人员：${duplicates.join('、')}`);
    }

    // 校验 3：检查是否引入了名单外人员
    const unknownNames = dayNames.filter(name => !originalNameSet.has(name));
    if (unknownNames.length > 0) {
      errors.push(`第 ${dayIndex} 天包含未知或未登记人员：${unknownNames.join('、')}`);
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
      shiftMismatches.push(`${name}（实际 ${count} 次，应为 ${expectedShiftsPerPerson} 次）`);
    }
  });

  if (shiftMismatches.length > 0) {
    errors.push(`人员轮值次数不均等（破坏了无余数均衡）：${shiftMismatches.slice(0, 8).join('、')}${shiftMismatches.length > 8 ? ` 等共 ${shiftMismatches.length} 人` : ''}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    dailyAssignments: parsedAssignments
  };
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
    WEEKDAY_NAMES
  };
}
