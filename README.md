# PreOnic — đăng ký và xác thực

Khôi phục giao diện đăng ký/đăng nhập từ PreOnic gốc. Các module nghiệp vụ khác vẫn là file khung rỗng.

## Chạy backend

Yêu cầu Node.js 20+ và MongoDB đang chạy (local hoặc Atlas).

```powershell
cd be
npm.cmd ci
Copy-Item .env.example .env
# Điền JWT_SECRET, JWT_REFRESH_SECRET (hai chuỗi ngẫu nhiên khác nhau) và MONGODB_URI trong .env
npm.cmd run dev
```

API chạy ở http://localhost:8080, kiểm tra kết nối tại /health.

## Chạy frontend (terminal khác)

```powershell
cd fe
npm.cmd ci
Copy-Item .env.example .env
npm.cmd start
```

Mở http://localhost:3000/register để đăng ký, nhập OTP rồi đăng nhập tại /auth. Sau đăng nhập hiển thị thông tin tài khoản và nút đăng xuất. Chưa triển khai dashboard nghiệp vụ.

## Email và Google

Ở development, nếu chưa cấu hình SMTP, mã OTP được in trong terminal backend với nhãn [MOCK]. Link khôi phục mật khẩu cũng được in tại đó. Production yêu cầu cấu hình SMTP để gửi email thật.

Google login là tùy chọn: đặt cùng Google Client ID vào GOOGLE_CLIENT_ID (BE) và REACT_APP_GOOGLE_CLIENT_ID (FE), cấu hình origin localhost:3000 trong Google Cloud. Khi chưa cấu hình, nút Google bị vô hiệu hóa.

Không đưa nội dung .env lên GitHub. Các file .env đã có trong commit khung đều rỗng; dùng `git rm --cached be/.env fe/.env` trước khi commit phần xác thực để ngừng theo dõi chúng.
