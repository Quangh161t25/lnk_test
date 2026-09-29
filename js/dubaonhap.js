// =============================================================================
// MODUL DỰ BÁO NHẬP HÀNG (REORDER POINT & RESTOCKING FORECAST)
// Chỉ dành riêng cho quyền ADMIN
// =============================================================================

let dubaoNhapState = {
    items: [],
    filteredItems: [],
    currentPage: 1,
    pageSize: 100,
    sortColumn: 'ton_cuoi',
    sortDirection: 'desc',
    searchQuery: '',
    statusFilter: 'ALL',
    activeModalProductId: null,
    modalSelectedMethod: 'top3',
    calculatedMap: new Map() // idSp -> calculated forecast object
};

function getDubaoNhapParams() {
    try {
        const raw = localStorage.getItem('erp_forecast_params');
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                globalLeadTime: typeof parsed.globalLeadTime === 'number' ? parsed.globalLeadTime : 7,
                globalBufferDays: typeof parsed.globalBufferDays === 'number' ? parsed.globalBufferDays : 30,
                items: parsed.items || {}
            };
        }
    } catch (e) {
        console.warn('Lỗi đọc erp_forecast_params:', e);
    }
    return {
        globalLeadTime: 7,
        globalBufferDays: 30,
        items: {}
    };
}

function saveDubaoNhapParams(params) {
    try {
        localStorage.setItem('erp_forecast_params', JSON.stringify(params));
    } catch (e) {
        console.warn('Lỗi lưu erp_forecast_params:', e);
    }
}

// ─── Lấy danh sách 12 tháng gần nhất ─────────────────────────────────────────
function getDubaoNhapLast12Months() {
    let referenceDate = new Date();
    (xuatDataRaw || []).slice(1).forEach(row => {
        const d = parseSimpleSheetDate(row[1]);
        if (!Number.isNaN(d.getTime()) && d > referenceDate) {
            referenceDate = d;
        }
    });

    const months = [];
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth(); // 0-indexed

    for (let i = 11; i >= 0; i--) {
        const targetDate = new Date(refYear, refMonth - i, 1);
        const ym = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        months.push(ym);
    }
    return months;
}

// ─── Tập hợp dữ liệu lịch sử xuất của từng sản phẩm ──────────────────────────
function getDubaoNhapProductExportMap() {
    const exportMap = new Map(); // idSpLower -> Map("YYYY-MM" -> totalQty)

    (xuatDataRaw || []).slice(1).forEach(row => {
        const idSp = (row[6] || '').toString().trim().toLowerCase();
        if (!idSp) return;

        const slg = cleanNumber(row[8]);
        if (slg <= 0) return;

        const date = parseSimpleSheetDate(row[1]);
        if (Number.isNaN(date.getTime()) || date.getTime() === 0) return;

        const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!exportMap.has(idSp)) exportMap.set(idSp, new Map());

        const monthlyMap = exportMap.get(idSp);
        monthlyMap.set(ym, (monthlyMap.get(ym) || 0) + slg);
    });

    return exportMap;
}

