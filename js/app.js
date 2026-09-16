/**
 * 在线排班系统 - 交互与状态控制模块
 */

// 预设 docs/1.md 示例人员名单 (49人)
const SAMPLE_NAMES_TEXT = `鲁皓宇, 钟祖辉, 饶清华, 王靖榕, 周锦熹, 徐文强, 熊寅轩, 罗平, 周朗, 胡佳豪, 陈浩轩, 卢鑫, 杨佳伟, 余浩宇, 王逸轩, 黄宇贤, 温耀辉, 万贻凯, 邱艳冬, 赖浈, 郭平辉, 彭宝康, 冷奥运, 吴世峰, 傅嘉豪, 董鑫华, 胡建辉, 谌洪力, 阮雨事, 李斌, 谭宝永, 黄榆宸, 李长禄, 钟锦辉, 陈嘉龙, 朱奥健, 潘启睿, 邹金炜, 曾晴, 冯唐华, 汪晨, 刘有佳, 舒佟, 胡恬恬, 张婷, 朱婷婷, 陈雯璇, 杨欣婷, 张梦莹`;

// 应用全局状态
const state = {
  currentStep: 1,
  names: [],
  dailyCount: 4,
  scheduleAssignments: null, // { shuffledNames, dailyAssignments, totalDays, shiftsPerPerson, totalShifts }
  startDateStr: '',
  excludedHolidays: new Set(), // 排除放假的日期 (YYYY-MM-DD)
  manualWorkdays: new Set(),   // 手动加入的排班日 (YYYY-MM-DD，如周末调休补班)
  finalScheduleItems: [],
  markdownText: '',

  // 月历选择器视图状态 (当前浏览的年月)
  calViewYear: 2026,
  calViewMonth: 8 // 0-11, 8 表示 9月
};

// DOM 元素引用
const elements = {
  // 步骤面板
  panels: [
    null,
    document.getElementById('panel-step-1'),
    document.getElementById('panel-step-2'),
    document.getElementById('panel-step-3'),
    document.getElementById('panel-step-4'),
    document.getElementById('panel-step-5')
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
  btnReshuffle: document.getElementById('btn-reshuffle'),
  btnToStep3: document.getElementById('btn-to-step-3'),

  // Step 3
  startDateInput: document.getElementById('start-date-input'),
  startDateWeekdayTag: document.getElementById('start-date-weekday-tag'),
  btnToStep4: document.getElementById('btn-to-step-4'),

  // Step 4 (月历选择器)
  calStatNeeded: document.getElementById('cal-stat-needed'),
  calStatActual: document.getElementById('cal-stat-actual'),
  calStatExcluded: document.getElementById('cal-stat-excluded'),
  calStatManual: document.getElementById('cal-stat-manual'),
  calStatRange: document.getElementById('cal-stat-range'),
  btnCalClearAll: document.getElementById('btn-cal-clear-all'),
  calendarQuickDateInput: document.getElementById('calendar-quick-date-input'),
  btnQuickSetHoliday: document.getElementById('btn-quick-set-holiday'),
  btnQuickSetWorkday: document.getElementById('btn-quick-set-workday'),
  excludedTagsContainer: document.getElementById('excluded-tags-container'),
  excludedTagsList: document.getElementById('excluded-tags-list'),
  calendarMonthTitle: document.getElementById('calendar-month-title'),
  btnPrevMonth: document.getElementById('btn-prev-month'),
  btnNextMonth: document.getElementById('btn-next-month'),
  btnJumpStartMonth: document.getElementById('btn-jump-start-month'),
  btnJumpEndMonth: document.getElementById('btn-jump-end-month'),
  calendarGrid: document.getElementById('calendar-grid'),
  btnToStep5: document.getElementById('btn-to-step-5'),

  // Step 5 (默认可视化表格视图，Markdown为第二视图)
  markdownOutput: document.getElementById('markdown-output'),
  finalTableBody: document.getElementById('final-table-body'),
  btnCopyMarkdown: document.getElementById('btn-copy-markdown'),
  btnDownloadMarkdown: document.getElementById('btn-download-markdown'),
  tabBtnMarkdown: document.getElementById('tab-btn-markdown'),
  tabBtnTable: document.getElementById('tab-btn-table'),
  viewMarkdownContainer: document.getElementById('view-markdown-container'),
  viewTableContainer: document.getElementById('view-table-container'),
  tableSearchInput: document.getElementById('table-search-input'),
  btnClearTableSearch: document.getElementById('btn-clear-table-search'),
  searchResultStats: document.getElementById('search-result-stats'),
  tableEmptySearch: document.getElementById('table-empty-search'),
  btnRestart: document.getElementById('btn-restart'),

  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon')
};

// 获取本地今日日期 YYYY-MM-DD
function getTodayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  elements.namesCountBadge.textContent = `已识别 ${count} 人`;

  const daily = parseInt(elements.dailyCountInput.value, 10) || 4;

  if (count > 0 && daily > 0) {
    const cycle = calculateCycle(count, daily);

    if (count >= daily) {
      elements.step1CycleHint.innerHTML = `
        需排班 <span class="text-indigo-600 font-bold text-sm">${cycle.totalDays}</span> 天整，
        每人值班 <span class="text-indigo-600 font-bold text-sm">${cycle.shiftsPerPerson}</span> 次，
        总计 <span class="text-indigo-600 font-bold text-sm">${cycle.totalShifts}</span> 班次，<b>严格无余数</b>。
      `;
      hideError(elements.step1Error);
    } else {
      elements.step1CycleHint.innerHTML = `<span class="text-amber-600 font-medium">⚠️ 总人数 (${count}人) 少于每日排班人数 (${daily}人)，请补充人员或调低每日人数。</span>`;
    }
  } else {
    elements.step1CycleHint.textContent = '输入人员名单后将自动计算最小无余数天数。';
  }
}

