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
  excludedHolidays: new Set(),
  finalScheduleItems: [],
  markdownText: ''
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

  // Step 4
  targetWorkdaysBadge: document.getElementById('target-workdays-badge'),
  statusNeededDays: document.getElementById('status-needed-days'),
  statusExcludedCount: document.getElementById('status-excluded-count'),
  statusDateRange: document.getElementById('status-date-range'),
  customHolidayInput: document.getElementById('custom-holiday-input'),
  btnAddCustomHoliday: document.getElementById('btn-add-custom-holiday'),
  btnClearHolidays: document.getElementById('btn-clear-holidays'),
  excludedTagsContainer: document.getElementById('excluded-tags-container'),
  excludedTagsList: document.getElementById('excluded-tags-list'),
  datesSelectionGrid: document.getElementById('dates-selection-grid'),
  btnToStep5: document.getElementById('btn-to-step-5'),

  // Step 5
  markdownOutput: document.getElementById('markdown-output'),
  finalTableBody: document.getElementById('final-table-body'),
  btnCopyMarkdown: document.getElementById('btn-copy-markdown'),
  btnDownloadMarkdown: document.getElementById('btn-download-markdown'),
  tabBtnMarkdown: document.getElementById('tab-btn-markdown'),
  tabBtnTable: document.getElementById('tab-btn-table'),
  viewMarkdownContainer: document.getElementById('view-markdown-container'),
  viewTableContainer: document.getElementById('view-table-container'),
  btnRestart: document.getElementById('btn-restart'),

  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon')
};

// 初始化当前日期（默认今天）
function getTodayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Toast 提示
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

// 步骤切换与校验逻辑
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

    // 检查是否需要重新生成排班方案（首次进入或名单/每日人数发生变化）
    const namesChanged = JSON.stringify(parsed) !== JSON.stringify(state.names);
    const dailyChanged = dailyCount !== state.dailyCount;

    state.names = parsed;
    state.dailyCount = dailyCount;

    if (!state.scheduleAssignments || namesChanged || dailyChanged) {
      generateAssignments();
    }
  }

  if (targetStep >= 4 && !state.startDateStr) {
    state.startDateStr = elements.startDateInput.value || getTodayDateStr();
  }

  if (targetStep === 4) {
    renderStep4Holidays();
  }

  if (targetStep === 5) {
    renderFinalSchedule();
  }

  // 更新步骤指示器
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    const text = document.getElementById(`step-text-${i}`);
    const line = document.getElementById(`step-line-${i}`);

    if (i < targetStep) {
      // 已完成步骤
      dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all bg-emerald-500 text-white shadow-md shadow-emerald-100';
      dot.innerHTML = '✓';
      text.className = 'text-xs sm:text-sm font-medium mt-2 text-emerald-600';
      if (line) line.className = 'step-line bg-emerald-500 -mt-5';
    } else if (i === targetStep) {
      // 当前步骤
      dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50';
      dot.innerHTML = `${i}`;
      text.className = 'text-xs sm:text-sm font-bold mt-2 text-indigo-600';
      if (line) line.className = 'step-line bg-slate-200 -mt-5';
    } else {
      // 未到步骤
      dot.className = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all bg-slate-200 text-slate-500';
      dot.innerHTML = `${i}`;
      text.className = 'text-xs sm:text-sm font-medium mt-2 text-slate-400';
      if (line) line.className = 'step-line bg-slate-200 -mt-5';
    }

    // 控制面板显示
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

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
}

// 步骤 1 实时反馈
function handleNamesInput() {
  const parsed = parseNames(elements.namesInput.value);
  const count = parsed.length;
  elements.namesCountBadge.textContent = `已识别 ${count} 人`;

  const daily = parseInt(elements.dailyCountInput.value, 10) || 4;
  if (count > 0 && daily > 0 && count >= daily) {
    const cycle = calculateCycle(count, daily);
    elements.step1CycleHint.innerHTML = `
      预计完整无余数周期为 <span class="text-indigo-600 font-bold">${cycle.totalDays}</span> 天整，
      每人轮值 <span class="text-indigo-600 font-bold">${cycle.shiftsPerPerson}</span> 次，
      总排班 <span class="text-indigo-600 font-bold">${cycle.totalShifts}</span> 人次。
    `;
    hideError(elements.step1Error);
  } else if (count > 0 && count < daily) {
    elements.step1CycleHint.innerHTML = `<span class="text-amber-600 font-medium">⚠️ 总人数 (${count}人) 少于每日排班人数 (${daily}人)，请补充人员或调整每日人数。</span>`;
  } else {
    elements.step1CycleHint.textContent = '';
  }
}

