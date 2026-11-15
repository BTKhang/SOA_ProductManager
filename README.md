# Hệ Thống Quản Lý Đơn Hàng & Sản Phẩm (Kiến trúc SOA)

Hệ thống được xây dựng theo kiến trúc hướng dịch vụ (Service-Oriented Architecture - SOA) bao gồm 3 dịch vụ độc lập kết nối qua RESTful API:
- **Auth Service (cổng 3000):** Đảm nhiệm xác thực người dùng, đăng ký, đăng nhập 2 bước (2FA) và cấp phát / xác minh JSON Web Token (JWT).
- **Product Service (cổng 3001):** Quản lý thông tin danh mục sản phẩm (CRUD kèm hình ảnh, giá, tồn kho) và phục vụ giao diện web người dùng.
- **Order Service (cổng 3002):** Quản lý đơn hàng và các mặt hàng trong đơn (`orders` & `order_items`), tự động liên lạc với Product Service để xác thực đơn giá, kiểm tra tồn kho và trừ số lượng trong kho khi tạo đơn.

---

## 1. Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Cơ sở dữ liệu:** MySQL (sử dụng thư viện `mysql2/promise` với connection pool và tự động tạo bảng nếu chưa có)
- **Giao tiếp liên dịch vụ:** RESTful API với `axios`
- **Bảo mật:** JWT (`jsonwebtoken`), mã hóa dữ liệu, xác thực 2FA
- **Frontend:** HTML5, TailwindCSS, FontAwesome, Vanilla JavaScript (Fetch API)

---

## 2. Cấu trúc thư mục dự án

```
SOA/
├── auth-service/                  # Dịch vụ xác thực người dùng (Port 3000)
│   ├── config/db.js               # Kết nối CSDL auth_service_db
│   ├── controllers/               # Controller đăng ký, đăng nhập, 2FA
│   ├── middlewares/               # Middleware xác thực JWT
│   ├── routes/                    # Khai báo các endpoint xác thực
│   ├── database_auth.sql          # Script tạo bảng users
│   └── server.js                  # Điểm khởi chạy Auth Service
│
├── src/                           # Dịch vụ quản lý sản phẩm (Port 3001)
│   ├── config/db.js               # Kết nối CSDL product_service_db
│   ├── controllers/               # Xử lý CRUD sản phẩm
│   ├── middlewares/               # Middleware liên dịch vụ xác thực token với cổng 3000
│   ├── routes/                    # Khai báo các endpoint sản phẩm
│   └── app.js                     # Điểm khởi chạy Product Service & Web UI
│
├── order-service/                 # Dịch vụ quản lý đơn hàng (Port 3002)
│   ├── config/db.js               # Kết nối CSDL order_service_db
│   ├── controllers/               # Xử lý CRUD đơn hàng (orders) & mặt hàng (order_items)
│   ├── middlewares/               # Middleware xác thực token liên dịch vụ
│   ├── routes/                    # Khai báo các endpoint orders & order_items
│   ├── database_order.sql         # Script tạo bảng orders & order_items
│   └── server.js                  # Điểm khởi chạy Order Service
│
├── public/                        # Giao diện web người dùng
│   ├── index.html                 # Giao diện SPA (Đăng nhập, 2FA, Sản phẩm, Đơn hàng)
│   ├── style.css                  # Tùy biến CSS
│   └── app.js                     # Xử lý gọi API & logic hiển thị
│
├── database.sql                   # Script CSDL sản phẩm mẫu
├── run_both.js                    # Script khởi chạy đồng thời cả 3 dịch vụ
├── test.js                        # Script kiểm thử tự động toàn bộ 3 dịch vụ
├── package.json
└── README.md
```

---

## 3. Cài đặt & Chuẩn bị Cơ sở dữ liệu

### Bước 1: Cài đặt gói thư viện
```bash
npm install
```

### Bước 2: Khởi tạo dữ liệu MySQL
Import 3 file SQL vào MySQL (hoặc các dịch vụ sẽ tự động khởi tạo cơ sở dữ liệu và bảng tương ứng khi khởi động):
- `auth-service/database_auth.sql` (CSDL: `auth_service_db`)
- `database.sql` (CSDL: `product_service_db`)
- `order-service/database_order.sql` (CSDL: `order_service_db`)

*Tài khoản mặc định để kiểm tra:*
- **Tên đăng nhập:** `admin`
- **Mật khẩu:** `123456`
- **Mã OTP 2FA:** `123456` (hoặc mã 6 số ngẫu nhiên hiển thị trên màn hình đăng nhập)

---

## 4. Hướng dẫn Khởi chạy

### Cách 1: Khởi chạy cả 3 dịch vụ cùng một lúc (Khuyên dùng)
```bash
node run_both.js
```
*(hoặc `npm run start:all` / `npm run start:both`)*

Lệnh trên sẽ tự động bật đồng thời cả 3 dịch vụ:
- Auth Service: `http://localhost:3000`
- Product Service & Web UI: `http://localhost:3001`
- Order Service: `http://localhost:3002`

### Cách 2: Khởi chạy từng dịch vụ trên các terminal riêng
- Auth Service: `npm run auth` (hoặc `node auth-service/server.js`)
- Product Service: `npm start` (hoặc `node src/app.js`)
- Order Service: `npm run order` (hoặc `node order-service/server.js`)