// 步骤向导跳转控制
function goToStep(targetStep) {
  if (targetStep < 1 || targetStep > 5) return;

  // 校验前往后续步骤的前提条件
  if (targetStep >= 2) {
    const rawNames = elements.namesInput.value;
    const parsed = parseNames(rawNames);
    const dailyCount = parseInt(elements.dailyCountInput.value, 10) || 4;

    if (parsed.length === 0) {
      showError(elements.step1Error, '请先输入至少一组人员姓名');
      return;
    }
    if (parsed.length < dailyCount) {
      showError(elements.step1Error, `总人数 (${parsed.length}人) 不能少于每日排班人数 (${dailyCount}人)`);
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
    // 确保可视化表格为默认活动标签
    switchToTableView();
  }

  // 更新步骤指示器
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    const text = document.getElementById(`step-text-${i}`);
    const line = document.getElementById(`step-line-${i}`);

    if (i < targetStep) {
      dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all bg-emerald-500 text-white shadow-md shadow-emerald-100';
      dot.innerHTML = '✓';
      text.className = 'text-xs sm:text-sm font-medium mt-2 text-emerald-600';
      if (line) line.className = 'step-line bg-emerald-500 -mt-5';
    } else if (i === targetStep) {
      dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50';
      dot.innerHTML = `${i}`;
      text.className = 'text-xs sm:text-sm font-bold mt-2 text-indigo-600';
      if (line) line.className = 'step-line bg-slate-200 -mt-5';
    } else {
      dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all bg-slate-200 text-slate-500';
      dot.innerHTML = `${i}`;
      text.className = 'text-xs sm:text-sm font-medium mt-2 text-slate-400';
      if (line) line.className = 'step-line bg-slate-200 -mt-5';
    }

    if (elements.panels[i]) {
      if (i === targetStep) {
        elements.panels[i].classList.remove('hidden');
      } else {
        elements.panels[i].classList.add('hidden');
      }
    }
  }

  state.currentStep = targetStep;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 步骤 2 生成严格无余数轮换方案
function generateAssignments() {
  try {
    state.scheduleAssignments = generateScheduleAssignments(state.names, state.dailyCount);
    renderStep2Preview();
  } catch (err) {
    showError(elements.step1Error, err.message);
  }
}

function renderStep2Preview() {
  const { totalDays, shiftsPerPerson, totalShifts, dailyAssignments } = state.scheduleAssignments;

  elements.statTotalPeople.textContent = `${state.names.length} 人`;
  elements.statDailyPeople.textContent = `${state.dailyCount} 人`;
  elements.statTotalDays.textContent = `${totalDays} 天整`;
  elements.statShiftsPerPerson.textContent = `${shiftsPerPerson} 次`;

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
          <span class="w-16 text-xs font-bold text-slate-400">第 ${idx + 1} 天</span>
          <div class="flex flex-wrap items-center">
            ${namesChips}
          </div>
        </div>
        <span class="text-xs text-slate-400 hidden sm:inline">${dayGroup.length}人</span>
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
    const daysBadges = days.map(d => `<span class="inline-block bg-indigo-50 text-indigo-700 font-mono text-[11px] px-2 py-0.5 rounded border border-indigo-100 mr-1 my-0.5">第 ${d} 天</span>`).join('');
    return `
      <div class="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div class="flex items-center space-x-3 flex-1">
          <span class="w-8 text-xs font-mono text-slate-400 text-right">${idx + 1}.</span>
          <span class="font-bold text-xs sm:text-sm text-slate-800 w-24">${name}</span>
          <div class="flex flex-wrap items-center flex-1">
            ${daysBadges}
          </div>
        </div>
        <span class="text-xs font-bold text-emerald-600 ml-2">严格 ${days.length} 次</span>
      </div>
    `;
  }).join('');
  elements.schedulePersonStatsList.innerHTML = peopleHtml;
}

