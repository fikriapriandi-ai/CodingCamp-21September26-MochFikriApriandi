/* ============================================================
   Expense & Budget Visualizer — app.js
   ============================================================ */
'use strict';

// ── Storage Keys ──────────────────────────────────────────
var STORAGE_TRANSACTIONS   = 'ebv_transactions';
var STORAGE_CATEGORIES     = 'ebv_categories';
var STORAGE_BUDGETS        = 'ebv_budgets';
var STORAGE_THEME          = 'ebv_theme';
var STORAGE_SORT           = 'ebv_sort';
var STORAGE_BUDGET_OVERALL = 'ebv_budget_overall';

// ── SVG icon strings for built-in categories ──────────────
// Kept as strings so they render inside canvas-adjacent HTML
var SVG_FOOD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8h1a4 4 0 010 8h-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
var SVG_TRANSPORT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 8h4l3 5v3h-7V8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8"/></svg>';
var SVG_FUN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="1.8"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>';
var SVG_INCOME = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/><circle cx="7" cy="15" r="1.2" fill="currentColor"/><path d="M11 15h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
var SVG_DEFAULT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';

// ── Built-in Categories ───────────────────────────────────
var BUILTIN_CATEGORIES = [
  { name: 'Food',      svgIcon: SVG_FOOD,      color: '#f97316', builtin: true },
  { name: 'Transport', svgIcon: SVG_TRANSPORT, color: '#3b82f6', builtin: true },
  { name: 'Fun',       svgIcon: SVG_FUN,       color: '#a855f7', builtin: true },
  { name: 'Income',    svgIcon: SVG_INCOME,    color: '#22c55e', builtin: true },
];

// ── Cached Intl formatter ──────────────────────────────────
var rpFormatter = new Intl.NumberFormat('id-ID');

// ── State ─────────────────────────────────────────────────
var transactions  = loadJSON(STORAGE_TRANSACTIONS, []);
var customCats    = loadJSON(STORAGE_CATEGORIES,   []);
var budgets       = loadJSON(STORAGE_BUDGETS,      {});
var currentSort   = loadJSON(STORAGE_SORT,         'date');
var currentMonth  = todayMonthKey();
var budgetOverall = parseFloat(localStorage.getItem(STORAGE_BUDGET_OVERALL)) || 0;
var dateFilter    = '';   // 'YYYY-MM-DD' or ''

// ── DOM Refs ──────────────────────────────────────────────
var btnTheme          = document.getElementById('btn-theme');
var iconThemeDark     = document.getElementById('icon-theme-dark');
var iconThemeLight    = document.getElementById('icon-theme-light');
var form              = document.getElementById('transaction-form');
var inputName         = document.getElementById('item-name');
var inputAmount       = document.getElementById('amount');
var selectCat         = document.getElementById('category');
var selectType        = document.getElementById('type');
var errorMsg          = document.getElementById('error-msg');
var txList            = document.getElementById('transaction-list');
var emptyState        = document.getElementById('empty-state');
var balanceEl         = document.getElementById('balance');
var incomeEl          = document.getElementById('total-income');
var expenseEl         = document.getElementById('total-expense');
var canvas            = document.getElementById('pie-chart');
var chartEmpty        = document.getElementById('chart-empty');
var legendEl          = document.getElementById('legend');
var btnClear          = document.getElementById('btn-clear');
var sortBtns          = document.querySelectorAll('.sort-btn');
var monthSelect       = document.getElementById('month-select');
var monthlyBody       = document.getElementById('monthly-body');
var budgetCatSelect   = document.getElementById('budget-category');
var budgetAmtInput    = document.getElementById('budget-amount');
var budgetForm        = document.getElementById('budget-form');
var budgetList        = document.getElementById('budget-list');
var btnToggleBudget   = document.getElementById('btn-toggle-budget-form');
var iconBudgetToggle  = document.getElementById('icon-budget-toggle');
var btnRemoveBudget   = document.getElementById('btn-remove-budget');
var btnOpenCatModal   = document.getElementById('btn-open-cat-modal');
var btnCloseCatModal  = document.getElementById('btn-close-cat-modal');
var catModalOverlay   = document.getElementById('cat-modal-overlay');
var catAddForm        = document.getElementById('cat-add-form');
var catNameInput      = document.getElementById('cat-name-input');
var catIconInput      = document.getElementById('cat-icon-input');
var catColorInput     = document.getElementById('cat-color-input');
var catErrorMsg       = document.getElementById('cat-error-msg');
var catListEl         = document.getElementById('cat-list');
// Overall bar
var inputIncomeAdd      = document.getElementById('input-income-add');
var btnIncomeAdd        = document.getElementById('btn-income-add');
var inputBudgetOverall  = document.getElementById('input-budget-overall');
var overallProgressFill = document.getElementById('overall-progress-fill');
var overallProgressPct  = document.getElementById('overall-progress-pct');
var overallProgressSub  = document.getElementById('overall-progress-sub');
var overallProgressRem  = document.getElementById('overall-progress-remain');
// Date filter
var dateFilterInput = document.getElementById('date-filter');
var btnDateClear    = document.getElementById('btn-date-clear');
// Edit modal
var editModalOverlay  = document.getElementById('edit-modal-overlay');
var btnCloseEditModal = document.getElementById('btn-close-edit-modal');
var editForm          = document.getElementById('edit-form');
var editTxId          = document.getElementById('edit-tx-id');
var editName          = document.getElementById('edit-name');
var editAmount        = document.getElementById('edit-amount');
var editErrorMsg      = document.getElementById('edit-error-msg');
// Burger nav
var btnBurger   = document.getElementById('btn-burger');
var navDrawer   = document.getElementById('nav-drawer');
var navOverlay  = document.getElementById('nav-overlay');
var btnNavClose = document.getElementById('btn-nav-close');