// ─── Tính toán dự báo cho một sản phẩm ───────────────────────────────────────
function calculateSingleProductForecast(product, stock, monthlyHistory, params, last12Months) {
    const id = (product.id || '').toString().trim();
    const name = (product.name || '').toString().trim();

    // 1. Phân tích lịch sử các tháng
    const allMonths = Array.from(monthlyHistory.entries())
        .map(([month, qty]) => ({ month, qty }))
        .sort((a, b) => b.qty - a.qty); // sắp xếp giảm dần theo số lượng

    // Top 3 tháng xuất nhiều nhất
    const top3 = allMonths.slice(0, 3);
    const top3Sum = top3.reduce((s, m) => s + m.qty, 0);
    // Chia trung bình cho 3 tháng (nếu có ít hơn 3 tháng dữ liệu thì chia cho 3 theo đúng nguyên tắc chuẩn)
    const top3Avg = top3.length > 0 ? Math.round((top3Sum / 3) * 10) / 10 : 0;

    // 12 tháng gần nhất
    let last12Sum = 0;
    last12Months.forEach(ym => {
        last12Sum += (monthlyHistory.get(ym) || 0);
    });
    const last12Avg = Math.round((last12Sum / 12) * 10) / 10;

    // Cấu hình riêng của sản phẩm này (nếu có lưu)
    const itemConfig = (params.items && params.items[id]) || {};
    const leadTime = (typeof itemConfig.leadTime === 'number' && itemConfig.leadTime >= 0)
        ? itemConfig.leadTime : params.globalLeadTime;
    const bufferDays = (typeof itemConfig.bufferDays === 'number' && itemConfig.bufferDays >= 0)
        ? itemConfig.bufferDays : params.globalBufferDays;
    // Yêu cầu: Tự động điền theo 3 tháng cao nhất (top3) làm mặc định cho tất cả sản phẩm
    let avgMethod = itemConfig.avgMethod;
    if (!avgMethod || avgMethod === 'last12') {
        avgMethod = 'top3';
    }

    let monthlyAvg = 0;
    if (avgMethod === 'manual' && typeof itemConfig.customAvg === 'number') {
        monthlyAvg = itemConfig.customAvg;
    } else if (avgMethod === 'last12') {
        monthlyAvg = last12Avg;
    } else {
        // Mặc định: top3 (3 tháng có lượng xuất cao nhất)
        avgMethod = 'top3';
        monthlyAvg = top3Avg;
    }

    // Tốc độ bán theo ngày: ASV_ngày = Trung bình tháng / 30 ngày
    const dailyRate = monthlyAvg > 0 ? monthlyAvg / 30 : 0;

    // Điểm đặt hàng lại ROP:
    // Safety Stock = ASV_ngày * thời gian bán thêm
    // ROP = (ASV_ngày * leadTime) + Safety Stock = ASV_ngày * (leadTime + bufferDays)
    const totalDaysNeeded = leadTime + bufferDays;
    const rop = dailyRate * totalDaysNeeded;
    const safetyStock = dailyRate * bufferDays;

    // Số lượng cần nhập = trung bình * (thời gian hàng về + thời gian bán thêm) - tồn cuối
    // Áp dụng: dailyRate * (leadTime + bufferDays) - stock
    let neededQty = 0;
    if (dailyRate > 0) {
        const rawNeeded = rop - stock;
        neededQty = rawNeeded > 0 ? Math.ceil(rawNeeded) : 0;
    } else if (stock < 0) {
        neededQty = Math.abs(stock);
    }

    // Ngày bán hết hàng:
    // Số ngày bán hết = Tồn cuối / ASV_ngày
    let stockoutText = '';
    let daysUntilStockout = null;
    let stockoutDate = null;

    if (stock <= 0) {
        stockoutText = 'Đã hết hàng';
        daysUntilStockout = 0;
    } else if (dailyRate <= 0) {
        stockoutText = 'Không xuất / Vô hạn';
        daysUntilStockout = 999999;
    } else {
        daysUntilStockout = stock / dailyRate;
        const targetMs = Date.now() + daysUntilStockout * 86400000;
        stockoutDate = new Date(targetMs);
        const remainingDaysInt = Math.floor(daysUntilStockout);
        stockoutText = `${formatDubaoDate(stockoutDate)} (còn ${remainingDaysInt} ngày)`;
    }

    // Ngày cần đặt hàng:
    // Số ngày còn lại đến khi đặt hàng = (Tồn kho hiện tại - Safety Stock) / ASV_ngày - Lead Time
    // = (Tồn kho / ASV_ngày) - bufferDays - leadTime
    let reorderText = '';
    let daysUntilReorder = null;
    let reorderDate = null;
    let urgencyStatus = 'SAFE'; // 'URGENT' | 'WARNING' | 'SAFE' | 'OUT_OF_STOCK'

    if (stock <= 0) {
        urgencyStatus = 'OUT_OF_STOCK';
        reorderText = 'CẦN ĐẶT NGAY!';
        daysUntilReorder = -999;
    } else if (dailyRate <= 0) {
        urgencyStatus = 'SAFE';
        reorderText = 'Chưa cần đặt';
        daysUntilReorder = 999999;
    } else {
        daysUntilReorder = ((stock - safetyStock) / dailyRate) - leadTime;
        if (daysUntilReorder <= 0) {
            urgencyStatus = 'URGENT';
            const overdue = Math.abs(Math.floor(daysUntilReorder));
            reorderText = overdue > 0 ? `CẦN ĐẶT NGAY! (Quá ${overdue} ngày)` : 'CẦN ĐẶT NGAY!';
            reorderDate = new Date();
        } else if (daysUntilReorder <= 7) {
            urgencyStatus = 'WARNING';
            const targetMs = Date.now() + daysUntilReorder * 86400000;
            reorderDate = new Date(targetMs);
            const remainingDaysInt = Math.ceil(daysUntilReorder);
            reorderText = `${formatDubaoDate(reorderDate)} (còn ${remainingDaysInt} ngày)`;
        } else {
            urgencyStatus = 'SAFE';
            const targetMs = Date.now() + daysUntilReorder * 86400000;
            reorderDate = new Date(targetMs);
            const remainingDaysInt = Math.ceil(daysUntilReorder);
            reorderText = `${formatDubaoDate(reorderDate)} (còn ${remainingDaysInt} ngày)`;
        }
    }

    return {
        id,
        name,
        stock,
        ton_cuoi: stock,
        monthlyAvg: Math.round(monthlyAvg * 10) / 10,
        dailyRate: Math.round(dailyRate * 100) / 100,
        leadTime,
        bufferDays,
        neededQty,
        sl_can_nhap: neededQty,
        rop: Math.round(rop),
        safetyStock: Math.round(safetyStock),
        stockoutText,
        stockoutDate,
        daysUntilStockout,
        reorderText,
        reorderDate,
        daysUntilReorder,
        urgencyStatus,
        avgMethod,
        top3,
        top3Sum,
        top3Avg,
        last12Sum,
        last12Avg,
        monthlyHistory
    };
}

