export const CONFIG = {
  spreadsheetId: "1qo4DMUGNd-D7n2hbrRiGIIkR24mArDoKZSeYjdkP8hQ",
  authSheetName: "DSNV",
  nxSheetName: "NX_CT",
  nhapSheetName: "NHAP_CT",
  expectedSheetName: "DU_KIEN_HANG_VE",
  xuatSheetName: "XUAT_CT",
  transferSheetName: "CHUYEN_KHO_CT",
  productSheetName: "DS_SP",
  warehouseProductSheetName: "DS_SP_KHO",
  tonNppSheetName: "TON_NPP",
  reconciliationSheetName: "DOI_SOAT",
  giuHangSheetName: "GIU_HANG",
  kiemKhoSheetName: "KIEM_KHO",
  caiDatSheetName: "CAI_DAT",
  permissionsFile: "permissions.json",
  serviceAccountEmail: "lnk-773@cty-lnk-161.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTg5BFj22QViBG\nTyE073/XFsN/Tu0qf9zHmCREpC0V8hMUIG1sh7BhcfEYMpoQy3PK1EKmcVFj33/f\nn8p1KI+4vGrFAJgXLPxlbNmfJA1S2Ru5rMZxamZPiQ+vfCSVbjlyfb019oaDTd55\nTYWxl8QjI7uv+bd8p2aJDCk6fMams96j82kjQG5GObrmDNINtNWXW9S7K32Yndjx\nOcoFe4VFICAau9y2phJFdw1Dh82fa2DMtnJttCeRN+wgQhoH0299XEoyJvGTzBTH\n1hJnwzKiiZHlLNMTAmzqlp+/YZa9kkqBhslKG+w3U0qS6gJA2Qh2yJQCEQYUk5OD\nqDrd2ZmBAgMBAAECggEAJIbhJJ4dE/LHrpSuPaPJnkW0W7kv3GnJ4R8tTjxS++n6\n8PwboYU6SM3CTsU4VYOpGsM2wmMp5Nc9UEtaTYrEbSj+wEg2u7PdX4+hcmnpsh/D\nubg0afQvuHcJQissbzDik1rTEO1is+y/6Y9hcfatXMsoN77meMy4+Jxkx1CyhqmT\ncOowEwASxDkSKN4472OSujg7ECkQY224FlafLbjU5nsRgF2EqfA4Z10e+FGQE6l0\n+E6mD135lUyk/Ug6zjizEdEmHC8+BBfsGJCIYizBFJZ7KjfF5VPbdWHBdw+m0qQr\nMIqfTrfiO7TVs8VqiFv3JEOYKSG6ZM7oAIii7xsGdQKBgQDxqLxd+NPbZFp0OKEU\nAOmNt2CjA/iEmCeNZ8Cjkkn6lWS6q8X9fdWEHAgWJPcnOZA4U3PrZSNFZzrJ9f+b\nVWS5/zynJgAY96YAQoOiTJjnJUlaMTNt+QkEtduFZKOwy1I4Ig9fFwQQBIrlE4rQ\nc39QaYm7Az9JLJAqVwScMYlAPQKBgQDgEN1NOKMUkEbOtLIWWnUWTzCtSChs4AvQ\nbhIivQAMQRcZ4ALtpf1RIJgqHyh2SA3ptGaujJDic61tfTeEUx1NEIFdisFpLIG6\nu88g0KMU/0hJd0yabg/Cgh464Sp2XTeiB3tDd7LwfdUMZFVameiSREAZW/feLbPO\nbmJ/3aFulQKBgCwSScgZiQmJ07U+XqH3SKC/wK/6GWiVFyGCum8aTsOUWzpv+Tux\npy7grdjcBPbyWIrtLUbQuw39NYt/gY4ilKwXEEirdXkYMP37I2aF8Zy2ABqivm5f\n7HUfdVlucSvc6LG0BHmjCOqi6XG9jqNVbPKNTMD+ZpxBtEkEdaLGpfFBAoGAE+bL\nkTlPmtr5vxBjpQKh1bpw62M2W/1Gb1vndnhtEamSYLT57ZvJtTP87/jWgjMCMVjZ\nqfVIRSTbKZdun+019AtcQi+54BqY5zoZOqPtaEcIZ6YWAr113uPpxXcMa3j6IQUj\nGKoAFcZHbxNWVXbIJn2zZ804Zd6PUu2RCCRqW0UCgYEAv5rs4lg2tdIx3zKX67qQ\naFDBvxYriDqUuACpzV9TlZme6tDp+S21BGhwzwl9dcaWjda++lqyBqtkSHZtGAY+\nNf7d7jqgqgiofhYlBTSVo8qU8vVvIlzgzOb+Z3aZPiZHiCu8K4YAJ9Qn5q8Fz1PV\n4b87bpePRsmiNvOiCsTBaRY=\n-----END PRIVATE KEY-----\n",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
};