// 步骤 2 生成并展示方案
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

  // 1. 渲染按天滚动预览列表
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

  // 2. 渲染按人员统计检查列表
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
      <span class="text-amber-600 font-bold">该日为 ${weekday}（非工作日）</span>，排班将自动顺延自紧随的周一起始。
    `;
  } else {
    elements.startDateWeekdayTag.innerHTML = `
      起始日为 <span class="text-indigo-600 font-semibold">${weekday}</span>（工作日）。
    `;
  }
}

// 步骤 4 节假日排除与日期顺延渲染
function renderStep4Holidays() {
  const totalDays = state.scheduleAssignments.totalDays;
  elements.targetWorkdaysBadge.textContent = totalDays;
  elements.statusNeededDays.textContent = totalDays;
  elements.statusExcludedCount.textContent = state.excludedHolidays.size;

  const { workdays, scannedDays } = computeScheduleDates(
    state.startDateStr,
    totalDays,
    state.excludedHolidays
  );

  // 更新日期跨度
  if (workdays.length > 0) {
    const firstDay = workdays[0].dateStr;
    const lastDay = workdays[workdays.length - 1].dateStr;
    elements.statusDateRange.textContent = `${firstDay} 至 ${lastDay}`;
  }

  // 渲染已排除标签栏
  if (state.excludedHolidays.size > 0) {
    elements.excludedTagsContainer.classList.remove('hidden');
    const sortedHolidays = Array.from(state.excludedHolidays).sort();
    const tagsHtml = sortedHolidays.map(dateStr => {
      const d = parseDate(dateStr);
      const wk = WEEKDAY_NAMES[d.getDay()];
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs shadow-xs font-mono">
          <span>${dateStr} (${wk})</span>
          <button type="button" onclick="toggleHoliday('${dateStr}')" class="hover:text-rose-900 font-bold ml-1 text-sm leading-none" title="恢复此排班日期">✕</button>
        </span>
      `;
    }).join('');
    elements.excludedTagsList.innerHTML = tagsHtml;
  } else {
    elements.excludedTagsContainer.classList.add('hidden');
  }

  // 渲染日期 Chip 列表
  // 过滤出所有工作日或被排除的日期（周末已自动跳过且无需显示在排除列表中）
  const relevantDays = scannedDays.filter(d => !d.isWeekend || d.isExcluded);

  let workdayCounter = 0;
  const gridHtml = relevantDays.map(item => {
    const isExcluded = state.excludedHolidays.has(item.dateStr);
    let shiftBadge = '';

    if (!isExcluded) {
      workdayCounter++;
      shiftBadge = `<span class="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 px-1.5 py-0.5 rounded">第 ${workdayCounter} 天</span>`;
    } else {
      shiftBadge = `<span class="text-[10px] font-bold text-rose-600 bg-rose-200/80 px-1.5 py-0.5 rounded">跳过放假</span>`;
    }

    const cardClass = isExcluded
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20';

    return `
      <div class="cursor-pointer select-none rounded-xl border p-2.5 transition-all shadow-xs flex flex-col justify-between ${cardClass}"
           onclick="toggleHoliday('${item.dateStr}')">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold">${item.dateStr.slice(5)}</span>
          ${shiftBadge}
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500">
          <span>${item.dateStr.slice(0, 4)}年</span>
          <span class="font-medium ${item.weekday === '周日' || item.weekday === '周六' ? 'text-amber-600' : 'text-slate-700'}">${item.weekday}</span>
        </div>
      </div>
    `;
  }).join('');

  elements.datesSelectionGrid.innerHTML = gridHtml;
}

// 切换某个日期的排除状态
function toggleHoliday(dateStr) {
  if (state.excludedHolidays.has(dateStr)) {
    state.excludedHolidays.delete(dateStr);
    showToast(`已恢复排班：${dateStr}`);
  } else {
    state.excludedHolidays.add(dateStr);
    showToast(`已排除放假：${dateStr}`, '🚫');
  }
  renderStep4Holidays();
}