function formatDubaoDate(date) {
    if (!date || Number.isNaN(date.getTime())) return '-';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// ─── Render chính của module Dự báo nhập hàng ───────────────────────────────
async function renderDubaoNhapModule(resetPage = false, forceRefresh = false) {
    if (resetPage) dubaoNhapState.currentPage = 1;

    // Kiểm tra quyền: chỉ ADMIN mới được truy cập
    if (!currentUser || currentUser.role !== 'ADMIN') {
        const container = document.getElementById('module-dubaonhap');
        if (container) {
            container.innerHTML = `
                <div class="p-12 text-center text-slate-500">
                    <div class="text-4xl mb-3">🔒</div>
                    <h3 class="text-base font-bold text-slate-700 mb-1">Chức năng chỉ dành cho Quản trị viên (ADMIN)</h3>
                    <p class="text-xs text-slate-400">Tài khoản của bạn không có quyền xem thông tin Dự báo nhập hàng.</p>
                </div>
            `;
        }
        return;
    }

    const tbody = document.getElementById('dubaonhapTableBody');
    if (!tbody) return;

    if (forceRefresh || !productDataRaw.length || !warehouseProductDataRaw.length || !nhapDataRaw.length || !xuatDataRaw.length || !transferDataRaw.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="px-4 py-12 text-center text-slate-400">Đang đồng bộ dữ liệu kho & danh sách xuất...</td></tr>`;
        await Promise.all([
            fetchSimpleSheetModule('sanpham'),
            fetchSimpleSheetModule('sanphamkho'),
            fetchSimpleSheetModule('nhap'),
            fetchSimpleSheetModule('xuat'),
            fetchSimpleSheetModule('chuyenkho')
        ]);
    }

    const params = getDubaoNhapParams();
    const globalLeadInput = document.getElementById('dubaonhapGlobalLeadTime');
    const globalBufferInput = document.getElementById('dubaonhapGlobalBufferDays');
    if (globalLeadInput) globalLeadInput.value = params.globalLeadTime;
    if (globalBufferInput) globalBufferInput.value = params.globalBufferDays;

    // Lấy tồn cuối theo getProductAggregates
    const aggregates = getProductAggregates();
    const exportMap = getDubaoNhapProductExportMap();
    const last12Months = getDubaoNhapLast12Months();

    // Lấy danh mục sản phẩm từ productDataRaw hoặc getProductCatalog()
    const catalog = getProductCatalog();
    const calculatedItems = [];
    dubaoNhapState.calculatedMap.clear();

    catalog.forEach(prod => {
        const idLower = (prod.id || '').toLowerCase();
        const agg = aggregates.get(idLower) || { tonDau: 0, nhap: 0, xuat: 0, tonCuoi: 0 };
        const history = exportMap.get(idLower) || new Map();
        const forecast = calculateSingleProductForecast(prod, agg.tonCuoi, history, params, last12Months);
        calculatedItems.push(forecast);
        dubaoNhapState.calculatedMap.set(prod.id, forecast);
    });

    dubaoNhapState.items = calculatedItems;
    applyDubaoNhapFilters(resetPage);
}

// ─── Lọc & Sắp xếp dữ liệu ──────────────────────────────────────────────────
function applyDubaoNhapFilters(resetPage = false) {
    if (resetPage) dubaoNhapState.currentPage = 1;

    const searchInput = document.getElementById('dubaonhapSearchInput');
    const statusSelect = document.getElementById('dubaonhapFilterStatus');

    const query = searchInput ? (searchInput.value || '').trim().toLowerCase() : '';
    const status = statusSelect ? statusSelect.value : 'ALL';

    dubaoNhapState.searchQuery = query;
    dubaoNhapState.statusFilter = status;

    let filtered = dubaoNhapState.items.filter(item => {
        if (query) {
            const matchId = item.id.toLowerCase().includes(query);
            const matchName = item.name.toLowerCase().includes(query);
            if (!matchId && !matchName) return false;
        }

        if (status === 'URGENT') {
            return item.urgencyStatus === 'URGENT' || item.urgencyStatus === 'OUT_OF_STOCK';
        }
        if (status === 'WARNING') {
            return item.urgencyStatus === 'WARNING';
        }
        if (status === 'SAFE') {
            return item.urgencyStatus === 'SAFE';
        }
        if (status === 'OUT_OF_STOCK') {
            return item.stock <= 0;
        }
        if (status === 'NEED_ORDER') {
            return item.neededQty > 0;
        }

        return true;
    });

    // Sắp xếp
    const col = dubaoNhapState.sortColumn;
    const dir = dubaoNhapState.sortDirection === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];

        if (col === 'ton_cuoi' || col === 'stock') {
            valA = a.stock ?? 0;
            valB = b.stock ?? 0;
        } else if (col === 'sl_can_nhap' || col === 'neededQty') {
            valA = a.neededQty ?? 0;
            valB = b.neededQty ?? 0;
        } else if (col === 'ngay_het_hang') {
            valA = a.daysUntilStockout ?? 999999;
            valB = b.daysUntilStockout ?? 999999;
        } else if (col === 'ngay_dat_hang') {
            valA = a.daysUntilReorder ?? 999999;
            valB = b.daysUntilReorder ?? 999999;
        }

        if (typeof valA === 'string') {
            return valA.localeCompare(valB || '', 'vi') * dir;
        }
        return ((valA || 0) - (valB || 0)) * dir;
    });

    dubaoNhapState.filteredItems = filtered;
    updateDubaoNhapKPIs();
    renderDubaoNhapTable();
}

function updateDubaoNhapKPIs() {
    const totalEl = document.getElementById('dubaonhapStatTotal');
    const urgentEl = document.getElementById('dubaonhapStatUrgent');
    const warningEl = document.getElementById('dubaonhapStatWarning');
    const totalNeededEl = document.getElementById('dubaonhapStatTotalNeeded');

    const totalCount = dubaoNhapState.items.length;
    let urgentCount = 0;
    let warningCount = 0;
    let totalNeeded = 0;

    dubaoNhapState.items.forEach(item => {
        if (item.urgencyStatus === 'URGENT' || item.urgencyStatus === 'OUT_OF_STOCK') urgentCount++;
        if (item.urgencyStatus === 'WARNING') warningCount++;
        if (item.neededQty > 0) totalNeeded += item.neededQty;
    });

    if (totalEl) totalEl.textContent = totalCount.toLocaleString('vi-VN');
    if (urgentEl) urgentEl.textContent = urgentCount.toLocaleString('vi-VN');
    if (warningEl) warningEl.textContent = warningCount.toLocaleString('vi-VN');
    if (totalNeededEl) totalNeededEl.textContent = totalNeeded.toLocaleString('vi-VN') + ' sp';
}

function renderDubaoNhapTable() {
    const tbody = document.getElementById('dubaonhapTableBody');
    const mobileCards = document.getElementById('dubaonhapMobileCards');
    const pagination = document.getElementById('dubaonhapPagination');
    if (!tbody) return;

    updateDubaoNhapSortHeaders();

    const items = dubaoNhapState.filteredItems;
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="px-4 py-12 text-center text-slate-400">Không tìm thấy sản phẩm nào phù hợp điều kiện lọc.</td></tr>`;
        if (mobileCards) mobileCards.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Không có dữ liệu phù hợp.</div>`;
        if (pagination) pagination.innerHTML = '';
        return;
    }

    const page = dubaoNhapState.currentPage;
    const pageSize = dubaoNhapState.pageSize;
    const startIndex = (page - 1) * pageSize;
    const pageItems = items.slice(startIndex, startIndex + pageSize);

    // Desktop table rows
    tbody.innerHTML = pageItems.map((item, idx) => {
        const stt = startIndex + idx + 1;
        const methodBadge = getAvgMethodBadge(item.avgMethod, item.dailyRate);
        const statusBadge = getUrgencyStatusBadge(item.urgencyStatus);
        const stockClass = item.stock <= 0 ? 'text-rose-600 font-bold' : (item.stock < item.rop ? 'text-amber-600 font-semibold' : 'text-slate-700');
        const neededBadge = item.neededQty > 0
            ? `<span class="inline-block px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200 text-xs">+${item.neededQty.toLocaleString('vi-VN')}</span>`
            : `<span class="text-slate-400 font-medium">0</span>`;

        return `
            <tr class="hover:bg-purple-50/40 transition-colors border-b border-slate-100">
                <td class="px-3 py-3 text-center text-slate-400 font-medium">${stt}</td>
                <td class="px-3 py-3 font-bold text-slate-800 whitespace-nowrap">${escAttr(item.id)}</td>
                <td class="px-4 py-3 font-medium text-slate-700 min-w-[200px]">${escAttr(item.name)}</td>
                <td class="px-3 py-3 text-right whitespace-nowrap ${stockClass}">${item.stock.toLocaleString('vi-VN')}</td>
                <td class="px-3 py-3">
                    <div class="flex items-center justify-center gap-1.5">
                        <input type="number" step="any" min="0" value="${item.monthlyAvg}"
                            onchange="updateDubaoNhapRowAvg('${escAttr(item.id)}', this.value)"
                            title="Tốc độ bán trung bình tháng. Bạn có thể tự điền hoặc click nút 📊 bên cạnh để xem 3 tháng cao nhất & 12 tháng gần nhất"
                            class="w-20 px-2 py-1 text-right text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                        <button onclick="openDubaoNhapModal('${escAttr(item.id)}')"
                            title="Xem chi tiết xuất: Top 3 tháng cao nhất & TB 12 tháng gần nhất"
                            class="p-1 rounded-lg bg-purple-50 hover:bg-purple-200 text-purple-700 border border-purple-200 transition">
                            📊
                        </button>
                    </div>
                    <div class="text-center mt-1">${methodBadge}</div>
                </td>
                <td class="px-3 py-3 text-center">
                    <input type="number" min="0" value="${item.bufferDays}"
                        onchange="updateDubaoNhapRowBuffer('${escAttr(item.id)}', this.value)"
                        title="Thời gian bán thêm / tồn kho an toàn (ngày)"
                        class="w-16 px-1.5 py-1 text-center text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                </td>
                <td class="px-3 py-3 text-center">
                    <input type="number" min="0" value="${item.leadTime}"
                        onchange="updateDubaoNhapRowLead('${escAttr(item.id)}', this.value)"
                        title="Thời gian hàng về từ nhà cung cấp (ngày)"
                        class="w-16 px-1.5 py-1 text-center text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">${neededBadge}</td>
                <td class="px-3 py-3 text-center whitespace-nowrap text-slate-600">${item.stockoutText}</td>
                <td class="px-3 py-3 text-center whitespace-nowrap">${renderReorderCell(item)}</td>
                <td class="px-3 py-3 text-center whitespace-nowrap">${statusBadge}</td>
            </tr>
        `;
    }).join('');

    // Mobile Cards
    if (mobileCards) {
        mobileCards.innerHTML = pageItems.map(item => {
            const methodBadge = getAvgMethodBadge(item.avgMethod, item.dailyRate);
            const statusBadge = getUrgencyStatusBadge(item.urgencyStatus);
            return `
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2 text-xs">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <span class="font-bold text-slate-800">${escAttr(item.id)}</span>
                            <span class="text-slate-500 ml-1">· ${escAttr(item.name)}</span>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span class="text-slate-400">Tồn cuối:</span> <strong class="${item.stock <= 0 ? 'text-rose-600' : 'text-slate-800'}">${item.stock.toLocaleString('vi-VN')}</strong></div>
                        <div><span class="text-slate-400">Cần nhập:</span> <strong class="text-purple-700 font-bold">${item.neededQty > 0 ? '+' + item.neededQty.toLocaleString('vi-VN') : '0'}</strong></div>
                        <div><span class="text-slate-400">Hàng về / Bán thêm:</span> ${item.leadTime}d / ${item.bufferDays}d</div>
                        <div><span class="text-slate-400">TB bán:</span> ${item.monthlyAvg}/thg ${methodBadge}</div>
                    </div>
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span class="text-slate-500 text-[11px]">${item.stockoutText}</span>
                        <button onclick="openDubaoNhapModal('${escAttr(item.id)}')" class="px-2.5 py-1 bg-purple-50 text-purple-700 rounded font-semibold text-[11px]">Chi tiết xuất 📊</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Pagination (100 sản phẩm / trang)
    renderDubaoNhapPagination(items.length, page, 'dubaonhapPagination');
}

function getAvgMethodBadge(method, dailyRate) {
    const dailyStr = `~${dailyRate}/d`;
    if (method === 'top3') {
        return `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Top 3 (${dailyStr})</span>`;
    }
    if (method === 'manual') {
        return `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Tự điền (${dailyStr})</span>`;
    }
    return `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">12 Tháng (${dailyStr})</span>`;
}

function getUrgencyStatusBadge(status) {
    if (status === 'OUT_OF_STOCK') {
        return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Hết hàng</span>`;
    }
    if (status === 'URGENT') {
        return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cần đặt ngay</span>`;
    }
    if (status === 'WARNING') {
        return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Sắp đến hạn</span>`;
    }
    return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">An toàn</span>`;
}

function renderReorderCell(item) {
    if (item.urgencyStatus === 'OUT_OF_STOCK' || item.urgencyStatus === 'URGENT') {
        return `<span class="px-2 py-1 rounded-md bg-rose-100 text-rose-800 font-bold text-xs inline-block animate-pulse shadow-sm">🚨 ${escAttr(item.reorderText)}</span>`;
    }
    if (item.urgencyStatus === 'WARNING') {
        return `<span class="px-2 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold text-xs inline-block border border-amber-200">⚠️ ${escAttr(item.reorderText)}</span>`;
    }
    return `<span class="text-slate-600 text-xs">${escAttr(item.reorderText)}</span>`;
}

function renderDubaoNhapPagination(totalItems, currentPage, containerId) {
    const pageSize = dubaoNhapState.pageSize || 100;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div class="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
                <span>Hiển thị <strong>${totalItems}</strong> / ${totalItems} sản phẩm (${pageSize} sp/trang)</span>
            </div>
        `;
        return;
    }

    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    container.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
            <span class="text-slate-500">
                Hiển thị <strong class="text-slate-800">${start}-${end}</strong> trên tổng số <strong class="text-slate-800">${totalItems}</strong> sản phẩm (${pageSize} sp/trang)
            </span>
            <div class="flex items-center gap-1.5">
                <button onclick="goDubaoNhapPage(1)" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-100 bg-white'}" ${currentPage === 1 ? 'disabled' : ''} title="Trang đầu">«</button>
                <button onclick="goDubaoNhapPage(${currentPage - 1})" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-100 bg-white'}" ${currentPage === 1 ? 'disabled' : ''} title="Trang trước">‹ Trước</button>
                <span class="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">Trang ${currentPage} / ${totalPages}</span>
                <button onclick="goDubaoNhapPage(${currentPage + 1})" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-100 bg-white'}" ${currentPage === totalPages ? 'disabled' : ''} title="Trang sau">Sau ›</button>
                <button onclick="goDubaoNhapPage(${totalPages})" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-100 bg-white'}" ${currentPage === totalPages ? 'disabled' : ''} title="Trang cuối">»</button>
            </div>
        </div>
    `;
}

function goDubaoNhapPage(page) {
    const totalPages = Math.max(1, Math.ceil(dubaoNhapState.filteredItems.length / dubaoNhapState.pageSize));
    let target = page;
    if (target < 1) target = 1;
    if (target > totalPages) target = totalPages;
    dubaoNhapState.currentPage = target;
    renderDubaoNhapTable();
    const tableWrap = document.getElementById('dubaonhapTableBody')?.parentElement?.parentElement;
    if (tableWrap) tableWrap.scrollTop = 0;
}

function sortDubaoNhap(column) {
    if (dubaoNhapState.sortColumn === column) {
        dubaoNhapState.sortDirection = dubaoNhapState.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        dubaoNhapState.sortColumn = column;
        dubaoNhapState.sortDirection = ['id', 'ten_sp'].includes(column) ? 'asc' : 'desc';
    }
    applyDubaoNhapFilters(true);
}

function updateDubaoNhapSortHeaders() {
    ['id', 'ten_sp', 'ton_cuoi', 'sl_can_nhap', 'ngay_het_hang', 'ngay_dat_hang'].forEach(c => {
        const el = document.getElementById(`dubaonhapSort_${c}`);
        if (!el) return;
        if (dubaoNhapState.sortColumn === c) {
            el.textContent = dubaoNhapState.sortDirection === 'asc' ? ' ▲' : ' ▼';
            el.className = 'text-purple-600 font-bold';
        } else {
            el.textContent = '';
        }
    });
}

// ─── Inline Cell Edits ───────────────────────────────────────────────────────
function updateDubaoNhapRowAvg(idSp, value) {
    const num = Math.max(0, cleanNumber(value));
    const params = getDubaoNhapParams();
    if (!params.items[idSp]) params.items[idSp] = {};
    params.items[idSp].customAvg = num;
    params.items[idSp].avgMethod = 'manual';
    saveDubaoNhapParams(params);
    renderDubaoNhapModule(false, false);
}

function updateDubaoNhapRowBuffer(idSp, value) {
    const num = Math.max(0, parseInt(value, 10) || 0);
    const params = getDubaoNhapParams();
    if (!params.items[idSp]) params.items[idSp] = {};
    params.items[idSp].bufferDays = num;
    saveDubaoNhapParams(params);
    renderDubaoNhapModule(false, false);
}

function updateDubaoNhapRowLead(idSp, value) {
    const num = Math.max(0, parseInt(value, 10) || 0);
    const params = getDubaoNhapParams();
    if (!params.items[idSp]) params.items[idSp] = {};
    params.items[idSp].leadTime = num;
    saveDubaoNhapParams(params);
    renderDubaoNhapModule(false, false);
}

// ─── Cài đặt nhanh Toolbar ──────────────────────────────────────────────────
function applyGlobalDubaoNhapDays() {
    const leadInput = document.getElementById('dubaonhapGlobalLeadTime');
    const bufferInput = document.getElementById('dubaonhapGlobalBufferDays');
    const leadTime = Math.max(0, parseInt(leadInput ? leadInput.value : 7, 10) || 7);
    const bufferDays = Math.max(0, parseInt(bufferInput ? bufferInput.value : 30, 10) || 30);

    const params = getDubaoNhapParams();
    params.globalLeadTime = leadTime;
    params.globalBufferDays = bufferDays;

    // Cập nhật đè lên tất cả sản phẩm
    Object.keys(params.items).forEach(id => {
        params.items[id].leadTime = leadTime;
        params.items[id].bufferDays = bufferDays;
    });

    saveDubaoNhapParams(params);
    alert(`Đã áp dụng: Hàng về = ${leadTime} ngày, Bán thêm = ${bufferDays} ngày cho toàn bộ sản phẩm!`);
    renderDubaoNhapModule(false, false);
}

function applyDubaoNhapBatchAvg(method) {
    const methodName = method === 'top3' ? 'Top 3 tháng xuất nhiều nhất' : 'Trung bình 12 tháng gần nhất';
    if (!confirm(`Bạn có chắc chắn muốn đặt phương pháp tính trung bình bán cho TẤT CẢ sản phẩm thành "${methodName}"?`)) {
        return;
    }

    const params = getDubaoNhapParams();
    dubaoNhapState.items.forEach(item => {
        if (!params.items[item.id]) params.items[item.id] = {};
        params.items[item.id].avgMethod = method;
    });

    saveDubaoNhapParams(params);
    renderDubaoNhapModule(false, false);
}

// ─── Modal Chi tiết xuất & Lựa chọn phương pháp ─────────────────────────────
function openDubaoNhapModal(idSp) {
    const item = dubaoNhapState.calculatedMap.get(idSp);
    if (!item) return;

    dubaoNhapState.activeModalProductId = idSp;
    dubaoNhapState.modalSelectedMethod = item.avgMethod || 'last12';

    const titleEl = document.getElementById('dubaonhapModalTitle');
    const subtitleEl = document.getElementById('dubaonhapModalSubtitle');
    if (titleEl) titleEl.textContent = `Chi tiết tốc độ bán: ${item.name} (${item.id})`;
    if (subtitleEl) subtitleEl.textContent = `Tồn hiện tại: ${item.stock.toLocaleString('vi-VN')} · Hàng về: ${item.leadTime} ngày · Bán thêm: ${item.bufferDays} ngày`;

    // 1. Top 3
    const top3Val = document.getElementById('modalTop3AvgValue');
    const top3Daily = document.getElementById('modalTop3DailyValue');
    const top3List = document.getElementById('modalTop3MonthsList');
    if (top3Val) top3Val.textContent = `${item.top3Avg.toLocaleString('vi-VN')} sp/tháng`;
    if (top3Daily) top3Daily.textContent = `~${(item.top3Avg / 30).toFixed(2)} sp/ngày`;

    if (top3List) {
        if (item.top3 && item.top3.length > 0) {
            top3List.innerHTML = item.top3.map((m, idx) => `
                <div class="flex items-center justify-between">
                    <span>Tháng ${m.month}:</span>
                    <strong>${m.qty.toLocaleString('vi-VN')} sp</strong>
                </div>
            `).join('') + `<div class="pt-1 mt-1 border-t border-slate-200 font-bold text-slate-700 flex justify-between">
                <span>Tổng 3 tháng:</span>
                <span>${item.top3Sum.toLocaleString('vi-VN')} sp</span>
            </div>`;
        } else {
            top3List.innerHTML = `<span class="text-slate-400 italic">Chưa có lịch sử xuất</span>`;
        }
    }

    // 2. Last 12 months
    const last12Val = document.getElementById('modalLast12AvgValue');
    const last12Daily = document.getElementById('modalLast12DailyValue');
    const last12Details = document.getElementById('modalLast12Details');
    if (last12Val) last12Val.textContent = `${item.last12Avg.toLocaleString('vi-VN')} sp/tháng`;
    if (last12Daily) last12Daily.textContent = `~${(item.last12Avg / 30).toFixed(2)} sp/ngày`;
    if (last12Details) {
        last12Details.innerHTML = `
            <div class="flex justify-between">
                <span>Tổng xuất 12 tháng:</span>
                <strong>${item.last12Sum.toLocaleString('vi-VN')} sp</strong>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">Lấy tổng 12 tháng gần nhất chia cho 12</div>
        `;
    }

    // 3. Manual
    const manualInput = document.getElementById('modalManualInput');
    const manualDaily = document.getElementById('modalManualDailyValue');
    if (manualInput) manualInput.value = item.monthlyAvg;
    if (manualDaily) manualDaily.textContent = `~${(item.monthlyAvg / 30).toFixed(2)} sp/ngày`;

    selectModalAvgMethod(dubaoNhapState.modalSelectedMethod);

    // 4. Full monthly history table
    const historyTbody = document.getElementById('modalHistoryTableBody');
    const countEl = document.getElementById('modalExportCount');

    const top3MonthsSet = new Set(item.top3.map(m => m.month));
    const sortedAllMonths = Array.from(item.monthlyHistory.entries())
        .map(([month, qty]) => ({ month, qty }))
        .sort((a, b) => b.month.localeCompare(a.month)); // sắp xếp tháng mới nhất lên trước

    if (countEl) countEl.textContent = `${sortedAllMonths.length} tháng ghi nhận xuất`;

    if (historyTbody) {
        if (sortedAllMonths.length === 0) {
            historyTbody.innerHTML = `<tr><td colspan="4" class="px-4 py-6 text-center text-slate-400">Sản phẩm này chưa phát sinh đơn xuất trong hệ thống.</td></tr>`;
        } else {
            historyTbody.innerHTML = sortedAllMonths.map(row => {
                const isTop3 = top3MonthsSet.has(row.month);
                const daily = (row.qty / 30).toFixed(1);
                return `
                    <tr class="hover:bg-slate-50 ${isTop3 ? 'bg-amber-50/50 font-semibold' : ''}">
                        <td class="px-4 py-2 font-medium">${row.month}</td>
                        <td class="px-4 py-2 text-right">${row.qty.toLocaleString('vi-VN')}</td>
                        <td class="px-4 py-2 text-right text-slate-500">~${daily}</td>
                        <td class="px-4 py-2 text-center">
                            ${isTop3 ? '<span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">Top 3 xuất nhiều ⭐</span>' : '-'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    const modal = document.getElementById('dubaonhapModal');
    if (modal) modal.classList.remove('hidden');
}

function selectModalAvgMethod(method) {
    dubaoNhapState.modalSelectedMethod = method;

    const radioTop3 = document.getElementById('modalRadioTop3');
    const radioLast12 = document.getElementById('modalRadioLast12');
    const radioManual = document.getElementById('modalRadioManual');

    if (radioTop3) radioTop3.checked = method === 'top3';
    if (radioLast12) radioLast12.checked = method === 'last12';
    if (radioManual) radioManual.checked = method === 'manual';

    const cardTop3 = document.getElementById('modalOptTop3Card');
    const cardLast12 = document.getElementById('modalOptLast12Card');
    const cardManual = document.getElementById('modalOptManualCard');

    [cardTop3, cardLast12, cardManual].forEach(c => {
        if (c) c.classList.remove('border-purple-600', 'ring-2', 'ring-purple-500/20', 'bg-purple-50/20');
    });

    const activeCard = method === 'top3' ? cardTop3 : (method === 'last12' ? cardLast12 : cardManual);
    if (activeCard) {
        activeCard.classList.add('border-purple-600', 'ring-2', 'ring-purple-500/20', 'bg-purple-50/20');
    }
}

function updateModalManualDaily() {
    const input = document.getElementById('modalManualInput');
    const daily = document.getElementById('modalManualDailyValue');
    const val = cleanNumber(input ? input.value : 0);
    if (daily) daily.textContent = `~${(val / 30).toFixed(2)} sp/ngày`;
    selectModalAvgMethod('manual');
}

function closeDubaoNhapModal() {
    const modal = document.getElementById('dubaonhapModal');
    if (modal) modal.classList.add('hidden');
}

function saveModalDubaoNhapSelection() {
    const idSp = dubaoNhapState.activeModalProductId;
    if (!idSp) return;

    const method = dubaoNhapState.modalSelectedMethod;
    const manualInput = document.getElementById('modalManualInput');
    const customAvg = Math.max(0, cleanNumber(manualInput ? manualInput.value : 0));

    const params = getDubaoNhapParams();
    if (!params.items[idSp]) params.items[idSp] = {};
    params.items[idSp].avgMethod = method;
    if (method === 'manual') {
        params.items[idSp].customAvg = customAvg;
    }

    saveDubaoNhapParams(params);
    closeDubaoNhapModal();
    renderDubaoNhapModule(false, false);
}

// ─── Xuất file Excel dự báo nhập hàng (SheetJS) ─────────────────────────────
function downloadDubaoNhapExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Thư viện Excel (SheetJS) chưa sẵn sàng. Vui lòng thử lại sau.");
        return;
    }

    const items = dubaoNhapState.filteredItems;
    if (!items || items.length === 0) {
        alert("Không có dữ liệu để xuất Excel.");
        return;
    }

    const exportRows = items.map((item, index) => {
        const methodText = item.avgMethod === 'top3' ? 'Top 3 tháng cao nhất' : (item.avgMethod === 'manual' ? 'Tự điền' : '12 tháng gần nhất');
        const statusText = item.urgencyStatus === 'OUT_OF_STOCK'
            ? 'Hết hàng'
            : (item.urgencyStatus === 'URGENT' ? 'Cần đặt ngay' : (item.urgencyStatus === 'WARNING' ? 'Sắp đến hạn' : 'An toàn'));

        return {
            "STT": index + 1,
            "Mã sản phẩm": item.id,
            "Tên sản phẩm": item.name,
            "Tồn cuối hiện tại": item.stock,
            "Tốc độ bán TB (sp/tháng)": item.monthlyAvg,
            "Tốc độ bán ngày (sp/ngày)": item.dailyRate,
            "Phương pháp tính TB": methodText,
            "Thời gian bán thêm (ngày)": item.bufferDays,
            "Thời gian hàng về (ngày)": item.leadTime,
            "Điểm đặt hàng lại (ROP)": item.rop,
            "Số lượng cần nhập": item.neededQty,
            "Ngày bán hết hàng": item.stockoutText,
            "Ngày cần đặt hàng": item.reorderText,
            "Trạng thái": statusText
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DuBaoNhapHang");

    // Tự căn chỉnh độ rộng cột
    const colWidths = [
        { wch: 6 },  // STT
        { wch: 14 }, // Mã SP
        { wch: 32 }, // Tên SP
        { wch: 16 }, // Tồn cuối
        { wch: 22 }, // TB tháng
        { wch: 22 }, // TB ngày
        { wch: 22 }, // Phương pháp
        { wch: 22 }, // Bán thêm
        { wch: 22 }, // Hàng về
        { wch: 20 }, // ROP
        { wch: 18 }, // Cần nhập
        { wch: 26 }, // Ngày hết hàng
        { wch: 28 }, // Ngày đặt hàng
        { wch: 16 }  // Trạng thái
    ];
    worksheet['!cols'] = colWidths;

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const filename = `Du_Bao_Nhap_Hang_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);
}
