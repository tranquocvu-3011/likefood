# 📖 Hướng Dẫn Sử Dụng — LIKEFOOD

## Mục Lục

- [Dành cho Khách Hàng](#dành-cho-khách-hàng)
- [Dành cho Quản Trị Viên](#dành-cho-quản-trị-viên)

---

# Dành cho Khách Hàng

## 1. Đăng Ký & Đăng Nhập

### Tạo tài khoản mới
1. Truy cập trang web → Nhấn **"Đăng nhập"** → **"Đăng ký"**
2. Nhập địa chỉ email
3. Kiểm tra email để nhận Magic Link
4. Nhấn vào link trong email để hoàn tất đăng ký

### Đăng nhập
- **Email + Magic Link**: Nhập email → nhận link → click để đăng nhập
- **Google OAuth**: Nhấn "Đăng nhập với Google"

## 2. Tìm Kiếm & Duyệt Sản Phẩm

### Tìm kiếm
- Sử dụng thanh tìm kiếm trên header
- Hỗ trợ gợi ý tìm kiếm (search hints) khi gõ
- Tìm kiếm theo tên sản phẩm, mô tả, danh mục

### Lọc sản phẩm
- **Danh mục**: Lọc theo loại đặc sản
- **Giá**: Lọc theo khoảng giá
- **Đánh giá**: Lọc theo số sao
- **Thương hiệu**: Lọc theo nhà sản xuất

### Sắp xếp
- Mới nhất
- Giá thấp → cao / cao → thấp
- Đánh giá cao nhất
- Bán chạy nhất

## 3. Giỏ Hàng & Thanh Toán

### Thêm vào giỏ hàng
1. Nhấn vào sản phẩm để xem chi tiết
2. Chọn số lượng
3. Nhấn **"Thêm vào giỏ hàng"**

### Thanh toán
1. Vào giỏ hàng → Kiểm tra sản phẩm
2. Nhập mã giảm giá (nếu có)
3. Chọn địa chỉ giao hàng
4. Chọn phương thức thanh toán:
   - 💳 **Thẻ tín dụng** (Stripe): Visa, Mastercard, AMEX
   - 💵 **COD**: Thanh toán khi nhận hàng
   - 🏦 **Chuyển khoản**: Chuyển khoản ngân hàng
5. Xác nhận đơn hàng

## 4. Theo Dõi Đơn Hàng

- Vào **Profile → Đơn hàng** để xem danh sách
- Trạng thái: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao
- Nhận thông báo email khi trạng thái thay đổi

## 5. AI Chatbot 🤖

- Nhấn icon chat ở góc dưới bên phải
- Hỏi bất kỳ điều gì:
  - "Đặc sản nào bán chạy nhất?"
  - "Tôi muốn mua quà tặng, gợi ý gì?"
  - "Kiểm tra đơn hàng #12345"
  - "Chính sách đổi trả như thế nào?"

## 6. Tích Điểm & Ưu Đãi

### Cách tích điểm
- 🛒 Mua hàng: 1% giá trị đơn = điểm
- 📅 Check-in hàng ngày: Điểm danh nhận thưởng
- 👥 Giới thiệu bạn bè: Nhận hoa hồng khi bạn mua hàng

### Sử dụng điểm
- Đổi điểm thành mã giảm giá tại Checkout

## 7. Flash Sale ⚡

- Xem sản phẩm đang giảm giá tại trang Flash Sale
- Countdown timer hiển thị thời gian còn lại
- Số lượng có hạn — mua nhanh!

---

# Dành cho Quản Trị Viên

## 1. Truy Cập Admin

1. Đăng nhập với tài khoản admin
2. Truy cập: `/admin`

## 2. Dashboard Tổng Quan

- **Doanh thu**: Biểu đồ doanh thu theo ngày/tuần/tháng
- **Đơn hàng**: Số đơn mới, đang xử lý, đã hoàn thành
- **Khách hàng**: Tổng số, khách mới, khách quay lại
- **Top sản phẩm**: Bán chạy nhất

## 3. Quản Lý Sản Phẩm

### Thêm sản phẩm
1. Admin → Sản phẩm → **"Thêm mới"**
2. Điền thông tin: Tên, mô tả, giá, danh mục, thương hiệu
3. Upload ảnh sản phẩm
4. Cài đặt inventory (số lượng tồn kho)
5. Lưu

### Chỉnh sửa / Xóa
- Tìm sản phẩm trong danh sách → Edit / Delete

## 4. Quản Lý Đơn Hàng

- Xem danh sách đơn hàng với filter theo trạng thái
- Cập nhật trạng thái: Xác nhận → Đóng gói → Giao hàng → Hoàn thành
- In đơn hàng
- Nhận thông báo Telegram khi có đơn mới

## 5. AI Command Center 🤖

### Insights
- Phân tích xu hướng bán hàng
- Dự đoán doanh thu
- Gợi ý chiến lược kinh doanh

### Trends
- Xu hướng sản phẩm theo thời gian
- Seasonal patterns

### Prospects
- Phân tích hành vi khách hàng
- Xác định khách tiềm năng
- Đề xuất liên hệ

## 6. Flash Sale & Voucher

### Tạo Flash Sale
1. Admin → Flash Sale → **"Tạo chiến dịch"**
2. Chọn sản phẩm + giá sale
3. Thiết lập thời gian bắt đầu/kết thúc
4. Kích hoạt

### Tạo Voucher
1. Admin → Voucher → **"Tạo mã"**
2. Thiết lập: % giảm, giảm cố định, min order
3. Số lần sử dụng tối đa
4. Thời hạn

## 7. Email Marketing

- **Welcome Email**: Tự động gửi cho khách mới
- **Abandoned Cart**: Nhắc nhở giỏ hàng bỏ quên
- **Re-engagement**: Thu hút khách lâu không mua

## 8. Live Chat

- Xem tin nhắn từ khách hàng realtime
- Trả lời trực tiếp từ admin panel
- Trả lời từ Telegram

## 9. Cài Đặt Hệ Thống

- Thông tin cửa hàng
- Cấu hình SMTP / Telegram
- API keys management
- Knowledge base cho AI

---

## Liên Hệ Hỗ Trợ

- 📧 Email: tranquocvu3011@gmail.com
- 💬 Live Chat: Trên website
- 🤖 AI Chatbot: 24/7