// ── Theme ─────────────────────────────────────────────────
var savedTheme = localStorage.getItem(STORAGE_THEME) || 'dark';
applyTheme(savedTheme);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_THEME, theme);
  if (theme === 'dark') {
    iconThemeDark.classList.remove('hidden');
    iconThemeLight.classList.add('hidden');
  } else {
    iconThemeDark.classList.add('hidden');
    iconThemeLight.classList.remove('hidden');
  }
}

btnTheme.addEventListener('click', function () {
  var cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
  renderChart();
});

// ── Burger Nav ────────────────────────────────────────────
function openNav() {
  navDrawer.classList.remove('hidden');
  navOverlay.classList.remove('hidden');
  navDrawer.removeAttribute('aria-hidden');
  btnBurger.setAttribute('aria-expanded', 'true');
  btnNavClose.focus();
}

function closeNav() {
  navDrawer.classList.add('hidden');
  navOverlay.classList.add('hidden');
  navDrawer.setAttribute('aria-hidden', 'true');
  btnBurger.setAttribute('aria-expanded', 'false');
  btnBurger.focus();
}

btnBurger.addEventListener('click', openNav);
btnNavClose.addEventListener('click', closeNav);
navOverlay.addEventListener('click', closeNav);

document.querySelectorAll('.nav-link').forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    var targetId = this.getAttribute('href').slice(1);
    var target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeNav();
  });
});

// ── Init ──────────────────────────────────────────────────
populateCategorySelects();
populateMonthSelect();
syncSortButtons();
if (budgetOverall > 0) inputBudgetOverall.value = budgetOverall;
render();

// ── Event Listeners ───────────────────────────────────────

form.addEventListener('submit', handleSubmit);
btnClear.addEventListener('click', handleClearAll);

selectCat.addEventListener('change', function () {
  if (selectCat.value === 'Income') selectType.value = 'income';
  else if (selectType.value === 'income') selectType.value = 'expense';
});

selectType.addEventListener('change', function () {
  if (selectType.value === 'income') selectCat.value = 'Income';
  else if (selectCat.value === 'Income') selectCat.value = allCategories()[0].name;
});

for (var i = 0; i < sortBtns.length; i++) {
  sortBtns[i].addEventListener('click', handleSortClick);
}

monthSelect.addEventListener('change', function () {
  currentMonth = monthSelect.value;
  renderMonthlySummary();
  renderBudgets();
  renderOverallProgress();
});

// Budget toggle
btnToggleBudget.addEventListener('click', function () {
  var isHidden = budgetForm.classList.contains('hidden');
  budgetForm.classList.toggle('hidden', !isHidden);
  btnToggleBudget.setAttribute('aria-expanded', String(isHidden));
  // swap icon: + / ×
  iconBudgetToggle.innerHTML = isHidden
    ? '<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
    : '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>';
});

