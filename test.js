const axios = require('axios');
const authApp = require('./auth-service/server');
const productApp = require('./src/app');
const orderApp = require('./order-service/server');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runAllTests() {
    console.log('\n--- BẮT ĐẦU KIỂM THỬ TOÀN BỘ HỆ THỐNG SOA ---');
    await sleep(1500);

    let token = '';

    try {
        // 1. DỊCH VỤ XÁC THỰC (AUTH SERVICE :3000)
        console.log('\n[1] Đăng nhập tài khoản admin...');
        const loginRes = await axios.post('http://localhost:3000/login', {
            userName: 'admin',
            password: '123456'
        });
        const { tempToken, otpCode } = loginRes.data;
        console.log(`[PASS] Đăng nhập bước 1 thành công. Mã 2FA: ${otpCode}`);

        console.log('[2] Xác thực mã 2FA...');
        const verifyRes = await axios.post('http://localhost:3000/verify-2fa', {
            tempToken,
            otpCode
        });
        token = verifyRes.data.token;
        console.log('[PASS] Xác thực 2FA thành công, nhận JWT token.');

        const headers = { headers: { Authorization: `Bearer ${token}` } };

        // 2. DỊCH VỤ SẢN PHẨM (PRODUCT SERVICE :3001)
        console.log('\n[3] Lấy danh sách sản phẩm từ Product Service (:3001)...');
        const listRes = await axios.get('http://localhost:3001/products', headers);
        console.log(`[PASS] Lấy thành công ${listRes.data.total} sản phẩm.`);

        console.log('[4] Thêm sản phẩm mới có hình ảnh...');
        const newProduct = {
            name: 'Tai nghe Bluetooth Sony',
            description: 'Tai nghe chống ồn chủ động',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            price: 4500000,
            quantity: 20
        };
        const createRes = await axios.post('http://localhost:3001/products', newProduct, headers);
        const createdProductId = createRes.data.data.id;
        console.log(`[PASS] Thêm sản phẩm #${createdProductId} thành công.`);

        // 3. DỊCH VỤ ĐƠN HÀNG (ORDER SERVICE :3002)
        console.log('\n[5] Kiểm tra chặn truy cập Order Service khi thiếu token (kỳ vọng 401)...');
        try {
            await axios.get('http://localhost:3002/orders');
            console.error('[FAIL] Lẽ ra phải bị chặn 401');
            process.exit(1);
        } catch (e) {
            if (e.response && e.response.status === 401) {
                console.log('[PASS] Bị chặn 401 Unauthorized chính xác khi thiếu token.');
            } else {
                throw e;
            }
        }

        console.log('[6] Lấy danh sách đơn hàng từ Order Service (:3002)...');
        const ordersRes = await axios.get('http://localhost:3002/orders', headers);
        console.log(`[PASS] Lấy thành công ${ordersRes.data.total} đơn hàng.`);

        console.log('[7] Kiểm tra từ chối tạo đơn hàng khi vượt quá số lượng tồn kho (kỳ vọng 400)...');
        try {
            await axios.post('http://localhost:3002/orders', {
                customer_name: 'Khách Hàng Test',
                customer_email: 'test@gmail.com',
                items: [
                    { product_id: createdProductId, quantity: 999999 }
                ]
            }, headers);
            console.error('[FAIL] Lẽ ra phải báo lỗi 400 khi tồn kho không đủ');
            process.exit(1);
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log(`[PASS] Bắt lỗi tồn kho chính xác: "${e.response.data.message}"`);
            } else {
                throw e;
            }
        }

        console.log('[8] Tạo đơn hàng mới hợp lệ (tự kiểm tra giá & tồn kho từ Product Service)...');
        const newOrderPayload = {
            customer_name: 'Lê Văn C',
            customer_email: 'levanc@gmail.com',
            items: [
                { product_id: createdProductId, quantity: 2 }
            ]
        };
        const createOrderRes = await axios.post('http://localhost:3002/orders', newOrderPayload, headers);
        const createdOrderId = createOrderRes.data.data.id;
        console.log(`[PASS] Tạo đơn hàng #${createdOrderId} thành công. Tổng tiền: ${createOrderRes.data.data.total_amount}đ`);

        console.log(`[9] Xem chi tiết đơn hàng #${createdOrderId}...`);
        const orderDetailRes = await axios.get(`http://localhost:3002/orders/${createdOrderId}`, headers);
        console.log(`[PASS] Đơn hàng #${createdOrderId} có ${orderDetailRes.data.data.items?.length} mặt hàng.`);

        console.log(`[10] Cập nhật trạng thái đơn hàng #${createdOrderId} sang 'completed'...`);
        const updateStatusRes = await axios.put(`http://localhost:3002/orders/${createdOrderId}`, { status: 'completed' }, headers);
        console.log(`[PASS] Trạng thái mới: ${updateStatusRes.data.data.status}`);

        console.log(`[11] Kiểm tra chặn không cho chuyển trạng thái khi đơn đã 'completed' (kỳ vọng 400)...`);
        try {
            await axios.put(`http://localhost:3002/orders/${createdOrderId}`, { status: 'cancelled' }, headers);
            throw new Error('Lẽ ra phải chặn khi đơn hàng đã completed!');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log(`[PASS] Chặn thành công: "${e.response.data.message}"`);
            } else {
                throw e;
            }
        }

        console.log('[12] Lấy danh sách mặt hàng (GET /order_items)...');
        const orderItemsRes = await axios.get(`http://localhost:3002/order_items?order_id=${createdOrderId}`, headers);
        console.log(`[PASS] Lấy danh sách ${orderItemsRes.data.total} mặt hàng.`);

        console.log(`[13] Xóa đơn hàng #${createdOrderId}...`);
        await axios.delete(`http://localhost:3002/orders/${createdOrderId}`, headers);
        console.log('[PASS] Xóa đơn hàng thành công.');

        // Dọn dẹp sản phẩm test
        await axios.delete(`http://localhost:3001/products/${createdProductId}`, headers);

        console.log('\n--- TẤT CẢ 13 BƯỚC KIỂM THỬ LIÊN DỊCH VỤ ĐÃ THÀNH CÔNG ---\n');
        process.exit(0);

    } catch (err) {
        console.error('Lỗi kiểm thử:', err.response?.data || err.message);
        process.exit(1);
    }
}

runAllTests();

