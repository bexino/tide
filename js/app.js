/**
 * 在线排班系统 - 交互与状态控制模块
 */

// 预设 docs/1.md 示例人员名单 (49人)
const SAMPLE_NAMES_TEXT = `诺里斯, 皮亚斯特里, 拉塞尔, 安东内利, 勒克莱尔, 汉密尔顿, 维斯塔潘, 哈贾尔, 阿隆索, 斯特罗尔, 阿尔本, 塞恩斯, 比尔曼, 奥康, 加斯利, 科拉平托, 劳森, 林德布拉德, 霍肯伯格, 博托莱托, 佩雷斯, 博塔斯`;

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
  calViewMonth: 8, // 0-11, 8 表示 9月

  // 可视化排班表子视图（手机端默认卡片，电脑端默认表格）
  visualSubView: (typeof window !== 'undefined' && window.innerWidth < 640) ? 'cards' : 'table'
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
  calStatNeeded: document.getElementById('cal-stat-needed'),
  calStatActual: document.getElementById('cal-stat-actual'),
  calStatExcluded: document.getElementById('cal-stat-excluded'),
  calStatManual: document.getElementById('cal-stat-manual'),
  calStatRange: document.getElementById('cal-stat-range'),
  btnCalClearAll: document.getElementById('btn-cal-clear-All') || document.getElementById('btn-cal-clear-all'),
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
  finalCardsContainer: document.getElementById('final-cards-container'),
  finalTableScrollContainer: document.getElementById('final-table-scroll-container'),
  btnSubviewCards: document.getElementById('btn-subview-cards'),
  btnSubviewTable: document.getElementById('btn-subview-table'),
  btnDownloadHtml: document.getElementById('btn-download-html'),
  btnDownloadCsv: document.getElementById('btn-download-csv'),
  btnCopyMarkdown: document.getElementById('btn-copy-markdown'),
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
  showToast('已重置为当前方案文本');
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
    showToast('轮换方案校验未通过，请按提示修正', '⚠️');
    return;
  }

  // 校验完全通过：更新状态中的轮替方案
  state.scheduleAssignments.dailyAssignments = result.dailyAssignments;
  
  // 重新渲染第 2 步列表和统计检查
  renderStep2Preview();

  // 关闭弹窗并给予成功反馈
  closeEditAssignmentsModal();
  showToast('轮换方案修改成功，已通过严格无余数均衡校验！');
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
function setVisualSubView(viewMode) {
  state.visualSubView = viewMode;
  if (viewMode === 'cards') {
    elements.btnSubviewCards.className = 'px-2.5 py-1 rounded-md bg-white text-indigo-700 shadow-2xs font-bold';
    elements.btnSubviewTable.className = 'px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium';
    elements.finalCardsContainer.classList.remove('hidden');
    elements.finalTableScrollContainer.classList.add('hidden');
  } else {
    elements.btnSubviewTable.className = 'px-2.5 py-1 rounded-md bg-white text-indigo-700 shadow-2xs font-bold';
    elements.btnSubviewCards.className = 'px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium';
    elements.finalTableScrollContainer.classList.remove('hidden');
    elements.finalCardsContainer.classList.add('hidden');
  }
}

function switchToTableView() {
  elements.tabBtnTable.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition-all';
  elements.tabBtnMarkdown.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all';
  elements.viewTableContainer.classList.remove('hidden');
  elements.viewMarkdownContainer.classList.add('hidden');
  setVisualSubView(state.visualSubView);
}

function switchToMarkdownView() {
  elements.tabBtnMarkdown.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition-all';
  elements.tabBtnTable.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all';
  elements.viewMarkdownContainer.classList.remove('hidden');
  elements.viewTableContainer.classList.add('hidden');
}

// 渲染支持搜索过滤的可视化排班（同时渲染卡片视图与表格视图）
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
    elements.finalCardsContainer.innerHTML = '';
    elements.tableEmptySearch.classList.remove('hidden');
    return;
  }

  elements.tableEmptySearch.classList.add('hidden');

  // 1. 渲染电脑端表格行
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

  // 2. 渲染手机端卡片流
  const cardsHtml = filteredItems.map((item, idx) => {
    const dateDisplay = highlightMatch(item.dateStr, query);
    const weekdayDisplay = highlightMatch(item.weekday, query);

    const cardChipsHtml = item.names.map(name => {
      const isMatch = query && name.toLowerCase().includes(query);
      const highlightedName = highlightMatch(name, query);
      return `<span class="mobile-person-chip inline-block cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium border ${isMatch ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-slate-100 border-slate-200 text-slate-800 active:bg-indigo-100 active:text-indigo-800'}" onclick="setTableSearch('${name}')" title="点击筛选此人排班">${highlightedName}</span>`;
    }).join('');

    const badge = item.isManualWorkday
      ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded ml-1">补班</span>'
      : '';

    return `
      <div class="schedule-card bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">第 ${idx + 1} 天</span>
            <span class="text-xs sm:text-sm font-bold text-slate-900 font-mono">${dateDisplay}</span>
            ${badge}
          </div>
          <span class="text-xs font-semibold ${item.weekday === '周六' || item.weekday === '周日' ? 'text-amber-600' : 'text-slate-600'}">${weekdayDisplay}</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${cardChipsHtml}
        </div>
      </div>
    `;
  }).join('');
  elements.finalCardsContainer.innerHTML = cardsHtml;
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