// 步骤 5 最终排班生成与展示
function renderFinalSchedule() {
  const totalDays = state.scheduleAssignments.totalDays;
  const { workdays } = computeScheduleDates(
    state.startDateStr,
    totalDays,
    state.excludedHolidays
  );

  state.finalScheduleItems = workdays.map((wd, idx) => ({
    dateStr: wd.dateStr,
    weekday: wd.weekday,
    names: state.scheduleAssignments.dailyAssignments[idx]
  }));

  // 生成 Markdown
  state.markdownText = formatToMarkdown(state.finalScheduleItems);
  elements.markdownOutput.value = state.markdownText;

  // 渲染可视化表格
  const tableRows = state.finalScheduleItems.map((item, idx) => {
    return `
      <tr class="hover:bg-indigo-50/30 transition-colors">
        <td class="py-2.5 px-4 font-mono text-slate-400">${idx + 1}</td>
        <td class="py-2.5 px-4 font-medium font-mono text-slate-900">${item.dateStr}</td>
        <td class="py-2.5 px-4 text-slate-600 font-medium">${item.weekday}</td>
        <td class="py-2.5 px-4 text-indigo-700 font-semibold">${item.names.join('，')}</td>
      </tr>
    `;
  }).join('');
  elements.finalTableBody.innerHTML = tableRows;
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
  // Step 1: 名单输入与操作
  elements.namesInput.addEventListener('input', handleNamesInput);
  elements.dailyCountInput.addEventListener('input', handleNamesInput);

  elements.btnLoadSample.addEventListener('click', () => {
    elements.namesInput.value = SAMPLE_NAMES_TEXT;
    handleNamesInput();
    showToast('已成功载入 1.md 的 49 人示例名单');
  });

  elements.btnClearNames.addEventListener('click', () => {
    elements.namesInput.value = '';
    handleNamesInput();
    showToast('已清空名单列表', 'ℹ');
  });

  elements.btnDecreaseDaily.addEventListener('click', () => {
    let cur = parseInt(elements.dailyCountInput.value, 10) || 4;
    if (cur > 1) {
      elements.dailyCountInput.value = cur - 1;
      handleNamesInput();
    }
  });

  elements.btnIncreaseDaily.addEventListener('click', () => {
    let cur = parseInt(elements.dailyCountInput.value, 10) || 4;
    elements.dailyCountInput.value = cur + 1;
    handleNamesInput();
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

  // Step 4: 节假日
  elements.btnAddCustomHoliday.addEventListener('click', () => {
    const val = elements.customHolidayInput.value;
    if (!val) {
      showToast('请先选择要排除的日期', '⚠️');
      return;
    }
    state.excludedHolidays.add(val);
    renderStep4Holidays();
    showToast(`已排除日期：${val}`, '🚫');
    elements.customHolidayInput.value = '';
  });

  elements.btnClearHolidays.addEventListener('click', () => {
    state.excludedHolidays.clear();
    renderStep4Holidays();
    showToast('已清空所有排除的节假日');
  });

  elements.btnToStep5.addEventListener('click', () => goToStep(5));

  // Step 5: 输出操作
  elements.btnCopyMarkdown.addEventListener('click', copyMarkdownToClipboard);
  elements.btnDownloadMarkdown.addEventListener('click', downloadMarkdownFile);

  // 视图切换
  elements.tabBtnMarkdown.addEventListener('click', () => {
    elements.tabBtnMarkdown.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition-all';
    elements.tabBtnTable.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all';
    elements.viewMarkdownContainer.classList.remove('hidden');
    elements.viewTableContainer.classList.add('hidden');
  });

  elements.tabBtnTable.addEventListener('click', () => {
    elements.tabBtnTable.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition-all';
    elements.tabBtnMarkdown.className = 'text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all';
    elements.viewTableContainer.classList.remove('hidden');
    elements.viewMarkdownContainer.classList.add('hidden');
  });

  elements.btnRestart.addEventListener('click', () => {
    if (confirm('确定要重新开始排班吗？当前所有配置将被重置。')) {
      state.excludedHolidays.clear();
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
  handleNamesInput();

  // 默认预置今天为开始日期
  const todayStr = getTodayDateStr();
  state.startDateStr = todayStr;
  elements.startDateInput.value = todayStr;
  handleStartDateChange();
});
