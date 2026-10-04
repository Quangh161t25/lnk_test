# 🚀 LNK TỒN KHO - ERP SYSTEM

[![Deployed with Vercel](https://vercel.com/button)](https://lnk-test.vercel.app)
[![Vercel Status](https://img.shields.io/badge/Vercel-Online-success?style=for-the-badge&logo=vercel)](https://lnk-test.vercel.app)
[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌐 ĐƯỜNG DẪN TRUY CẬP ỨNG DỤNG (LIVE DEMO)

👉 **Bấm vào link bên dưới để mở ngay ứng dụng trên Vercel:**  
### 🔗 [https://lnk-test.vercel.app](https://lnk-test.vercel.app)

*(Nếu bạn sử dụng tên miền hoặc link Vercel khác, vui lòng truy cập đúng đường dẫn Vercel của bạn).*

---

## 📌 CÁCH GẮN LINK VERCEL VÀO NÚT WEBSITE TRÊN GITHUB

Để khi mở link GitHub `https://github.com/Quangh161t25/lnk_test` người xem có nút bấm chuyển hướng ngay sang Vercel ở góc phải:

1. Mở trang GitHub Repository: [https://github.com/Quangh161t25/lnk_test](https://github.com/Quangh161t25/lnk_test)
2. Nhìn sang cột bên phải mục **About**, bấm vào biểu tượng bánh răng ⚙️ (**Edit repository details**).
3. Tại ô **Website**, điền link Vercel của bạn (ví dụ: `https://lnk-test.vercel.app`).
4. Tích chọn **Include in home page** $\rightarrow$ bấm **Save changes**.

---

## 🌟 TÍNH NĂNG CHÍNH

- 🎯 **Trang chủ Điều phối (Launcher Hub):** Điều hướng nhanh các phân hệ, tải siêu tốc, bảo mật 100% không kéo dữ liệu thừa khi đăng nhập.
- 📊 **Tổng quan & Báo cáo:** Biểu đồ phân tích nhập xuất tồn, doanh thu, cơ cấu kho, top khách hàng và top sản phẩm.
- 📥 **Danh sách Nhập kho:** Quản lý phiếu nhập chi tiết, hỗ trợ tạo đơn thủ công, import/export Excel.
- 📤 **Danh sách Xuất kho:** Quản lý phiếu xuất, in phiếu giao hàng, kiểm soát đơn hàng.
- ⏳ **Dự kiến hàng về (PO):** Theo dõi đơn đặt hàng và lượng hàng về dự kiến.
- 🔄 **Điều chuyển kho:** Điều phối chuyển hàng qua lại giữa các kho.
- 📦 **Danh mục Sản phẩm & Tồn kho:** Quản lý mã SP, giá niêm yết, tồn đầu, tồn cuối tổng và chi tiết từng kho.
- 🏢 **Tồn NPP:** Quản lý số liệu chốt tồn định kỳ của Nhà phân phối.
- ⚖️ **Đối soát MISA:** Đối chiếu chênh lệch tồn thực tế ERP với phần mềm kế toán MISA.
- 👥 **Danh sách Nhân viên & Khách hàng:** Quản lý thông tin phân quyền và danh bạ đối tác.
- 📈 **Dự báo nhập hàng (ROP/ROQ):** Tự động tính toán điểm đặt hàng, dự báo số ngày hết hàng và lượng cần đặt.
- ⚙️ **Cài đặt & Phân quyền:** Phân quyền theo vai trò (ADMIN, KHO, KT, NPP, KD, NVKD) và thiết lập hệ thống.

---

## 🔒 KIẾN TRÚC BẢO MẬT

- **BFF (Backend For Frontend):** Toàn bộ API Google Sheets được ủy quyền qua Vercel Serverless Function `/api/sheets`.
- **Zero Secrets on Client:** Không lộ Google Service Account Private Key hay Secret Credentials trên trình duyệt người dùng.
- **On-Demand Loading:** Dữ liệu từng sheet chỉ được tải khi người dùng click vào phân hệ tương ứng.
- **Mật khẩu an toàn:** Cột mật khẩu được lọc và làm sạch tuyệt đối trên server trước khi phản hồi về máy khách.