budgetForm.addEventListener('submit', function (e) {
  e.preventDefault();
  var cat = budgetCatSelect.value;
  var amt = parseFloat(budgetAmtInput.value);
  if (!cat || !amt || amt <= 0 || isNaN(amt)) return;
  budgets[cat] = amt;
  saveJSON(STORAGE_BUDGETS, budgets);
  renderBudgets();
  budgetAmtInput.value = '';
  budgetForm.classList.add('hidden');
  btnToggleBudget.setAttribute('aria-expanded', 'false');
  iconBudgetToggle.innerHTML = '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>';
});

btnRemoveBudget.addEventListener('click', function () {
  var cat = budgetCatSelect.value;
  if (cat && budgets[cat]) {
    delete budgets[cat];
    saveJSON(STORAGE_BUDGETS, budgets);
    renderBudgets();
    budgetAmtInput.value = '';
  }
});

// Income add
btnIncomeAdd.addEventListener('click', handleIncomeAdd);
inputIncomeAdd.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); handleIncomeAdd(); }
});

// Budget overall input
var budgetDebounce;
inputBudgetOverall.addEventListener('input', function () {
  clearTimeout(budgetDebounce);
  budgetDebounce = setTimeout(function () {
    budgetOverall = parseFloat(inputBudgetOverall.value) || 0;
    localStorage.setItem(STORAGE_BUDGET_OVERALL, budgetOverall);
    renderOverallProgress();
  }, 400);
});

// Date filter
dateFilterInput.addEventListener('change', function () {
  dateFilter = dateFilterInput.value; // 'YYYY-MM-DD' or ''
  btnDateClear.classList.toggle('hidden', !dateFilter);
  renderList();
});

btnDateClear.addEventListener('click', function () {
  dateFilter = '';
  dateFilterInput.value = '';
  btnDateClear.classList.add('hidden');
  renderList();
});

// Cat modal
btnOpenCatModal.addEventListener('click', openCatModal);
btnCloseCatModal.addEventListener('click', closeCatModal);
catModalOverlay.addEventListener('click', function (e) {
  if (e.target === catModalOverlay) closeCatModal();
});
catAddForm.addEventListener('submit', handleAddCategory);

// Edit modal
btnCloseEditModal.addEventListener('click', closeEditModal);
editModalOverlay.addEventListener('click', function (e) {
  if (e.target === editModalOverlay) closeEditModal();
});
editForm.addEventListener('submit', handleEditSave);

// Escape closes any open modal / nav
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (!editModalOverlay.classList.contains('hidden'))  closeEditModal();
    if (!catModalOverlay.classList.contains('hidden'))   closeCatModal();
    if (!navDrawer.classList.contains('hidden'))         closeNav();
  }
});

// Resize
var resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderChart, 150);
});

// ── Handlers ──────────────────────────────────────────────

function handleSubmit(e) {
  e.preventDefault();
  var name   = inputName.value.trim();
  var amount = parseFloat(inputAmount.value);
  var cat    = selectCat.value;
  var type   = selectType.value;

  if (!name)   { showError('Nama item tidak boleh kosong.'); inputName.focus(); return; }
  if (!amount || amount <= 0 || isNaN(amount)) {
    showError('Masukkan jumlah yang valid (> 0).'); inputAmount.focus(); return;
  }
  clearError();

  transactions.unshift({
    id: generateId(), name: name, amount: amount,
    category: cat, type: type, date: new Date().toISOString(),
  });
  saveJSON(STORAGE_TRANSACTIONS, transactions);
  render();
  form.reset();
  selectType.value = 'expense';
  selectCat.value  = allCategories()[0].name;
}

function handleIncomeAdd() {
  var amount = parseFloat(inputIncomeAdd.value);
  if (!amount || amount <= 0 || isNaN(amount)) {
    inputIncomeAdd.focus();
    return;
  }
  transactions.unshift({
    id: generateId(), name: 'Income', amount: amount,
    category: 'Income', type: 'income', date: new Date().toISOString(),
  });
  saveJSON(STORAGE_TRANSACTIONS, transactions);
  inputIncomeAdd.value = '';
  render();
  // Brief visual feedback: flash the balance card
  balanceEl.style.transition = 'color 0s';
  setTimeout(function () { balanceEl.style.transition = ''; }, 50);
}