export const DEFAULT_APP_SETTINGS = {
  appName: "LNK TỒN KHO - ERP SYSTEM",
  appVersion: "2.0.0",
  pageSize: 200,
  warehouses: ['KHO 1', 'KHO 2', 'KHO 3', 'KHO 4', 'KHO 5'],
  defaultWarehouse: 'KHO 1',
  lowStockThreshold: 10,
  allowNegativeStock: 'CANH_BAO',
  holdOrderExpiryDays: 7,
  autoRefreshIntervalSec: 300,
  kiemKhoStatuses: ['Chờ kiểm', 'Đã kiểm', 'Lệch kho', 'Hoàn thành'],
  xuatConfirmStatuses: ['Đã nhặt hàng', 'Đã lên xe', 'Hoàn thành'],
  lastSyncedTime: null,
  syncSource: 'LOCAL'
};

export const MODULE_DEFINITIONS = [
  { key: 'home', name: 'Trang chủ', desc: 'Trung tâm điều hướng lối tắt hệ thống', icon: 'Home', color: 'blue' },
  { key: 'tongquan', name: 'Tổng quan', desc: 'Báo cáo & phân tích số liệu xuất nhập tồn', icon: 'BarChart3', color: 'indigo' },
  { key: 'nhap', name: 'Danh sách nhập', desc: 'Xem & quản lý phiếu nhập kho', icon: 'ArrowDownToLine', color: 'blue' },
  { key: 'dukien', name: 'Dự kiến hàng về', desc: 'Theo dõi đơn hàng dự kiến về kho', icon: 'CalendarClock', color: 'amber' },
  { key: 'xuat', name: 'Danh sách xuất', desc: 'Xem & quản lý phiếu xuất kho', icon: 'ArrowUpFromLine', color: 'orange' },
  { key: 'chuyenkho', name: 'Điều chuyển kho', desc: 'Điều chuyển hàng giữa các kho', icon: 'ArrowLeftRight', color: 'cyan' },
  { key: 'sanpham', name: 'Danh sách sản phẩm', desc: 'Danh mục sản phẩm & tồn kho tổng', icon: 'Package', color: 'emerald' },
  { key: 'sanphamkho', name: 'Sản phẩm kho', desc: 'Tồn kho chi tiết theo từng kho', icon: 'Warehouse', color: 'indigo' },
  { key: 'ton_npp', name: 'Tồn NPP', desc: 'Báo cáo tồn Nhà phân phối', icon: 'Building2', color: 'teal' },
  { key: 'doisoat', name: 'Đối soát', desc: 'Đối chiếu tồn hệ thống với MISA', icon: 'Scale', color: 'rose' },
  { key: 'nhanvien', name: 'Danh sách nhân viên', desc: 'Danh bạ nhân viên từ DSNV', icon: 'Users', color: 'sky' },
  { key: 'khachhang', name: 'Danh sách khách hàng', desc: 'Khách hàng NPP và NCC', icon: 'UserCheck', color: 'violet' },
  { key: 'dubaonhap', name: 'Dự báo nhập hàng', desc: 'Dự báo điểm đặt hàng (ROP), số ngày hết hàng và lượng cần nhập', icon: 'TrendingUp', color: 'purple' },
  { key: 'caidat', name: 'Cài đặt & Phân quyền', desc: 'Quản trị hệ thống & thiết kế phân quyền', icon: 'Settings', color: 'slate' }
];

export const AVAILABLE_ACTIONS = [
  { key: 'nx.manualAdd', name: 'Thêm thủ công đơn Nhập / Xuất', desc: 'Cho phép tạo mới dòng phiếu nhập xuất bằng tay' },
  { key: 'nx.upload', name: 'Tải lên dữ liệu Excel', desc: 'Cho phép upload file Excel nhập/xuất/trả lại' },
  { key: 'nx.confirmWarehouse', name: 'Xác nhận trạng thái kho', desc: 'Cập nhật trạng thái: Đã nhặt hàng, Đã lên xe, Hoàn thành' },
  { key: 'nx.delete', name: 'Xóa đơn hàng / Bản ghi Tồn NPP', desc: 'Cho phép xóa đơn Nhập, Xuất, Tồn NPP và các bản ghi chi tiết' },
  { key: 'sanpham.manage', name: 'Quản lý Sản phẩm', desc: 'Thêm mới, sửa thông tin & giá bán sản phẩm' },
  { key: 'doisoat.manage', name: 'Quản lý Đối soát', desc: 'Thao tác tải lên và đối chiếu chênh lệch MISA' },
  { key: 'caidat.manage', name: 'Quản trị Phân quyền', desc: 'Thiết kế vai trò và lưu cấu hình phân quyền' }
];
