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
    WEEKDAY_NAMES
  };
}