// 导出并下载排班表 CSV 文件 (带 BOM 防止 Excel 乱码)
function downloadCsvFile() {
  if (!state.finalScheduleItems || state.finalScheduleItems.length === 0) return;

  const csvContent = formatToCsv(state.finalScheduleItems);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const startDate = state.finalScheduleItems[0]?.dateStr || '';
  const endDate = state.finalScheduleItems[state.finalScheduleItems.length - 1]?.dateStr || '';
  const fileName = `排班表_${startDate}_至_${endDate}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`排班表 CSV 文件已导出并开始下载！`);
}

/**
 * 生成独立的单文件 HTML 可视化排班表
 * 纯内联样式与脚本，无外部 CDN 依赖，双击即可直接在任何浏览器完美离线打开
 */
function generateStandaloneHtml(items, stats) {
  const itemsJson = JSON.stringify(items);
  const statsJson = JSON.stringify(stats);
  const title = `排班表 (${stats.startDate} 至 ${stats.endDate})`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
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
    /* 卡片视图样式 */
    .cards-wrapper {
      padding: 12px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 600px;
      overflow-y: auto;
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
    /* 表格视图样式 */
    .table-wrapper {
      max-height: 600px;
      overflow-y: auto;
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
      color: #047857;
      background: #d1fae5;
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
    .hidden { display: none !important; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .header { border: none; box-shadow: none; padding: 0 0 16px 0; }
      .btn-print, .btn-csv, .header-actions, .toolbar, .cards-wrapper, .view-toggle { display: none !important; }
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
          <div class="title">📅 在线排班表</div>
          <div class="subtitle">排班区间：${stats.startDate} 至 ${stats.endDate} · 严格无余数均等轮替</div>
        </div>
        <div class="header-actions">
          <button class="btn-csv" onclick="downloadCsv()">📊 导出 CSV</button>
          <button class="btn-print" onclick="window.print()">🖨️ 打印 / 另存为 PDF</button>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总参与人数</div>
          <div class="stat-value">${stats.totalPeople} 人</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">每日排班人数</div>
          <div class="stat-value">${stats.dailyPeople} 人</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">排班总天数</div>
          <div class="stat-value">${stats.totalDays} 天整</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">每人轮值次数</div>
          <div class="stat-value">${stats.shiftsPerPerson} 次</div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <div class="toolbar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" class="search-input" placeholder="输入姓名、日期或星期搜索...">
          <button id="btnClear" class="btn-clear" onclick="clearSearch()">✕</button>
        </div>
        <div class="toolbar-right">
          <div id="statsInfo" class="toolbar-info">共 ${items.length} 天排班</div>
          <div class="view-toggle">
            <button id="btnCards" class="view-btn" onclick="setViewMode('cards')">📋 卡片</button>
            <button id="btnTable" class="view-btn" onclick="setViewMode('table')">📊 表格</button>
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
              <th style="width: 60px;">序号</th>
              <th style="width: 130px;">日期</th>
              <th style="width: 80px;">星期</th>
              <th>排班值班人员（全角逗号分隔）</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>

      <div id="emptyState" class="empty-state">
        <div style="font-size: 28px; margin-bottom: 8px;">🔍</div>
        未找到与关键词匹配的排班记录
      </div>
    </div>
  </div>

  <script>
    const scheduleData = ${itemsJson};
    const statsData = ${statsJson};
    let currentView = window.innerWidth < 640 ? 'cards' : 'table';

    const searchInput = document.getElementById('searchInput');
    const btnClear = document.getElementById('btnClear');
    const tableBody = document.getElementById('tableBody');
    const cardsWrapper = document.getElementById('cardsWrapper');
    const tableWrapper = document.getElementById('tableWrapper');
    const btnCards = document.getElementById('btnCards');
    const btnTable = document.getElementById('btnTable');
    const statsInfo = document.getElementById('statsInfo');
    const emptyState = document.getElementById('emptyState');

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
      if (mode === 'cards') {
        btnCards.className = 'view-btn active';
        btnTable.className = 'view-btn';
        cardsWrapper.classList.remove('hidden');
        tableWrapper.classList.add('hidden');
      } else {
        btnTable.className = 'view-btn active';
        btnCards.className = 'view-btn';
        tableWrapper.classList.remove('hidden');
        cardsWrapper.classList.add('hidden');
      }
    }

    function render(query = '') {
      query = query.trim().toLowerCase();
      btnClear.style.display = query ? 'block' : 'none';

      const filtered = scheduleData.filter(item => {
        if (!query) return true;
        if (item.dateStr.toLowerCase().includes(query)) return true;
        if (item.weekday.toLowerCase().includes(query)) return true;
        return item.names.some(name => name.toLowerCase().includes(query));
      });

      if (query) {
        statsInfo.innerHTML = '共找到 <b>' + filtered.length + '</b> 天（匹配 “' + escapeHtml(query) + '”）';
      } else {
        statsInfo.textContent = '共 ' + scheduleData.length + ' 天排班';
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
        const makeupBadge = item.isManualWorkday ? '<span class="badge-makeup">补</span>' : '';
        const makeupCardBadge = item.isManualWorkday ? '<span class="badge-makeup">补班</span>' : '';

        // 表格行
        const tableNamesHtml = item.names.map(name => {
          const isMatch = query && name.toLowerCase().includes(query);
          return '<span class="person-chip ' + (isMatch ? 'active-match' : '') + '" data-name="' + escapeHtml(name) + '" title="点击筛选">' + highlight(name, query) + '</span>';
        }).join('，');

        tableHtml += '<tr>' +
          '<td style="color: #94a3b8; font-family: monospace;">' + (idx + 1) + '</td>' +
          '<td style="font-weight: 600; font-family: monospace;">' + highlight(item.dateStr, query) + makeupBadge + '</td>' +
          '<td style="color: #475569;">' + highlight(item.weekday, query) + '</td>' +
          '<td>' + tableNamesHtml + '</td>' +
        '</tr>';

        // 卡片项
        const cardChipsHtml = item.names.map(name => {
          const isMatch = query && name.toLowerCase().includes(query);
          return '<span class="mobile-person-chip ' + (isMatch ? 'active-match' : '') + '" data-name="' + escapeHtml(name) + '" title="点击筛选">' + highlight(name, query) + '</span>';
        }).join('');

        cardsHtml += '<div class="card-item">' +
          '<div class="card-header">' +
            '<div class="card-title-left">' +
              '<span class="card-day-num">第 ' + (idx + 1) + ' 天</span>' +
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
      const maxNames = scheduleData.reduce(function(m, item) { return Math.max(m, (item.names || []).length); }, 0);
      const headers = ['序号', '日期', '星期', '排班名单'];
      if (maxNames > 1) {
        for (let i = 1; i <= maxNames; i++) {
          headers.push('人员' + i);
        }
      }

      const rows = scheduleData.map(function(item, index) {
        const seq = index + 1;
        const date = item.dateStr;
        const weekday = item.weekday;
        const names = item.names || [];
        const namesStr = names.join('，');
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
      const fileName = '排班表_' + (statsData.startDate || '') + '_至_' + (statsData.endDate || '') + '.csv';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setViewMode(currentView);
    render('');
  </script>
</body>
</html>`;
}