---

## 5. Sử dụng trên Trình duyệt

Truy cập: **`http://localhost:3001`**

1. **Đăng nhập & Xác thực 2FA:** Nhập tài khoản `admin` / `123456`, sau đó nhập mã OTP 6 số để đăng nhập.
2. **Quản lý sản phẩm (Tab "Sản phẩm"):**
   - Xem bảng sản phẩm, hình ảnh, đơn giá và số lượng tồn kho.
   - Thêm sản phẩm mới (kèm link ảnh online), chỉnh sửa hoặc xóa sản phẩm.
   - Tìm kiếm sản phẩm theo tên hoặc mô tả.
3. **Quản lý đơn hàng (Tab "Đơn hàng"):**
   - Bấm **"Tạo đơn hàng mới"**: Nhập tên khách hàng, email và chọn sản phẩm đưa vào giỏ hàng. Hệ thống tự động kiểm tra tồn kho tại Product Service; nếu số lượng vượt quá tồn kho sẽ có cảnh báo.
   - Khi hoàn tất tạo đơn: Số lượng tồn kho tại Product Service tự động được khấu trừ.
   - Xem chi tiết đơn hàng: Xem danh sách các mặt hàng trong đơn, số lượng, đơn giá, tổng tiền.
   - Cập nhật trạng thái đơn hàng: Chờ xử lý (`pending`), Hoàn thành (`completed`), hoặc Hủy đơn (`cancelled`). Lưu ý: Khi đơn hàng đã hoàn tất (`completed`), hệ thống sẽ khóa và không cho phép chuyển ngược lại về chờ xử lý hoặc hủy đơn.
   - Lọc đơn hàng theo từng trạng thái.

---

## 6. Danh sách RESTful API

Tất cả các endpoint bên dưới (ngoại trừ các endpoint đăng ký/đăng nhập công khai) đều yêu cầu Header:
`Authorization: Bearer <JWT_TOKEN>`

### 1. Auth Service (`http://localhost:3000`)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/register` | Đăng ký tài khoản người dùng mới |
| `POST` | `/login` | Đăng nhập bước 1, cấp tạm thời mã xác thực 2FA |
| `POST` | `/verify-2fa` | Xác nhận mã 2FA và cấp JWT token chính thức |
| `POST` | `/api/auth/verify` | Kiểm tra tính hợp lệ của token (dành cho liên dịch vụ gọi tới) |
| `GET` | `/hello` | Endpoint kiểm tra quyền truy cập |

### 2. Product Service (`http://localhost:3001`)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/products` | Lấy danh sách toàn bộ sản phẩm |
| `GET` | `/products/:id` | Lấy chi tiết thông tin một sản phẩm theo ID |
| `POST` | `/products` | Thêm sản phẩm mới (`name`, `description`, `image`, `price`, `quantity`) |
| `PUT` | `/products/:id` | Cập nhật thông tin sản phẩm theo ID |
| `DELETE` | `/products/:id` | Xóa sản phẩm theo ID |

### 3. Order Service (`http://localhost:3002`)
#### A. Quản lý Đơn hàng (Orders)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/orders` | Lấy danh sách toàn bộ đơn hàng (hỗ trợ query `?status=...`) |
| `GET` | `/orders/:id` | Lấy chi tiết đơn hàng kèm danh sách các mặt hàng (`items`) |
| `POST` | `/orders` | Tạo đơn hàng mới (tự động kiểm tra giá & tồn kho từ Product Service) |
| `PUT` | `/orders/:id` | Cập nhật thông tin đơn hàng (ví dụ cập nhật trạng thái `status`) |
| `DELETE` | `/orders/:id` | Xóa đơn hàng và toàn bộ mặt hàng liên quan |

#### B. Quản lý Mặt hàng trong Đơn (Order Items)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/order_items` | Lấy danh sách mặt hàng (hỗ trợ lọc `?order_id=...`) |
| `GET` | `/order_items/:id` | Xem chi tiết một mặt hàng theo ID |
| `POST` | `/order_items` | Thêm mặt hàng vào đơn và cập nhật lại tổng tiền đơn hàng |
| `PUT` | `/order_items/:id` | Cập nhật số lượng/giá của mặt hàng trong đơn |
| `DELETE` | `/order_items/:id` | Xóa một mặt hàng khỏi đơn và tính lại tổng tiền |

---

## 7. Kiểm thử Tích hợp Tự động

Dự án có sẵn script kiểm thử tự động 12 kịch bản liên dịch vụ (Auth -> Product -> Order):
```bash
npm test
```
*(hoặc `node test.js`)*

Script sẽ tự động:
1. Đăng nhập và xác thực 2FA.
2. Lấy JWT token để gọi Product Service và Order Service.
3. Thử nghiệm các trường hợp kiểm tra bảo mật (401 khi thiếu token).
4. Thử nghiệm kiểm tra tồn kho (từ chối 400 khi đặt hàng quá số lượng trong kho).
5. Đặt hàng thành công, trừ tồn kho và cập nhật doanh thu.
6. Cập nhật trạng thái và xóa dữ liệu kiểm thử.
