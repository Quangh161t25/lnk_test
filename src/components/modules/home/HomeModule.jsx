import React, { useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { MODULE_DEFINITIONS } from '../../../config/constants';
import { calculateProductAggregates } from '../../../utils/calculations';
import { formatNumber, cleanNumber, formatDateVN } from '../../../utils/formatters';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  BarChart3,
  CalendarClock,
  Warehouse,
  Building2,
  Scale,
  Users,
  UserCheck,
  Settings,
  Sparkles,
  ArrowRight,
  Compass
} from 'lucide-react';

const MODULE_ICON_MAP = {
  Home: Compass,
  BarChart3,
  ArrowDownToLine,
  CalendarClock,
  ArrowUpFromLine,
  ArrowLeftRight,
  Package,
  Warehouse,
  Building2,
  Scale,
  Users,
  UserCheck,
  TrendingUp,
  Settings
};

const MODULE_COLOR_THEMES = {
  indigo: {
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-300',
    hoverShadow: 'hover:shadow-indigo-100/60',
    text: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
    iconBg: 'bg-indigo-100 text-indigo-600',
    btnHover: 'group-hover:bg-indigo-600 group-hover:text-white'
  },
  blue: {
    bg: 'bg-blue-50/80',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-300',
    hoverShadow: 'hover:shadow-blue-100/60',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-100 text-blue-600',
    btnHover: 'group-hover:bg-blue-600 group-hover:text-white'
  },
  amber: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-100',
    hoverBorder: 'hover:border-amber-300',
    hoverShadow: 'hover:shadow-amber-100/60',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-100 text-amber-600',
    btnHover: 'group-hover:bg-amber-600 group-hover:text-white'
  },
  orange: {
    bg: 'bg-orange-50/80',
    border: 'border-orange-100',
    hoverBorder: 'hover:border-orange-300',
    hoverShadow: 'hover:shadow-orange-100/60',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    iconBg: 'bg-orange-100 text-orange-600',
    btnHover: 'group-hover:bg-orange-600 group-hover:text-white'
  },
  cyan: {
    bg: 'bg-cyan-50/80',
    border: 'border-cyan-100',
    hoverBorder: 'hover:border-cyan-300',
    hoverShadow: 'hover:shadow-cyan-100/60',
    text: 'text-cyan-600',
    badge: 'bg-cyan-100 text-cyan-700',
    iconBg: 'bg-cyan-100 text-cyan-600',
    btnHover: 'group-hover:bg-cyan-600 group-hover:text-white'
  },
  emerald: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-100',
    hoverBorder: 'hover:border-emerald-300',
    hoverShadow: 'hover:shadow-emerald-100/60',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
    btnHover: 'group-hover:bg-emerald-600 group-hover:text-white'
  },
  teal: {
    bg: 'bg-teal-50/80',
    border: 'border-teal-100',
    hoverBorder: 'hover:border-teal-300',
    hoverShadow: 'hover:shadow-teal-100/60',
    text: 'text-teal-600',
    badge: 'bg-teal-100 text-teal-700',
    iconBg: 'bg-teal-100 text-teal-600',
    btnHover: 'group-hover:bg-teal-600 group-hover:text-white'
  },
  rose: {
    bg: 'bg-rose-50/80',
    border: 'border-rose-100',
    hoverBorder: 'hover:border-rose-300',
    hoverShadow: 'hover:shadow-rose-100/60',
    text: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700',
    iconBg: 'bg-rose-100 text-rose-600',
    btnHover: 'group-hover:bg-rose-600 group-hover:text-white'
  },
  sky: {
    bg: 'bg-sky-50/80',
    border: 'border-sky-100',
    hoverBorder: 'hover:border-sky-300',
    hoverShadow: 'hover:shadow-sky-100/60',
    text: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    iconBg: 'bg-sky-100 text-sky-600',
    btnHover: 'group-hover:bg-sky-600 group-hover:text-white'
  },
  violet: {
    bg: 'bg-violet-50/80',
    border: 'border-violet-100',
    hoverBorder: 'hover:border-violet-300',
    hoverShadow: 'hover:shadow-violet-100/60',
    text: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    iconBg: 'bg-violet-100 text-violet-600',
    btnHover: 'group-hover:bg-violet-600 group-hover:text-white'
  },
  purple: {
    bg: 'bg-purple-50/80',
    border: 'border-purple-100',
    hoverBorder: 'hover:border-purple-300',
    hoverShadow: 'hover:shadow-purple-100/60',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    iconBg: 'bg-purple-100 text-purple-600',
    btnHover: 'group-hover:bg-purple-600 group-hover:text-white'
  },
  slate: {
    bg: 'bg-slate-50/80',
    border: 'border-slate-200',
    hoverBorder: 'hover:border-slate-400',
    hoverShadow: 'hover:shadow-slate-200/60',
    text: 'text-slate-600',
    badge: 'bg-slate-200 text-slate-700',
    iconBg: 'bg-slate-200 text-slate-600',
    btnHover: 'group-hover:bg-slate-700 group-hover:text-white'
  }
};