function handleDelete(id) {
  var items  = txList.querySelectorAll('.transaction-item');
  var target = txList.querySelector('[data-id="' + id + '"]');
  var idx    = Array.prototype.indexOf.call(items, target);
  transactions = transactions.filter(function (tx) { return tx.id !== id; });
  saveJSON(STORAGE_TRANSACTIONS, transactions);
  render();
  var newItems = txList.querySelectorAll('.transaction-item');
  if (newItems.length) {
    var nf = newItems[idx] || newItems[newItems.length - 1];
    var b  = nf.querySelector('.btn-delete');
    if (b) b.focus();
  } else {
    emptyState.focus();
  }
}

function handleClearAll() {
  if (!transactions.length) return;
  if (!confirm('Hapus semua transaksi? Tindakan ini tidak bisa dibatalkan.')) return;
  transactions = [];
  saveJSON(STORAGE_TRANSACTIONS, transactions);
  render();
}

function handleSortClick() {
  currentSort = this.getAttribute('data-sort');
  saveJSON(STORAGE_SORT, currentSort);
  syncSortButtons();
  renderList();
}

function handleAddCategory(e) {
  e.preventDefault();
  var name  = catNameInput.value.trim();
  var icon  = catIconInput.value.trim() || '🏷️';
  var color = catColorInput.value || '#14b8a6';
  if (!name) { showCatError('Nama kategori tidak boleh kosong.'); catNameInput.focus(); return; }
  if (name.length > 30) { showCatError('Nama maksimal 30 karakter.'); return; }
  var all = allCategories();
  for (var i = 0; i < all.length; i++) {
    if (all[i].name.toLowerCase() === name.toLowerCase()) {
      showCatError('Kategori ini sudah ada.'); catNameInput.focus(); return;
    }
  }
  clearCatError();
  // Custom categories store a plain emoji icon (user-typed) as `emojiIcon`
  customCats.push({ name: name, emojiIcon: icon, color: color, builtin: false });
  saveJSON(STORAGE_CATEGORIES, customCats);
  populateCategorySelects();
  renderCatList();
  catAddForm.reset();
  catColorInput.value = '#14b8a6';
}

function handleDeleteCategory(name) {
  if (!confirm('Hapus kategori "' + name + '"? Transaksi yang ada tidak terhapus.')) return;
  customCats = customCats.filter(function (c) { return c.name !== name; });
  delete budgets[name];
  saveJSON(STORAGE_CATEGORIES, customCats);
  saveJSON(STORAGE_BUDGETS, budgets);
  populateCategorySelects();
  renderCatList();
  renderBudgets();
  renderChart();
}

// ── Modal helpers ─────────────────────────────────────────

function openCatModal() {
  catModalOverlay.classList.remove('hidden');
  renderCatList();
  catNameInput.focus();
}

function closeCatModal() {
  catModalOverlay.classList.add('hidden');
  catAddForm.reset();
  catColorInput.value = '#14b8a6';
  clearCatError();
  btnOpenCatModal.focus();
}

function openEditModal(id) {
  var tx = null;
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].id === id) { tx = transactions[i]; break; }
  }
  if (!tx) return;
  editTxId.value   = id;
  editName.value   = tx.name;
  editAmount.value = tx.amount;
  editErrorMsg.textContent = '';
  editModalOverlay.classList.remove('hidden');
  editName.focus();
  editName.select();
}

function closeEditModal() {
  editModalOverlay.classList.add('hidden');
  editForm.reset();
  editErrorMsg.textContent = '';
}

function handleEditSave(e) {
  e.preventDefault();
  var id     = editTxId.value;
  var name   = editName.value.trim();
  var amount = parseFloat(editAmount.value);
  if (!name)   { editErrorMsg.textContent = 'Nama tidak boleh kosong.'; editName.focus(); return; }
  if (!amount || amount <= 0 || isNaN(amount)) {
    editErrorMsg.textContent = 'Jumlah harus > 0.'; editAmount.focus(); return;
  }
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].id === id) {
      transactions[i].name   = name;
      transactions[i].amount = amount;
      break;
    }
  }
  saveJSON(STORAGE_TRANSACTIONS, transactions);
  closeEditModal();
  render();
}

// ── Render ────────────────────────────────────────────────

function render() {
  renderSummary();
  renderList();
  renderChart();
  renderMonthlySummary();
  renderBudgets();
  renderOverallProgress();
}

// ── Summary ───────────────────────────────────────────────