// 步骤 3 起始日期变化监听
function handleStartDateChange() {
  const val = elements.startDateInput.value;
  if (!val) return;
  state.startDateStr = val;

  const date = parseDate(val);
  const dayOfWeek = date.getDay();
  const weekday = WEEKDAY_NAMES[dayOfWeek];

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    elements.startDateWeekdayTag.innerHTML = `
      <span class="text-amber-600 font-bold">该日为 ${weekday}（非工作日）</span>，排班将从最近的工作日或调休补班日开始。
    `;
  } else {
    elements.startDateWeekdayTag.innerHTML = `
      起始日为 <span class="text-indigo-600 font-semibold">${weekday}</span>（工作日）。
    `;
  }
}

// ----------------------------------------------------
// 步骤 4：月历选择器核心逻辑 (Calendar Picker)
// ----------------------------------------------------

function renderStep4Calendar() {
  const totalDays = state.scheduleAssignments.totalDays;

  // 计算排班日期与所有日历标记
  const { workdays, scannedDays, datesMap } = computeScheduleDates(
    state.startDateStr,
    totalDays,
    state.excludedHolidays,
    state.manualWorkdays
  );

  // 更新顶部指标
  elements.calStatNeeded.textContent = `${totalDays} 天整`;
  elements.calStatActual.textContent = `${workdays.length} 天`;
  elements.calStatExcluded.textContent = `${state.excludedHolidays.size} 天`;
  elements.calStatManual.textContent = `${state.manualWorkdays.size} 天`;

  if (workdays.length > 0) {
    const firstDay = workdays[0].dateStr;
    const lastDay = workdays[workdays.length - 1].dateStr;
    elements.calStatRange.textContent = `${firstDay} 至 ${lastDay}`;
  }

  // 渲染排除与补班标记标签栏
  renderExcludedAndManualTags();

  // 渲染月历头部标题
  const year = state.calViewYear;
  const month = state.calViewMonth; // 0-11
  elements.calendarMonthTitle.textContent = `${year} 年 ${String(month + 1).padStart(2, '0')} 月`;

  // 渲染月历网格
  renderMonthGrid(year, month, datesMap);
}

// 渲染月历格子 (7列 x 5~6行)
function renderMonthGrid(year, month, datesMap) {
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
    cellsHtml += buildCalendarCellHtml(dateStr, prevDayNum, true, datesMap);
  }

  // 2. 当月日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    const dateStr = formatDate(curDate);
    cellsHtml += buildCalendarCellHtml(dateStr, day, false, datesMap);
  }

  // 3. 下月留白填充格子（补齐到7的倍数）
  const totalRendered = startDayOfWeek + daysInMonth;
  const remainingCells = (7 - (totalRendered % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    const dateStr = formatDate(nextDate);
    cellsHtml += buildCalendarCellHtml(dateStr, day, true, datesMap);
  }

  elements.calendarGrid.innerHTML = cellsHtml;
}

