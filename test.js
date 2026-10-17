const axios = require('axios');
const authApp = require('./auth-service/server');
const productApp = require('./src/app');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runAllTests() {
    console.log('\n--- BẮT ĐẦU KIỂM THỬ HỆ THỐNG ---');
    await sleep(1500);

    let token = '';

    try {
        // 1. Đăng nhập bước 1
        console.log('[1] Đăng nhập tài khoản admin...');
        const loginRes = await axios.post('http://localhost:3000/login', {
            userName: 'admin',
            password: '123456'
        });
        const { tempToken, otpCode } = loginRes.data;
        console.log(`[PASS] Đăng nhập thành công, nhận mã 2FA: ${otpCode}`);

        // 2. Xác thực 2FA
        console.log('[2] Xác thực mã 2FA...');
        const verifyRes = await axios.post('http://localhost:3000/verify-2fa', {
            tempToken,
            otpCode
        });
        token = verifyRes.data.token;
        console.log('[PASS] Xác thực 2FA thành công, nhận JWT token.');

        const headers = { headers: { Authorization: `Bearer ${token}` } };

        // 3. Lấy danh sách sản phẩm
        console.log('[3] Lấy danh sách sản phẩm từ Product Service (:3001)...');
        const listRes = await axios.get('http://localhost:3001/products', headers);
        console.log(`[PASS] Lấy thành công ${listRes.data.total} sản phẩm.`);

        // 4. Thêm sản phẩm mới kèm ảnh
        console.log('[4] Thêm sản phẩm mới có hình ảnh...');
        const newProduct = {
            name: 'Tai nghe Bluetooth Sony',
            description: 'Tai nghe chống ồn chủ động',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            price: 4500000,
            quantity: 20
        };
        const createRes = await axios.post('http://localhost:3001/products', newProduct, headers);
        const createdId = createRes.data.data.id;
        console.log(`[PASS] Thêm sản phẩm #${createdId} thành công.`);

        // 5. Cập nhật sản phẩm
        console.log(`[5] Cập nhật thông tin sản phẩm #${createdId}...`);
        await axios.put(`http://localhost:3001/products/${createdId}`, { price: 4200000, quantity: 25 }, headers);
        console.log('[PASS] Cập nhật thành công.');

        // 6. Xóa sản phẩm
        console.log(`[6] Xóa sản phẩm #${createdId}...`);
        await axios.delete(`http://localhost:3001/products/${createdId}`, headers);
        console.log('[PASS] Xóa sản phẩm thành công.');

        console.log('\n--- TẤT CẢ KIỂM THỬ ĐÃ VƯỢT QUA THÀNH CÔNG ---\n');
        process.exit(0);

    } catch (err) {
        console.error('Lỗi kiểm thử:', err.response?.data || err.message);
        process.exit(1);
    }
}

runAllTests();

