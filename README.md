# Product Management System

Hệ thống quản lý sản phẩm xây dựng theo kiến trúc hướng dịch vụ (SOA / Microservices) gồm 2 dịch vụ độc lập:
- **Auth Service (cổng 3000):** Xử lý đăng ký, đăng nhập, xác thực 2 bước (2FA) và cấp JWT token.
- **Product Service (cổng 3001):** Quản lý thông tin sản phẩm (CRUD kèm hình ảnh) và phục vụ giao diện người dùng trên trình duyệt. Mọi thao tác đều được kiểm tra tính hợp lệ của token qua Auth Service.

---

## 1. Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Cơ sở dữ liệu:** MySQL (thư viện `mysql2/promise`)
- **Bảo mật & Tiện ích:** JSON Web Token (`jsonwebtoken`), `axios`, `cors`, `dotenv`
- **Frontend:** HTML5, TailwindCSS, FontAwesome, JavaScript (Fetch API)

---

## 2. Cấu trúc thư mục

```
SOA/
├── auth-service/                  # Dịch vụ xác thực người dùng (Port 3000)
│   ├── config/db.js               # Kết nối CSDL auth_service_db
│   ├── controllers/               # Xử lý đăng ký, đăng nhập, 2FA
│   ├── middlewares/               # Middleware xác thực JWT
│   ├── routes/                    # Khai báo các endpoint xác thực
│   ├── database_auth.sql          # Script tạo bảng User
│   └── server.js                  # Điểm khởi chạy Auth Service
│
├── src/                           # Dịch vụ quản lý sản phẩm (Port 3001)
│   ├── config/db.js               # Kết nối CSDL product_service_db
│   ├── controllers/               # Xử lý 5 API CRUD sản phẩm
│   ├── middlewares/               # Middleware gọi liên dịch vụ kiểm tra token
│   ├── routes/                    # Khai báo các endpoint sản phẩm
│   └── app.js                     # Điểm khởi chạy Product Service & Web UI
│
├── public/                        # Giao diện web người dùng
│   ├── index.html                 # Giao diện chính (Đăng nhập, 2FA, Dashboard)
│   ├── style.css                  # Tùy biến giao diện
│   └── app.js                     # Xử lý tương tác và gọi API
│
├── database.sql                   # Script tạo bảng products & dữ liệu mẫu
├── run_both.js                    # Script khởi chạy đồng thời cả 2 dịch vụ
├── test.js                        # Script kiểm thử tự động toàn bộ hệ thống
├── package.json
└── README.md
```

---

## 3. Cài đặt & Chuẩn bị Cơ sở dữ liệu

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Khởi tạo dữ liệu MySQL
Import 2 file SQL vào MySQL của bạn:
- `auth-service/database_auth.sql` (tạo CSDL `auth_service_db`)
- `database.sql` (tạo CSDL `product_service_db`)

*Hoặc chạy lệnh trong PowerShell:*
```powershell
Get-Content "auth-service/database_auth.sql" -Raw | mysql -u root
Get-Content "database.sql" -Raw | mysql -u root
```

*Tài khoản mặc định để thử nghiệm:*
- Tên đăng nhập: `admin`
- Mật khẩu: `123456`
- Mã 2FA demo: `123456` (hoặc mã 6 số hiển thị trên giao diện)

---

## 4. Hướng dẫn Khởi chạy

### Chạy cả 2 dịch vụ cùng lúc (Khuyên dùng)
```bash
node run_both.js
```
*(hoặc `npm run start:both`)*

Lệnh trên sẽ khởi chạy:
- Auth Service tại: `http://localhost:3000`
- Product Service tại: `http://localhost:3001`

### Chạy từng dịch vụ riêng biệt
- Chạy Auth Service: `npm run auth` (hoặc `node auth-service/server.js`)
- Chạy Product Service: `npm start` (hoặc `node src/app.js`)

---

## 5. Sử dụng trên Trình duyệt

Mở trình duyệt truy cập: **`http://localhost:3001`**

1. **Đăng nhập:** Nhập tài khoản `admin` và mật khẩu `123456` (hoặc chuyển sang tab Đăng ký để tạo tài khoản mới).
2. **Xác thực 2FA:** Nhập mã bảo mật 6 chữ số để xác nhận danh tính và nhận JWT token.
3. **Quản lý sản phẩm:**
   - Xem danh sách sản phẩm kèm hình ảnh thumbnail, giá tiền và tồn kho.
   - Thêm sản phẩm mới (có hỗ trợ nhập link hình ảnh sản phẩm).
   - Xem chi tiết sản phẩm.
   - Chỉnh sửa thông tin, giá bán, số lượng.
   - Xóa sản phẩm.
   - Tìm kiếm sản phẩm nhanh theo tên.
4. **Đăng xuất:** Xóa token và đưa người dùng về lại màn hình đăng nhập.

---

## 6. Danh sách RESTful API

### Auth Service (`http://localhost:3000`)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/register` | Đăng ký tài khoản mới |
| `POST` | `/login` | Đăng nhập bước 1, sinh mã xác thực 2FA |
| `POST` | `/verify-2fa` | Xác thực mã 2FA, cấp JWT token chính thức |
| `POST` | `/api/auth/verify` | Kiểm tra tính hợp lệ của token (dành cho các dịch vụ khác gọi tới) |
| `GET` | `/hello` | Endpoint kiểm tra quyền truy cập (yêu cầu Bearer token) |

### Product Service (`http://localhost:3001`)
*Tất cả API dưới đây đều yêu cầu header: `Authorization: Bearer <token>`*

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/products` | Lấy danh sách toàn bộ sản phẩm |
| `GET` | `/products/:id` | Lấy chi tiết một sản phẩm theo ID (trả về 404 nếu không tìm thấy) |
| `POST` | `/products` | Thêm một sản phẩm mới (`name`, `description`, `image`, `price`, `quantity`) |
| `PUT` | `/products/:id` | Cập nhật thông tin sản phẩm theo ID |
| `DELETE` | `/products/:id` | Xóa sản phẩm theo ID |

---

## 7. Kiểm thử tự động

Chạy kịch bản kiểm thử tích hợp tự động:
```bash
npm test
```
*(hoặc `node test.js`)*
"# SOA_ProductManager" 