// 构建单个日历格子的 HTML
function buildCalendarCellHtml(dateStr, dayNum, isOtherMonth, datesMap) {
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

  if (dayInfo && dayInfo.isWorkday) {
    if (isManual) {
      cellBgClass = 'bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100';
      badgeHtml = `<span class="text-[10px] font-bold text-emerald-800 bg-emerald-200/90 px-1.5 py-0.5 rounded shadow-2xs">补 #${dayInfo.workdayIndex}</span>`;
      textColor = 'text-emerald-950 font-bold';
    } else {
      cellBgClass = 'bg-blue-50/80 border-blue-200 hover:bg-rose-50 hover:border-rose-300';
      badgeHtml = `<span class="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-1.5 py-0.5 rounded shadow-2xs">第 ${dayInfo.workdayIndex} 天</span>`;
      textColor = 'text-indigo-950 font-semibold';
    }
  } else if (isExcluded) {
    cellBgClass = 'bg-rose-50 border-rose-200 hover:bg-blue-50 hover:border-blue-300';
    badgeHtml = `<span class="text-[10px] font-bold text-rose-700 bg-rose-200/90 px-1.5 py-0.5 rounded shadow-2xs">休·跳过</span>`;
    textColor = 'text-rose-800 line-through font-medium';
  } else if (isWeekend) {
    cellBgClass = isOtherMonth ? 'bg-slate-50/50' : 'bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300';
    badgeHtml = `<span class="text-[10px] text-slate-400 font-medium">休</span>`;
    textColor = isOtherMonth ? 'text-slate-300' : 'text-slate-400';
  } else {
    cellBgClass = isOtherMonth ? 'bg-slate-50/50' : 'bg-white hover:bg-indigo-50/30';
    badgeHtml = '';
    textColor = isOtherMonth ? 'text-slate-300' : 'text-slate-600';
  }

  let titleTooltip = `${dateStr} (${WEEKDAY_NAMES[dayOfWeek]})`;
  if (dayInfo && dayInfo.isWorkday) {
    titleTooltip += ` [排班第${dayInfo.workdayIndex}天] 点击设为放假`;
  } else if (isExcluded) {
    titleTooltip += ' [放假跳过] 点击恢复排班';
  } else if (isWeekend) {
    titleTooltip += ' [周末] 点击设为调休补班';
  }

  return `
    <div class="calendar-cell p-2 select-none cursor-pointer flex flex-col justify-between border ${borderClass} ${cellBgClass}"
         onclick="handleCalendarCellClick('${dateStr}')"
         title="${titleTooltip}">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold ${textColor}">${dayNum}</span>
        ${badgeHtml}
      </div>
      <div class="text-[10px] text-right text-slate-400 font-mono">
        ${dateStr.slice(5)}
      </div>
    </div>
  `;
}

