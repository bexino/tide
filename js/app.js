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

  // 排班结果视图（手机端默认卡片，电脑端默认表格）
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

  // 步骤标题导览菜单
  stepMenus: [
    null,
    document.getElementById('step-menu-1'),
    document.getElementById('step-menu-2'),
    document.getElementById('step-menu-3'),
    document.getElementById('step-menu-4'),
    document.getElementById('step-menu-5')
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

  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon'),

  // 网站页脚
  siteFooter: document.getElementById('site-footer'),
  siteFooterContent: document.getElementById('site-footer-content')
};

// 步骤标题导览菜单选项
const STEP_MENU_ITEMS = [
  { step: 1, title: '名单与人数' },
  { step: 2, title: '轮换检查' },
  { step: 3, title: '起始日期' },
  { step: 4, title: '假期修改' },
  { step: 5, title: '排班生成完毕' }
];

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
  const stepIndex = parseInt(anchorButton.dataset.step, 10) - 1;
  const menu = elements.stepMenus[stepIndex + 1];
  if (!menu) return;

  menu.classList.remove('hidden');
  menu.querySelector('.step-menu-list').innerHTML = STEP_MENU_ITEMS.map((item) => {
    const isCurrent = item.step === state.currentStep;
    return `
      <button
        type="button"
        class="step-menu-item${isCurrent ? ' is-current' : ''}"
        role="menuitem"
        onclick="selectStepMenuItem(${item.step})"
      >
        <span class="step-menu-number">${isCurrent ? '当前' : item.step}</span>
        <span>${item.title}</span>
      </button>
    `;
  }).join('');

  menu.style.setProperty('--menu-width', 'max-content');
}

function selectStepMenuItem(targetStep) {
  if (elements.activeStepMenuAnchor) closeStepMenu(elements.activeStepMenuAnchor);
  goToStep(targetStep);
}