function renderSummary() {
  var totalIncome = 0, totalExpense = 0;
  transactions.forEach(function (tx) {
    if (tx.type === 'income') totalIncome += tx.amount;
    else totalExpense += tx.amount;
  });
  var balance = totalIncome - totalExpense;
  balanceEl.textContent = formatRp(balance);
  incomeEl.textContent  = formatRp(totalIncome);
  expenseEl.textContent = formatRp(totalExpense);
  balanceEl.className   = 'balance-amount ' + (balance >= 0 ? 'positive' : 'negative');
}

// ── Overall Progress ──────────────────────────────────────

function renderOverallProgress() {
  var monthSpent = 0;
  transactions.forEach(function (tx) {
    if (tx.type === 'expense' && tx.date.slice(0, 7) === currentMonth) monthSpent += tx.amount;
  });
  if (budgetOverall <= 0) {
    overallProgressFill.style.width = '0%';
    overallProgressFill.style.background = 'var(--accent)';
    overallProgressPct.textContent = '—';
    overallProgressSub.textContent = 'Spent: ' + formatRp(monthSpent);
    overallProgressRem.textContent = '';
    overallProgressRem.className   = 'overall-progress-remain';
    return;
  }
  var pct    = Math.min((monthSpent / budgetOverall) * 100, 100);
  var over   = monthSpent > budgetOverall;
  var remain = budgetOverall - monthSpent;
  overallProgressFill.style.width      = pct + '%';
  overallProgressFill.style.background = pct >= 100 ? 'var(--expense)' : pct >= 75 ? 'var(--warn)' : 'var(--income)';
  overallProgressPct.textContent       = Math.round(pct) + '%';
  overallProgressSub.textContent       = formatRp(monthSpent) + ' dari ' + formatRp(budgetOverall);
  overallProgressRem.className         = 'overall-progress-remain' + (over ? ' over' : '');
  overallProgressRem.textContent       = over ? 'Over ' + formatRp(Math.abs(remain)) : 'Sisa ' + formatRp(remain);
}

// ── Transaction List ──────────────────────────────────────

function getSorted() {
  var list = transactions.slice();
  if (currentSort === 'amount-desc') list.sort(function (a, b) { return b.amount - a.amount; });
  else if (currentSort === 'amount-asc')  list.sort(function (a, b) { return a.amount - b.amount; });
  else if (currentSort === 'category')    list.sort(function (a, b) { return a.category.localeCompare(b.category); });
  else list.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  return list;
}

function renderList() {
  var existing = txList.querySelectorAll('.transaction-item');
  for (var i = 0; i < existing.length; i++) existing[i].parentNode.removeChild(existing[i]);

  var list = getSorted();

  // Apply date filter
  if (dateFilter) {
    list = list.filter(function (tx) {
      return tx.date.slice(0, 10) === dateFilter;
    });
  }

  if (!list.length) {
    emptyState.style.display = 'block';
    emptyState.textContent = dateFilter
      ? 'Tidak ada transaksi pada tanggal ini.'
      : 'Belum ada transaksi. Yuk tambahkan!';
    return;
  }
  emptyState.style.display = 'none';

  list.forEach(function (tx) {
    var meta   = getCategoryMeta(tx.category);
    var li     = document.createElement('li');
    li.className   = 'transaction-item';
    li.dataset.id  = tx.id;
    li.dataset.type = tx.type;

    var sign   = tx.type === 'income' ? '+' : '−';
    var iconBg = hexToRgba(meta.color, 0.14);
    var iconHtml = meta.svgIcon
      ? '<div class="tx-icon" style="background:' + iconBg + ';color:' + meta.color + '" aria-hidden="true">' + meta.svgIcon + '</div>'
      : '<div class="tx-icon tx-icon-emoji" style="background:' + iconBg + '" aria-hidden="true">' + escapeHtml(meta.emojiIcon || '🏷️') + '</div>';

    li.innerHTML =
      iconHtml +
      '<div class="tx-info">' +
        '<div class="tx-name" title="' + escapeHtml(tx.name) + '">' + escapeHtml(tx.name) + '</div>' +
        '<div class="tx-meta">' +
          '<span class="tx-cat">' + escapeHtml(tx.category) + '</span>' +
          '<span class="tx-sep">·</span>' +
          '<span class="tx-time">' + formatDateTime(tx.date) + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="tx-amount ' + tx.type + '" aria-label="' + (tx.type === 'income' ? 'Income' : 'Expense') + ' ' + formatRp(tx.amount) + '">' +
        sign + formatRp(tx.amount) +
      '</span>' +
      '<button class="btn-edit"   aria-label="Edit ' + escapeHtml(tx.name) + '">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<button class="btn-delete" aria-label="Hapus ' + escapeHtml(tx.name) + '">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>';

    li.querySelector('.btn-edit').addEventListener('click', function () { openEditModal(tx.id); });
    li.querySelector('.btn-delete').addEventListener('click', function () { handleDelete(tx.id); });
    txList.appendChild(li);
  });
}