export function HomeModule({ onNavigate }) {
  const { nhapData, xuatData, transferData, productData, warehouseProductData } = useData();
  const { currentUser, canAccessModule } = useAuth();
  const { appSettings } = useSettings();

  const aggregates = useMemo(() => {
    return calculateProductAggregates(nhapData, xuatData, transferData, warehouseProductData);
  }, [nhapData, xuatData, transferData, warehouseProductData]);

  // Total summary stats
  const totalProducts = Math.max(0, (productData?.length || 1) - 1);
  const totalNhapQty = useMemo(() => {
    return (nhapData || []).slice(1).reduce((acc, row) => acc + cleanNumber(row[8]), 0);
  }, [nhapData]);

  const totalXuatQty = useMemo(() => {
    return (xuatData || []).slice(1).reduce((acc, row) => acc + cleanNumber(row[8]), 0);
  }, [xuatData]);

  const totalTransfers = Math.max(0, (transferData?.length || 1) - 1);

  // Accessible modules excluding 'home' itself
  const accessibleModules = useMemo(() => {
    return MODULE_DEFINITIONS.filter(m => m.key !== 'home' && canAccessModule(m.key));
  }, [canAccessModule]);

  // Low stock products
  const lowStockThreshold = appSettings?.lowStockThreshold || 10;
  const lowStockItems = useMemo(() => {
    const list = [];
    (productData || []).slice(1).forEach(row => {
      const id = (row[0] || '').toString().trim();
      if (!id) return;
      const name = (row[1] || '').toString().trim();
      const tonCuoi = aggregates.get(id.toLowerCase())?.tonCuoi || 0;
      if (tonCuoi <= lowStockThreshold) {
        list.push({ id, name, tonCuoi });
      }
    });
    return list.slice(0, 8);
  }, [productData, aggregates, lowStockThreshold]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    const list = [];
    (nhapData || []).slice(1).slice(-5).forEach(row => {
      list.push({
        type: 'NHAP',
        date: row[1],
        mdh: row[3],
        name: row[5] || row[4],
        idSp: row[6],
        qty: cleanNumber(row[8]),
        kho: row[11]
      });
    });
    (xuatData || []).slice(1).slice(-5).forEach(row => {
      list.push({
        type: 'XUAT',
        date: row[1],
        mdh: row[3],
        name: row[5] || row[4],
        idSp: row[6],
        qty: cleanNumber(row[8]),
        kho: row[11]
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [nhapData, xuatData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Quick Action Shortcuts */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wide uppercase">
                Cổng điều hướng trung tâm
              </span>
              <span className="text-blue-200 text-xs font-semibold">
                Xin chào, {currentUser?.name || currentUser?.id || 'Người dùng'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              Hệ thống Quản lý Tồn kho LNK
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
              Chọn nhanh một phân hệ bên dưới hoặc sử dụng các lối tắt nghiệp vụ để bắt đầu công việc.
            </p>
          </div>

          {/* Shortcut buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canAccessModule('tongquan') && (
              <button
                onClick={() => onNavigate('tongquan')}
                className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95"
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Báo cáo Tổng quan
              </button>
            )}
            {canAccessModule('nhap') && (
              <button
                onClick={() => onNavigate('nhap')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                Nhập kho
              </button>
            )}
            {canAccessModule('xuat') && (
              <button
                onClick={() => onNavigate('xuat')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                Xuất kho
              </button>
            )}
            {canAccessModule('chuyenkho') && (
              <button
                onClick={() => onNavigate('chuyenkho')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Điều chuyển
              </button>
            )}
            {canAccessModule('dubaonhap') && (
              <button
                onClick={() => onNavigate('dubaonhap')}
                className="px-3.5 py-2 bg-amber-400 text-amber-950 hover:bg-amber-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Dự báo nhập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Clickable Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div
          onClick={() => canAccessModule('sanpham') && onNavigate('sanpham')}
          className={`bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between transition-all duration-200 ${
            canAccessModule('sanpham') ? 'cursor-pointer hover:shadow-md hover:border-emerald-300 group' : ''
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục SP</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{formatNumber(totalProducts)}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              Sản phẩm active {canAccessModule('sanpham') && <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Nhap */}
        <div
          onClick={() => canAccessModule('nhap') && onNavigate('nhap')}
          className={`bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between transition-all duration-200 ${
            canAccessModule('nhap') ? 'cursor-pointer hover:shadow-md hover:border-blue-300 group' : ''
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Nhập</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{formatNumber(totalNhapQty)}</h3>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-flex items-center gap-1">
              Sản phẩm đã nhập {canAccessModule('nhap') && <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
        </div>

        {/* Total Xuat */}
        <div
          onClick={() => canAccessModule('xuat') && onNavigate('xuat')}
          className={`bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between transition-all duration-200 ${
            canAccessModule('xuat') ? 'cursor-pointer hover:shadow-md hover:border-orange-300 group' : ''
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Xuất</p>
            <h3 className="text-2xl font-black text-orange-600 mt-1">{formatNumber(totalXuatQty)}</h3>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-flex items-center gap-1">
              Sản phẩm xuất kho {canAccessModule('xuat') && <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition">
            <ArrowUpFromLine className="w-6 h-6" />
          </div>
        </div>

        {/* Transfers */}
        <div
          onClick={() => canAccessModule('chuyenkho') && onNavigate('chuyenkho')}
          className={`bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between transition-all duration-200 ${
            canAccessModule('chuyenkho') ? 'cursor-pointer hover:shadow-md hover:border-indigo-300 group' : ''
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điều chuyển kho</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{formatNumber(totalTransfers)}</h3>
            <span className="text-[11px] text-indigo-500 font-semibold mt-1 inline-flex items-center gap-1">
              Lượt điều chuyển {canAccessModule('chuyenkho') && <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MODULE LAUNCHPAD HUB / DANH MỤC PHÂN HỆ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Danh mục Phân hệ & Đường dẫn mở Mô-đun
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhấp vào bất kỳ phân hệ nào để truy cập trực tiếp chức năng tương ứng
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {accessibleModules.length} phân hệ khả dụng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accessibleModules.map((item) => {
            const IconComponent = MODULE_ICON_MAP[item.icon] || Package;
            const theme = MODULE_COLOR_THEMES[item.color] || MODULE_COLOR_THEMES.blue;

            return (
              <div
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`group bg-white rounded-2xl border p-4 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${theme.border} ${theme.hoverBorder} ${theme.hoverShadow}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition duration-200`}>
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-600 group-hover:bg-slate-100 transition">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                    /{item.key}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
                    Mở phân hệ &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid for Low Stock Alerts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Cảnh báo sản phẩm sắp hết</h3>
                <p className="text-[11px] text-slate-400">Tồn kho ≤ {lowStockThreshold} sản phẩm</p>
              </div>
            </div>
            {canAccessModule('sanpham') && (
              <button
                onClick={() => onNavigate('sanpham')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {lowStockItems.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {lowStockItems.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800">{item.id}</span>
                    <span className="text-slate-500 ml-2 truncate">{item.name}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                    item.tonCuoi <= 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    Còn: {formatNumber(item.tonCuoi)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Không có sản phẩm nào chạm ngưỡng cảnh báo tồn tối thiểu.
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Nhật ký hoạt động gần đây</h3>
                <p className="text-[11px] text-slate-400">Giao dịch nhập & xuất mới nhất</p>
              </div>
            </div>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${
                      tx.type === 'NHAP' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {tx.type}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{tx.mdh || tx.idSp}</p>
                      <p className="text-[11px] text-slate-400">{formatDateVN(tx.date)} • {tx.kho}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-700 shrink-0">
                    {tx.type === 'NHAP' ? '+' : '-'}{formatNumber(tx.qty)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Chưa có giao dịch nhập xuất nào trong hệ thống.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