function closeStepMenu(anchorButton) {
  if (!anchorButton) return;
  anchorButton.setAttribute('aria-expanded', 'false');
  const stepIndex = parseInt(anchorButton.dataset.step, 10) - 1;
  elements.stepMenus[stepIndex + 1]?.classList.add('hidden');
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
  script.src = `docs/footer.md?_=${Date.now()}`;
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
  elements.namesCountBadge.textContent = `已识别 ${count} 人`;

  const daily = parseInt(elements.dailyCountInput.value, 10) || 4;

  if (count > 0 && daily > 0) {
    const cycle = calculateCycle(count, daily);

    if (count >= daily) {
      elements.step1CycleHint.innerHTML = `
        需排班 <span class="text-indigo-600 font-bold text-sm">${cycle.totalDays}</span> 天整，
        每人值班 <span class="text-indigo-600 font-bold text-sm">${cycle.shiftsPerPerson}</span> 次，
        总计 <span class="text-indigo-600 font-bold text-sm">${cycle.totalShifts}</span> 班次。
      `;
      hideError(elements.step1Error);
    } else {
      elements.step1CycleHint.innerHTML = `<span class="text-amber-600 font-medium">⚠️ 总人数 (${count}人) 少于每日值班人数 (${daily}人)，请补充人员或调低每日人数。</span>`;
    }
  } else {
    elements.step1CycleHint.textContent = '等待键入...';
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
      showError(elements.step1Error, `总人数 (${parsed.length}人) 不能少于每日值班人数 (${dailyCount}人)`);
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
  for (let i = 1; i <= 5; i++) {
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
        <span class="text-xs font-bold text-emerald-600 ml-2">共 ${days.length} 次</span>
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
  showToast('成功重置');
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
    showToast('错误', '✗');
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

// 计算本次排班的完整可选区间
function getScheduleDateRange() {
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
    showToast(`只能选择 ${validRange.start} 至 ${validRange.end} 内的日期`, '⚠️');
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
    return { dateStatus: 'unselected', allowedActions: { holiday: false, workday: false, reset: false }, message: '请选择' };
  }

  const validRange = getScheduleDateRange();
  if (isScheduleDateOutsideRange(dateStr, validRange)) {
    return {
      dateStatus: 'outside',
      allowedActions: { holiday: false, workday: false, reset: false },
      message: '这天是：超出排班区间'
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
      message: '这天是：手动节假日'
    };
  }

  if (isManualWorkday) {
    return {
      dateStatus: 'manual-workday',
      allowedActions: { holiday: true, workday: false, reset: true },
      message: '这天是：调休补班'
    };
  }

  if (isWeekend) {
    return {
      dateStatus: 'weekend',
      allowedActions: { holiday: false, workday: true, reset: false },
      message: '这天是：双休日'
    };
  }

  return {
    dateStatus: 'default-workday',
    allowedActions: { holiday: true, workday: false, reset: false },
    message: '这天是：默认排班'
  };
}

function updateQuickDateState() {
  const quickState = getQuickDateState(elements.calendarQuickDateInput.value);
  elements.calendarQuickDateButton.textContent = elements.calendarQuickDateInput.value
    ? elements.calendarQuickDateInput.value.replaceAll('-', '/')
    : '请选择';
  elements.calendarQuickDateState.textContent = quickState.message;

  const statusStyles = {
    unselected: 'text-slate-500',
    outside: 'text-slate-500',
    'default-workday': 'text-blue-700',
    weekend: 'text-slate-600',
    'manual-holiday': 'text-rose-700',
    'manual-workday': 'text-emerald-700'
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

// 渲染月历格子 (7列 x 5~6行)
function renderMonthGrid(year, month, datesMap, validRange) {
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

  elements.calendarGrid.innerHTML = cellsHtml;
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
  const isDateDisabled = isScheduleDateOutsideRange(dateStr, validRange);

  if (isDateDisabled) {
    cellBgClass = 'bg-slate-50/60 cursor-not-allowed hover:bg-slate-50/60';
    borderClass = 'border-slate-200/80';
    badgeHtml = '';
    textColor = isOtherMonth ? 'text-slate-300' : 'text-slate-400';
  } else if (dayInfo && dayInfo.isWorkday) {
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
    badgeHtml = `<span class="text-[10px] font-bold text-rose-700 bg-rose-200/90 px-1.5 py-0.5 rounded shadow-2xs">休</span>`;
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
  if (isDateDisabled) {
    titleTooltip += ' [不可选择] 仅允许修改起始日期至实际排班结束日期范围内的日期';
  } else if (dayInfo && dayInfo.isWorkday) {
    titleTooltip += ` [排班第${dayInfo.workdayIndex}天] 点击设为放假`;
  } else if (isExcluded) {
    titleTooltip += ' [放假跳过] 点击恢复排班';
  } else if (isWeekend) {
    titleTooltip += ' [周末] 点击设为调休补班';
  }

  return `
    <div class="calendar-cell p-2 select-none flex flex-col justify-between border ${borderClass} ${cellBgClass}"
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
  if (validateScheduleDateSelection(dateStr)) return;

  const quickState = getQuickDateState(dateStr);
  if (quickState.dateStatus === 'manual-holiday') {
    state.excludedHolidays.delete(dateStr);
    showToast(`已恢复排班：${dateStr}`);
  } else if (quickState.dateStatus === 'manual-workday') {
    state.manualWorkdays.delete(dateStr);
    showToast(`已恢复初始状态：${dateStr}`);
  } else if (quickState.dateStatus === 'weekend') {
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
  if (validateScheduleDateSelection(dateStr)) return;
  state.excludedHolidays.delete(dateStr);
  showToast(`已恢复排班：${dateStr}`);
  renderStep4Calendar();
}

function removeManualWorkdayTag(dateStr) {
  if (validateScheduleDateSelection(dateStr)) return;
  state.manualWorkdays.delete(dateStr);
  showToast(`已撤销补班：${dateStr}`);
  renderStep4Calendar();
}

function handleQuickSetHoliday() {
  const val = elements.calendarQuickDateInput.value;
  if (!val) {
    showToast('请先选择日期', '⚠️');
    return;
  }
  if (validateScheduleDateSelection(val)) return;
  const quickState = getQuickDateState(val);
  if (!quickState.allowedActions.holiday) {
    showToast(quickState.dateStatus === 'manual-holiday' ? '该日期已是手动节假日' : '默认排班日期不能设为调休补班', '⚠️');
    return;
  }

  state.manualWorkdays.delete(val);
  state.excludedHolidays.add(val);
  renderStep4Calendar();
  showToast(`已将 ${val} 设为跳过放假`, '🚫');
  elements.calendarQuickDateInput.value = '';
  updateQuickDateState();
}

function handleQuickSetWorkday() {
  const val = elements.calendarQuickDateInput.value;
  if (!val) {
    showToast('请先选择日期', '⚠️');
    return;
  }
  if (validateScheduleDateSelection(val)) return;
  const quickState = getQuickDateState(val);
  if (!quickState.allowedActions.workday) {
    showToast(quickState.dateStatus === 'default-workday' ? '默认排班日期无需调休补班' : '双休日不能设为手动节假日', '⚠️');
    return;
  }

  state.excludedHolidays.delete(val);
  state.manualWorkdays.add(val);
  renderStep4Calendar();
  showToast(`已将 ${val} 设为调休排班！`, '✅');
  elements.calendarQuickDateInput.value = '';
  updateQuickDateState();
}

function handleQuickResetDate() {
  const val = elements.calendarQuickDateInput.value;
  if (!val) {
    showToast('请先选择日期', '⚠️');
    return;
  }
  if (validateScheduleDateSelection(val)) return;

  const quickState = getQuickDateState(val);
  if (!quickState.allowedActions.reset) {
    showToast('该日期已是初始状态', '⚠️');
    return;
  }

  state.excludedHolidays.delete(val);
  state.manualWorkdays.delete(val);
  renderStep4Calendar();
  showToast(`已恢复初始状态：${val}`);
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

  elements.btnSubviewCards.className = isCardsView ? activeClass : inactiveClass;
  elements.btnSubviewTable.className = viewMode === 'table' ? activeClass : inactiveClass;
  elements.btnSubviewText.className = isTextView ? activeClass : inactiveClass;

  elements.finalCardsContainer.classList.toggle('hidden', !isCardsView);
  elements.finalTableScrollContainer.classList.toggle('hidden', viewMode !== 'table');
  elements.viewTextContainer.classList.toggle('hidden', !isTextView);
  if (state.visualSubView === 'text') {
    elements.tableEmptySearch.classList.add('hidden');
  }
}

// 渲染支持搜索过滤的可视化排班（同时渲染卡片与表格）
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
    elements.searchResultStats.innerHTML = `共找到 <b class="text-indigo-600 font-bold">${filteredItems.length}</b> 天（匹配 “${query}”）`;
  } else {
    elements.btnClearTableSearch.classList.add('hidden');
    elements.searchResultStats.textContent = `共 ${state.finalScheduleItems.length} 天`;
  }

  if (state.visualSubView === 'text') {
    elements.tableEmptySearch.classList.add('hidden');
    return;
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
  const markdownText = formatToMarkdown(items);
  const markdownJson = JSON.stringify(markdownText);
  const title = `排班表 (${stats.startDate} 至 ${stats.endDate})`;
  const footerHtml = renderMarkdownFooter(siteFooterMarkdown);

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
      max-height: 600px;
      overflow: visible;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      display: block;
    }
    .markdown-output {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 400px;
      max-height: 600px;
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
    /* 表格样式 */
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
          <div class="title">排班表</div>
          <div class="subtitle">排班区间：${stats.startDate} 至 ${stats.endDate} <br> 点击人名亦可快速筛选。</div>
        </div>
        <div class="header-actions">
          <button class="btn-csv" onclick="downloadCsv()">表格</button>
          <button class="btn-print" onclick="window.print()">PDF</button>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总参与人数</div>
          <div class="stat-value">${stats.totalPeople} 人</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">每日值班人数</div>
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
          <div id="statsInfo" class="toolbar-info">共 ${items.length} 天</div>
          <div class="view-toggle">
            <button id="btnCards" class="view-btn" onclick="setViewMode('cards')">卡片</button>
            <button id="btnTable" class="view-btn" onclick="setViewMode('table')">表格</button>
            <button id="btnText" class="view-btn" onclick="setViewMode('text')">文本</button>
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
              <th>值班人员</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>

      <div id="emptyState" class="empty-state">
        <div style="font-size: 28px; margin-bottom: 8px;">🔍</div>
        未找到与关键词匹配的排班记录
      </div>

      <div id="markdownWrapper" class="markdown-wrapper">
        <div class="copy-wrapper">
          <button id="btnCopy" class="btn-copy" onclick="copyMarkdown()" aria-label="复制 Markdown 文本" title="复制 Markdown 文本">复制</button>
        </div>
        <textarea id="markdownOutput" class="markdown-output" readonly></textarea>
      </div>
    </div>
  </div>

  <footer class="site-footer" aria-label="页脚">
    <div id="footerContent" class="site-footer-content"></div>
  </footer>

  <div id="appToast" class="app-toast">
    <span>✓</span>
    <span id="appToastMessage">操作成功</span>
  </div>

  <script>
    const scheduleData = ${itemsJson};
    const statsData = ${statsJson};
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

      const filtered = scheduleData.filter(item => {
        if (!query) return true;
        if (item.dateStr.toLowerCase().includes(query)) return true;
        if (item.weekday.toLowerCase().includes(query)) return true;
        return item.names.some(name => name.toLowerCase().includes(query));
      });

      if (query) {
        statsInfo.innerHTML = '共找到 <b>' + filtered.length + '</b> 天（匹配 “' + escapeHtml(query) + '”）';
      } else {
        statsInfo.textContent = '共 ' + scheduleData.length + ' 天';
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
      appToastMessage.textContent = '排班表 Markdown 已成功复制到剪贴板！';
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
    markdownOutput.value = markdownText;

    var footerContent = document.getElementById('footerContent');
    if (footerContent) footerContent.innerHTML = ${JSON.stringify(footerHtml)};
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
    showToast('成功');
  });

  elements.btnClearNames.addEventListener('click', () => {
    elements.namesInput.value = '';
    handleStep1Inputs();
    showToast('成功');
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
    showToast('成功', '✓');
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
    showToast('成功重置');
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
  loadSiteFooter();

  document.addEventListener('click', (event) => {
    if (!elements.activeStepMenuAnchor) return;
    if (event.target.closest('.step-title-button') || event.target.closest('.step-menu')) return;
    closeStepMenu(elements.activeStepMenuAnchor);
  });

  window.addEventListener('resize', () => {
    if (elements.activeStepMenuAnchor) closeStepMenu(elements.activeStepMenuAnchor);
  });

  window.addEventListener('scroll', () => {
    if (elements.activeStepMenuAnchor) closeStepMenu(elements.activeStepMenuAnchor);
  }, true);

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