function syncSortButtons() {
  for (var i = 0; i < sortBtns.length; i++) {
    var active = sortBtns[i].getAttribute('data-sort') === currentSort;
    sortBtns[i].classList.toggle('active', active);
    sortBtns[i].setAttribute('aria-pressed', String(active));
  }
}

// ── Monthly Summary ───────────────────────────────────────

function populateMonthSelect() {
  var months = {};
  transactions.forEach(function (tx) { months[tx.date.slice(0, 7)] = true; });
  months[todayMonthKey()] = true;
  var keys = Object.keys(months).sort().reverse();
  monthSelect.innerHTML = '';
  keys.forEach(function (key) {
    var opt = document.createElement('option');
    opt.value = key;
    opt.textContent = formatMonthKey(key);
    if (key === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });
}

function renderMonthlySummary() {
  populateMonthSelect();
  var monthTxs = transactions.filter(function (tx) { return tx.date.slice(0, 7) === currentMonth; });
  if (!monthTxs.length) {
    monthlyBody.innerHTML = '<p class="empty-state-inline">Belum ada data untuk bulan ini.</p>';
    return;
  }
  var income = 0, expense = 0, catTotals = {};
  monthTxs.forEach(function (tx) {
    if (tx.type === 'income') { income += tx.amount; }
    else { expense += tx.amount; catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount; }
  });
  var topCat = null, topAmt = 0;
  Object.keys(catTotals).forEach(function (cat) {
    if (catTotals[cat] > topAmt) { topAmt = catTotals[cat]; topCat = cat; }
  });
  var net = income - expense;
  var html =
    '<div class="monthly-stats">' +
      '<div class="monthly-stat-box"><div class="monthly-stat-label">Income</div><div class="monthly-stat-value income">' + formatRp(income) + '</div></div>' +
      '<div class="monthly-stat-box"><div class="monthly-stat-label">Expense</div><div class="monthly-stat-value expense">' + formatRp(expense) + '</div></div>' +
      '<div class="monthly-stat-box"><div class="monthly-stat-label">Net</div><div class="monthly-stat-value" style="color:' + (net >= 0 ? 'var(--income)' : 'var(--expense)') + '">' + formatRp(net) + '</div></div>' +
      '<div class="monthly-stat-box"><div class="monthly-stat-label">Transaksi</div><div class="monthly-stat-value neutral">' + monthTxs.length + '</div></div>' +
    '</div>';
  if (topCat) {
    var topMeta = getCategoryMeta(topCat);
    var topIconHtml = topMeta.svgIcon
      ? '<span class="top-cat-badge" style="color:' + topMeta.color + '">' + topMeta.svgIcon + '</span>'
      : '<span class="top-cat-badge">' + escapeHtml(topMeta.emojiIcon || '🏷️') + '</span>';
    html += '<div class="top-cat-row">' + topIconHtml +
      '<div class="top-cat-info"><div class="top-cat-label">Top Pengeluaran</div><div class="top-cat-name">' + escapeHtml(topCat) + '</div></div>' +
      '<span class="top-cat-amount">' + formatRp(topAmt) + '</span></div>';
  }
  monthlyBody.innerHTML = html;
}

// ── Budget ────────────────────────────────────────────────

function renderBudgets() {
  var expenseCats = allCategories().filter(function (c) { return c.name !== 'Income'; });
  budgetCatSelect.innerHTML = '';
  expenseCats.forEach(function (cat) {
    var opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = (cat.emojiIcon || '') + ' ' + cat.name;
    budgetCatSelect.appendChild(opt);
  });

  var monthExpenses = {};
  transactions.forEach(function (tx) {
    if (tx.type === 'expense' && tx.date.slice(0, 7) === currentMonth)
      monthExpenses[tx.category] = (monthExpenses[tx.category] || 0) + tx.amount;
  });

  var keys = Object.keys(budgets);
  if (!keys.length) { budgetList.innerHTML = '<p class="empty-state-inline">Belum ada budget yang diatur.</p>'; return; }

  var html = '<div class="budget-list-wrap">';
  keys.forEach(function (cat) {
    var limit = budgets[cat], spent = monthExpenses[cat] || 0;
    var pct   = Math.min((spent / limit) * 100, 100);
    var over  = spent > limit;
    var meta  = getCategoryMeta(cat);
    var fillBg = pct >= 100 ? 'var(--expense)' : pct >= 75 ? 'var(--warn)' : meta.color;
    var iconHtml = meta.svgIcon
      ? '<span style="color:' + meta.color + ';width:16px;height:16px;display:inline-flex;align-items:center">' + meta.svgIcon + '</span>'
      : '<span>' + escapeHtml(meta.emojiIcon || '🏷️') + '</span>';

    html +=
      '<div class="budget-item">' +
        '<div class="budget-item-header">' +
          '<span class="budget-cat-name">' + iconHtml + escapeHtml(cat) + '</span>' +
          '<span class="budget-amounts">' +
            (over ? '<span class="over">Over ' + formatRp(spent - limit) + '</span>' : formatRp(spent) + ' / ' + formatRp(limit)) +
          '</span>' +
        '</div>' +
        '<div class="progress-track" role="progressbar" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100" aria-label="Budget ' + escapeHtml(cat) + ' ' + Math.round(pct) + '%">' +
          '<div class="progress-fill" style="width:' + pct + '%;background:' + fillBg + '"></div>' +
        '</div>' +
      '</div>';
  });
  html += '</div>';
  budgetList.innerHTML = html;
}

// ── Category Selects ──────────────────────────────────────

function populateCategorySelects() {
  var cats = allCategories();
  var prev = selectCat.value;
  selectCat.innerHTML = '';
  cats.forEach(function (cat) {
    var opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = (cat.emojiIcon ? cat.emojiIcon + ' ' : '') + cat.name;
    selectCat.appendChild(opt);
  });
  if (prev && selectCat.querySelector('option[value="' + CSS.escape(prev) + '"]'))
    selectCat.value = prev;
}

function renderCatList() {
  catListEl.innerHTML = '';
  allCategories().forEach(function (cat) {
    var li = document.createElement('li');
    li.className = 'cat-item';
    var iconHtml = cat.svgIcon
      ? '<span class="cat-item-icon" style="color:' + cat.color + '">' + cat.svgIcon + '</span>'
      : '<span class="cat-item-icon">' + escapeHtml(cat.emojiIcon || '🏷️') + '</span>';
    li.innerHTML =
      '<span class="cat-item-swatch" style="background:' + cat.color + '"></span>' +
      iconHtml +
      '<span class="cat-item-name">' + escapeHtml(cat.name) + '</span>' +
      (cat.builtin
        ? '<span class="cat-item-badge">Bawaan</span>'
        : '<button class="btn-cat-delete" aria-label="Hapus ' + escapeHtml(cat.name) + '">' +
            '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
          '</button>');
    if (!cat.builtin) {
      li.querySelector('.btn-cat-delete').addEventListener('click', function () { handleDeleteCategory(cat.name); });
    }
    catListEl.appendChild(li);
  });
}

// ── Pie Chart ─────────────────────────────────────────────

function renderChart() {
  var ctx          = canvas.getContext('2d');
  var surfaceColor = getCssVar('--surface',  '#13161f');
  var bgColor      = getCssVar('--bg',       '#0c0e16');
  var textColor    = getCssVar('--text-1',   '#f0f2f8');
  var mutedColor   = getCssVar('--text-3',   '#7a839a');

  var totals = {};
  transactions.forEach(function (tx) {
    if (tx.type === 'expense') totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });
  var entries = Object.keys(totals).filter(function (k) { return totals[k] > 0; }).map(function (k) { return [k, totals[k]]; });
  var grand   = entries.reduce(function (s, e) { return s + e[1]; }, 0);

  var size = canvas.parentElement.clientWidth || 240;
  var dpr  = window.devicePixelRatio || 1;
  canvas.width  = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  if (!entries.length) {
    chartEmpty.style.display = 'flex'; legendEl.innerHTML = '';
    canvas.setAttribute('aria-label', 'Belum ada data pengeluaran');
    return;
  }
  chartEmpty.style.display = 'none';
  canvas.setAttribute('aria-label', 'Pie chart: ' + entries.map(function (e) { return e[0] + ' ' + ((e[1]/grand)*100).toFixed(1) + '%'; }).join(', '));

  var cx = size/2, cy = size/2, radius = size*0.42, inner = size*0.22, angle = -Math.PI/2;
  entries.forEach(function (entry) {
    var meta  = getCategoryMeta(entry[0]);
    var slice = (entry[1] / grand) * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, angle, angle + slice); ctx.closePath();
    ctx.fillStyle = meta.color; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, angle, angle + slice); ctx.closePath();
    ctx.strokeStyle = bgColor; ctx.lineWidth = 2; ctx.stroke();
    angle += slice;
  });
  ctx.beginPath(); ctx.arc(cx, cy, inner, 0, 2*Math.PI); ctx.fillStyle = surfaceColor; ctx.fill();

  var fz = Math.round(size * 0.07);
  ctx.fillStyle = textColor;
  ctx.font = 'bold ' + fz + 'px "Inter","Segoe UI",system-ui,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Expense', cx, cy - size*0.04);
  ctx.font = Math.round(size*0.055) + 'px "Inter","Segoe UI",system-ui,sans-serif';
  ctx.fillStyle = mutedColor;
  ctx.fillText(formatRpShort(grand), cx, cy + size*0.06);

  renderLegend(entries, grand);
}