// 日历单元格点击事件交互
function handleCalendarCellClick(dateStr) {
  const dateObj = parseDate(dateStr);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

  const isExcluded = state.excludedHolidays.has(dateStr);
  const isManual = state.manualWorkdays.has(dateStr);

  if (isExcluded) {
    state.excludedHolidays.delete(dateStr);
    showToast(`已恢复排班：${dateStr}`);
  } else if (isManual) {
    state.manualWorkdays.delete(dateStr);
    showToast(`已恢复周末休息：${dateStr}`);
  } else if (isWeekend) {
    state.manualWorkdays.add(dateStr);
    showToast(`已将 ${dateStr} 设为调休排班！`, '✅');
  } else {
    state.excludedHolidays.add(dateStr);
    showToast(`已将 ${dateStr} 设为跳过放假`, '🚫');
  }

  renderStep4Calendar();
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
    const wk = WEEKDAY_NAMES[d.getDay()];
    tagsHtml += `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono shadow-2xs">
        <span>🚫 ${dateStr} (${wk}) 休</span>
        <button type="button" onclick="removeHolidayTag('${dateStr}')" class="hover:text-rose-900 font-bold ml-1 text-sm leading-none" title="撤销放假">✕</button>
      </span>
    `;
  });

  const sortedManual = Array.from(state.manualWorkdays).sort();
  sortedManual.forEach(dateStr => {
    const d = parseDate(dateStr);
    const wk = WEEKDAY_NAMES[d.getDay()];
    tagsHtml += `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono shadow-2xs">
        <span>✅ ${dateStr} (${wk}) 补班</span>
        <button type="button" onclick="removeManualWorkdayTag('${dateStr}')" class="hover:text-emerald-900 font-bold ml-1 text-sm leading-none" title="撤销补班">✕</button>
      </span>
    `;
  });

  elements.excludedTagsList.innerHTML = tagsHtml;
}

function removeHolidayTag(dateStr) {
  state.excludedHolidays.delete(dateStr);
  showToast(`已恢复排班：${dateStr}`);
  renderStep4Calendar();
}

