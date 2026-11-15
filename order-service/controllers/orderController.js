const axios = require('axios');
const pool = require('../config/db');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001/products';

// Lấy danh sách tất cả đơn hàng
const getAllOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT id, customer_name, customer_email, total_amount, status, created_at, updated_at FROM orders ORDER BY id DESC'
        );

        return res.status(200).json({
            success: true,
            total: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Lỗi getAllOrders:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách đơn hàng',
            error: error.message
        });
    }
};

// Lấy chi tiết đơn hàng theo ID kèm danh sách sản phẩm
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        const [orders] = await pool.query(
            'SELECT id, customer_name, customer_email, total_amount, status, created_at, updated_at FROM orders WHERE id = ?',
            [Number(id)]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy đơn hàng #${id}`
            });
        }

        const [items] = await pool.query(
            'SELECT id, order_id, product_id, product_name, quantity, unit_price, total_price FROM order_items WHERE order_id = ?',
            [Number(id)]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...orders[0],
                items
            }
        });
    } catch (error) {
        console.error('Lỗi getOrderById:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết đơn hàng',
            error: error.message
        });
    }
};

// Tạo đơn hàng mới kèm kiểm tra tồn kho từ Product Service
const createOrder = async (req, res) => {
    let conn;
    try {
        const { customer_name, customer_email, items } = req.body;

        if (!customer_name || typeof customer_name !== 'string' || customer_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Tên khách hàng là bắt buộc'
            });
        }

        if (!customer_email || typeof customer_email !== 'string' || customer_email.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Email khách hàng là bắt buộc'
            });
        }

        // Chuẩn hóa danh sách mặt hàng (hỗ trợ cả items array hoặc single product shorthand)
        let orderItemsList = items;
        if (!orderItemsList && req.body.product_id) {
            orderItemsList = [{
                product_id: req.body.product_id,
                quantity: req.body.quantity || 1
            }];
        }

        if (!Array.isArray(orderItemsList) || orderItemsList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng phải chứa ít nhất một sản phẩm'
            });
        }

        // Lấy token để gọi sang Product Service
        const token = req.token || (req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : '');
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Kiểm tra tồn kho và thông tin từng sản phẩm từ Product Service
        const validatedItems = [];
        let totalAmount = 0;

        for (const item of orderItemsList) {
            const productId = Number(item.product_id);
            const quantity = Number(item.quantity);

            if (!productId || isNaN(productId) || productId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID sản phẩm không hợp lệ'
                });
            }

            if (!quantity || isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng sản phẩm phải lớn hơn 0'
                });
            }

            // Gọi liên dịch vụ sang Product Service
            let product;
            try {
                const productRes = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`, {
                    headers: authHeader,
                    timeout: 4000
                });
                product = productRes.data?.data;
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm #${productId} không tồn tại`
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: `Không thể kết nối đến dịch vụ quản lý sản phẩm: ${err.message}`
                });
            }

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Không tìm thấy thông tin sản phẩm #${productId}`
                });
            }

            // Kiểm tra số lượng tồn kho
            if (product.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm "${product.name}" không đủ số lượng trong kho (còn: ${product.quantity}, yêu cầu: ${quantity})`
                });
            }

            const unitPrice = Number(product.price);
            const totalPrice = quantity * unitPrice;
            totalAmount += totalPrice;

            validatedItems.push({
                product_id: productId,
                product_name: product.name,
                current_stock: product.quantity,
                quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
        }

        // 2. Bắt đầu Transaction tạo đơn hàng và các mặt hàng
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [orderResult] = await conn.query(
            'INSERT INTO orders (customer_name, customer_email, total_amount, status) VALUES (?, ?, ?, ?)',
            [customer_name.trim(), customer_email.trim(), totalAmount, 'pending']
        );

        const newOrderId = orderResult.insertId;
        const insertedItems = [];

        for (const item of validatedItems) {
            const [itemResult] = await conn.query(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                [newOrderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price]
            );

            insertedItems.push({
                id: itemResult.insertId,
                order_id: newOrderId,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price
            });

            // Cập nhật trừ tồn kho trong Product Service
            try {
                const remainingStock = item.current_stock - item.quantity;
                await axios.put(`${PRODUCT_SERVICE_URL}/${item.product_id}`, {
                    quantity: remainingStock
                }, {
                    headers: authHeader,
                    timeout: 4000
                });
            } catch (stockErr) {
                console.warn(`[Warning] Không thể tự động cập nhật tồn kho cho sản phẩm #${item.product_id}:`, stockErr.message);
            }
        }

        await conn.commit();

        return res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: {
                id: newOrderId,
                customer_name: customer_name.trim(),
                customer_email: customer_email.trim(),
                total_amount: totalAmount,
                status: 'pending',
                items: insertedItems
            }
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Lỗi createOrder:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi tạo đơn hàng',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
    }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, customer_name, customer_email } = req.body;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        const [existing] = await pool.query('SELECT * FROM orders WHERE id = ?', [Number(id)]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy đơn hàng #${id}`
            });
        }

        const currentOrder = existing[0];
        const validStatuses = ['pending', 'completed', 'cancelled'];

        let newStatus = currentOrder.status;
        if (status !== undefined) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`
                });
            }

            // Đơn hàng đã hoàn thành thì không được chuyển về trạng thái đang xử lý hoặc hủy
            if (currentOrder.status === 'completed' && status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Đơn hàng đã hoàn thành, không thể chuyển sang trạng thái chờ xử lý hoặc đã hủy'
                });
            }

            newStatus = status;
        }

        const updatedCustomerName = customer_name ? customer_name.trim() : currentOrder.customer_name;
        const updatedCustomerEmail = customer_email ? customer_email.trim() : currentOrder.customer_email;

        await pool.query(
            'UPDATE orders SET status = ?, customer_name = ?, customer_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus, updatedCustomerName, updatedCustomerEmail, Number(id)]
        );

        const [updatedRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [Number(id)]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật đơn hàng thành công',
            data: updatedRows[0]
        });

    } catch (error) {
        console.error('Lỗi updateOrderStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật đơn hàng',
            error: error.message
        });
    }
};

// Xóa một đơn hàng
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        const [existing] = await pool.query('SELECT * FROM orders WHERE id = ?', [Number(id)]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy đơn hàng #${id} để xóa`
            });
        }

        // Xóa đơn hàng (các order_items sẽ tự động xóa nhờ ON DELETE CASCADE)
        await pool.query('DELETE FROM orders WHERE id = ?', [Number(id)]);

        return res.status(200).json({
            success: true,
            message: `Đã xóa đơn hàng #${id}`,
            data: existing[0]
        });

    } catch (error) {
        console.error('Lỗi deleteOrder:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa đơn hàng',
            error: error.message
        });
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder
};