function renderLegend(entries, grand) {
  legendEl.innerHTML = '';
  entries.forEach(function (entry) {
    var meta = getCategoryMeta(entry[0]);
    var pct  = ((entry[1] / grand) * 100).toFixed(1);
    var li   = document.createElement('li');
    li.className = 'legend-item';
    li.innerHTML =
      '<span class="legend-dot" style="background:' + meta.color + '"></span>' +
      '<span class="legend-name">' + escapeHtml(entry[0]) + '</span>' +
      '<span class="legend-pct">'  + pct + '%</span>' +
      '<span class="legend-amt">'  + formatRp(entry[1]) + '</span>';
    legendEl.appendChild(li);
  });
}

// ── Category helpers ──────────────────────────────────────

function allCategories() {
  return BUILTIN_CATEGORIES.concat(customCats);
}

function getCategoryMeta(name) {
  var all = allCategories();
  for (var i = 0; i < all.length; i++) if (all[i].name === name) return all[i];
  return { name: name, svgIcon: SVG_DEFAULT, color: '#14b8a6' };
}

// ── Storage ───────────────────────────────────────────────

function loadJSON(key, fallback) {
  try { var r = localStorage.getItem(key); return r !== null ? JSON.parse(r) : fallback; }
  catch (e) { return fallback; }
}
function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── Formatting helpers ────────────────────────────────────