// 导出并下载独立可视化 HTML 文件
function downloadHtmlFile() {
  if (!state.finalScheduleItems || state.finalScheduleItems.length === 0) return;

  const startDate = state.finalScheduleItems[0]?.dateStr || '';
  const endDate = state.finalScheduleItems[state.finalScheduleItems.length - 1]?.dateStr || '';
  const stats = {
    totalPeople: state.names.length,
    dailyPeople: state.dailyCount,
    totalDays: state.scheduleAssignments.totalDays,
    shiftsPerPerson: state.scheduleAssignments.shiftsPerPerson,
    startDate,
    endDate
  };

  const htmlContent = generateStandaloneHtml(state.finalScheduleItems, stats);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `可视化排班表_${startDate}_至_${endDate}.html`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`已导出独立可视化排班表 HTML 文件`);
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

  elements.btnDownloadHtml.addEventListener('click', downloadHtmlFile);
  elements.btnDownloadCsv.addEventListener('click', downloadCsvFile);
  elements.btnCopyMarkdown.addEventListener('click', copyMarkdownToClipboard);

  // 视图切换：卡片 vs 表格
  elements.btnSubviewCards.addEventListener('click', () => setVisualSubView('cards'));
  elements.btnSubviewTable.addEventListener('click', () => setVisualSubView('table'));

  // 视图切换：可视化排班 vs Markdown
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