function removeManualWorkdayTag(dateStr) {
  state.manualWorkdays.delete(dateStr);
  showToast(`已撤销补班：${dateStr}`);
  renderStep4Calendar();
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
function switchToTableView() {
  elements.tabBtnTable.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition-all';
  elements.tabBtnMarkdown.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all';
  elements.viewTableContainer.classList.remove('hidden');
  elements.viewMarkdownContainer.classList.add('hidden');
}

function switchToMarkdownView() {
  elements.tabBtnMarkdown.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition-all';
  elements.tabBtnTable.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all';
  elements.viewMarkdownContainer.classList.remove('hidden');
  elements.viewTableContainer.classList.add('hidden');
}

// 渲染支持搜索过滤的可视化排班表格
function renderFilterableTable(query = '') {
  query = (query || '').trim().toLowerCase();

  const filteredItems = state.finalScheduleItems.filter(item => {
    if (!query) return true;
    if (item.dateStr.toLowerCase().includes(query)) return true;
    if (item.weekday.toLowerCase().includes(query)) return true;
    return item.names.some(name => name.toLowerCase().includes(query));
  });

  if (query) {
    elements.btnClearTableSearch.classList.remove('hidden');
    elements.searchResultStats.innerHTML = `共找到 <b class="text-indigo-600 font-bold">${filteredItems.length}</b> 天排班（匹配 “${query}”）`;
  } else {
    elements.btnClearTableSearch.classList.add('hidden');
    elements.searchResultStats.textContent = `共 ${state.finalScheduleItems.length} 天排班`;
  }

  if (filteredItems.length === 0) {
    elements.finalTableBody.innerHTML = '';
    elements.tableEmptySearch.classList.remove('hidden');
    return;
  }

  elements.tableEmptySearch.classList.add('hidden');

  const rowsHtml = filteredItems.map((item, idx) => {
    const dateDisplay = highlightMatch(item.dateStr, query);
    const weekdayDisplay = highlightMatch(item.weekday, query);

    const namesHtml = item.names.map(name => {
      const isMatch = query && name.toLowerCase().includes(query);
      const highlightedName = highlightMatch(name, query);
      return `<span class="inline-block cursor-pointer px-2 py-0.5 rounded-md text-xs font-medium mr-1.5 my-0.5 border ${isMatch ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700'}" onclick="setTableSearch('${name}')" title="点击筛选此人排班">${highlightedName}</span>`;
    }).join('，');

    const badge = item.isManualWorkday
      ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded ml-1.5">补</span>'
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

  elements.finalTableBody.innerHTML = rowsHtml;
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
  elements.tableSearchInput.value = keyword;
  renderFilterableTable(keyword);
}

// 复制 Markdown 到剪贴板
function copyMarkdownToClipboard() {
  if (!state.markdownText) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(state.markdownText).then(() => {
      showToast('排班表 Markdown 已成功复制到剪贴板！');
    }).catch(() => {
      fallbackCopyText(state.markdownText);
    });
  } else {
    fallbackCopyText(state.markdownText);
  }
}

function fallbackCopyText(text) {
  elements.markdownOutput.select();
  document.execCommand('copy');
  showToast('排班表 Markdown 已成功复制到剪贴板！');
}

// 下载 .md 文件
function downloadMarkdownFile() {
  if (!state.markdownText) return;
  const blob = new Blob([state.markdownText], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `排班表_${state.startDateStr || getTodayDateStr()}.md`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`文件 ${fileName} 开始下载`);
}

// 绑定各事件监听
function setupEventListeners() {
  // Step 1: 名单与人数输入
  elements.namesInput.addEventListener('input', handleStep1Inputs);
  elements.dailyCountInput.addEventListener('input', handleStep1Inputs);

  elements.btnLoadSample.addEventListener('click', () => {
    elements.namesInput.value = SAMPLE_NAMES_TEXT;
    handleStep1Inputs();
    showToast('已成功载入 1.md 的 49 人示例名单');
  });

  elements.btnClearNames.addEventListener('click', () => {
    elements.namesInput.value = '';
    handleStep1Inputs();
    showToast('已清空名单列表', 'ℹ');
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

  elements.btnReshuffle.addEventListener('click', () => {
    generateAssignments();
    showToast('已重新随机打乱人员顺序！', '🎲');
  });
  elements.btnToStep3.addEventListener('click', () => goToStep(3));

  // Step 3: 开始日期
  elements.startDateInput.addEventListener('change', handleStartDateChange);
  elements.btnToStep4.addEventListener('click', () => goToStep(4));

  // Step 4: 月历选择器交互
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
    showToast('已清空所有排除与补班标记');
  });

  elements.btnQuickSetHoliday.addEventListener('click', () => {
    const val = elements.calendarQuickDateInput.value;
    if (!val) {
      showToast('请先选择日期', '⚠️');
      return;
    }
    state.manualWorkdays.delete(val);
    state.excludedHolidays.add(val);
    renderStep4Calendar();
    showToast(`已将 ${val} 设为跳过放假`, '🚫');
    elements.calendarQuickDateInput.value = '';
  });

  elements.btnQuickSetWorkday.addEventListener('click', () => {
    const val = elements.calendarQuickDateInput.value;
    if (!val) {
      showToast('请先选择日期', '⚠️');
      return;
    }
    state.excludedHolidays.delete(val);
    state.manualWorkdays.add(val);
    renderStep4Calendar();
    showToast(`已将 ${val} 设为调休排班！`, '✅');
    elements.calendarQuickDateInput.value = '';
  });

  elements.btnToStep5.addEventListener('click', () => goToStep(5));

  // Step 5: 搜索、切换视图与导出
  elements.tableSearchInput.addEventListener('input', (e) => {
    renderFilterableTable(e.target.value);
  });

  elements.btnClearTableSearch.addEventListener('click', () => {
    elements.tableSearchInput.value = '';
    renderFilterableTable('');
  });

  elements.btnCopyMarkdown.addEventListener('click', copyMarkdownToClipboard);
  elements.btnDownloadMarkdown.addEventListener('click', downloadMarkdownFile);

  // 视图切换：可视化表格 vs Markdown
  elements.tabBtnTable.addEventListener('click', switchToTableView);
  elements.tabBtnMarkdown.addEventListener('click', switchToMarkdownView);

  elements.btnRestart.addEventListener('click', () => {
    if (confirm('确定要重新开始排班吗？当前所有配置将被重置。')) {
      state.excludedHolidays.clear();
      state.manualWorkdays.clear();
      state.scheduleAssignments = null;
      goToStep(1);
    }
  });
}

// 页面加载启动
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  // 默认预载入示例名单
  elements.namesInput.value = SAMPLE_NAMES_TEXT;
  elements.dailyCountInput.value = 4;
  handleStep1Inputs();

  // 默认预置今天为开始日期
  const todayStr = getTodayDateStr();
  state.startDateStr = todayStr;
  elements.startDateInput.value = todayStr;
  handleStartDateChange();
});