function formatRp(value) { return 'Rp ' + rpFormatter.format(Math.abs(value)); }

function formatRpShort(value) {
  if (value >= 1000000) return 'Rp ' + (value/1000000).toFixed(1) + 'jt';
  if (value >= 1000)    return 'Rp ' + (value/1000).toFixed(0) + 'rb';
  return formatRp(value);
}

function formatDateTime(iso) {
  var d = new Date(iso);
  var date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  var time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  return date + ', ' + time;
}

function formatMonthKey(key) {
  return new Date(key + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function todayMonthKey() {
  var n = new Date();
  return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2);
}

function getCssVar(name, fallback) {
  var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// ── UUID ──────────────────────────────────────────────────

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  var buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40; buf[8] = (buf[8] & 0x3f) | 0x80;
  var h = Array.prototype.map.call(buf, function (b) { return ('00' + b.toString(16)).slice(-2); });
  return [h.slice(0,4).join(''), h.slice(4,6).join(''), h.slice(6,8).join(''), h.slice(8,10).join(''), h.slice(10,16).join('')].join('-');
}

// ── Misc ──────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function hexToRgba(hex, alpha) {
  var full = hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, '#$1$1$2$2$3$3');
  var r = parseInt(full.slice(1,3),16), g = parseInt(full.slice(3,5),16), b = parseInt(full.slice(5,7),16);
  return isNaN(r) ? 'rgba(128,128,128,'+alpha+')' : 'rgba('+r+','+g+','+b+','+alpha+')';
}

function showError(msg)    { errorMsg.textContent = msg; }
function clearError()      { errorMsg.textContent = ''; }
function showCatError(msg) { catErrorMsg.textContent = msg; }
function clearCatError()   { catErrorMsg.textContent = ''; }
