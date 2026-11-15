const axios = require('axios');
const pool = require('../config/db');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001/products';

// Hàm phụ trợ cập nhật lại tổng tiền đơn hàng cha
const recalculateOrderTotal = async (orderId, connection = pool) => {
    const [sumResult] = await connection.query(
        'SELECT COALESCE(SUM(total_price), 0) AS total FROM order_items WHERE order_id = ?',
        [orderId]
    );
    const newTotal = sumResult[0].total;
    await connection.query(
        'UPDATE orders SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newTotal, orderId]
    );
    return newTotal;
};

// 1. Lấy danh sách mặt hàng (hỗ trợ lọc theo ?order_id=...)
const getAllOrderItems = async (req, res) => {
    try {
        const { order_id } = req.query;

        let query = 'SELECT id, order_id, product_id, product_name, quantity, unit_price, total_price FROM order_items';
        const params = [];

        if (order_id) {
            query += ' WHERE order_id = ?';
            params.push(Number(order_id));
        }

        query += ' ORDER BY id DESC';

        const [rows] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            total: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Lỗi getAllOrderItems:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách chi tiết đơn hàng',
            error: error.message
        });
    }
};

// 2. Lấy chi tiết một mặt hàng theo ID
const getOrderItemById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID mặt hàng không hợp lệ'
            });
        }

        const [rows] = await pool.query(
            'SELECT id, order_id, product_id, product_name, quantity, unit_price, total_price FROM order_items WHERE id = ?',
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy mặt hàng #${id}`
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Lỗi getOrderItemById:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết mặt hàng',
            error: error.message
        });
    }
};

// 3. Tạo mặt hàng mới trong đơn hàng
const createOrderItem = async (req, res) => {
    let conn;
    try {
        const { order_id, product_id, quantity, unit_price, product_name } = req.body;

        if (!order_id || isNaN(order_id) || Number(order_id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'order_id không hợp lệ'
            });
        }

        if (!product_id || isNaN(product_id) || Number(product_id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'product_id không hợp lệ'
            });
        }

        const parsedQuantity = Number(quantity);
        if (!parsedQuantity || isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải lớn hơn 0'
            });
        }

        // Kiểm tra đơn hàng có tồn tại không
        const [orders] = await pool.query('SELECT id, status FROM orders WHERE id = ?', [Number(order_id)]);
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy đơn hàng #${order_id}`
            });
        }

        // Lấy thông tin sản phẩm và kiểm tra tồn kho từ Product Service
        const token = req.token || (req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : '');
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        let productName = product_name;
        let itemUnitPrice = unit_price !== undefined ? Number(unit_price) : null;

        try {
            const productRes = await axios.get(`${PRODUCT_SERVICE_URL}/${product_id}`, {
                headers: authHeader,
                timeout: 4000
            });
            const product = productRes.data?.data;
            if (product) {
                if (!productName) productName = product.name;
                if (itemUnitPrice === null || isNaN(itemUnitPrice)) itemUnitPrice = Number(product.price);

                if (product.quantity < parsedQuantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm "${product.name}" không đủ tồn kho (còn: ${product.quantity})`
                    });
                }
            }
        } catch (err) {
            if (!productName || itemUnitPrice === null) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể xác minh sản phẩm #${product_id} từ Product Service`
                });
            }
        }

        const totalPrice = parsedQuantity * itemUnitPrice;

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
            [Number(order_id), Number(product_id), productName, parsedQuantity, itemUnitPrice, totalPrice]
        );

        // Cập nhật lại tổng tiền đơn hàng cha
        await recalculateOrderTotal(Number(order_id), conn);

        await conn.commit();

        const [newItem] = await pool.query('SELECT * FROM order_items WHERE id = ?', [result.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Thêm mặt hàng thành công',
            data: newItem[0]
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Lỗi createOrderItem:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi thêm mặt hàng',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
    }
};

// 4. Cập nhật mặt hàng (số lượng, đơn giá)
const updateOrderItem = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { quantity, unit_price } = req.body;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID mặt hàng không hợp lệ'
            });
        }

        const [existing] = await pool.query('SELECT * FROM order_items WHERE id = ?', [Number(id)]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy mặt hàng #${id}`
            });
        }

        const current = existing[0];
        const newQuantity = quantity !== undefined ? Number(quantity) : current.quantity;
        const newUnitPrice = unit_price !== undefined ? Number(unit_price) : Number(current.unit_price);

        if (newQuantity <= 0 || isNaN(newQuantity)) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải lớn hơn 0'
            });
        }

        const newTotalPrice = newQuantity * newUnitPrice;

        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.query(
            'UPDATE order_items SET quantity = ?, unit_price = ?, total_price = ? WHERE id = ?',
            [newQuantity, newUnitPrice, newTotalPrice, Number(id)]
        );

        // Cập nhật lại tổng tiền đơn hàng cha
        await recalculateOrderTotal(current.order_id, conn);

        await conn.commit();

        const [updatedRows] = await pool.query('SELECT * FROM order_items WHERE id = ?', [Number(id)]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật mặt hàng thành công',
            data: updatedRows[0]
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Lỗi updateOrderItem:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật mặt hàng',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
    }
};

// 5. Xóa một mặt hàng trong đơn hàng
const deleteOrderItem = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID mặt hàng không hợp lệ'
            });
        }

        const [existing] = await pool.query('SELECT * FROM order_items WHERE id = ?', [Number(id)]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy mặt hàng #${id} để xóa`
            });
        }

        const item = existing[0];

        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.query('DELETE FROM order_items WHERE id = ?', [Number(id)]);

        // Cập nhật lại tổng tiền đơn hàng cha
        await recalculateOrderTotal(item.order_id, conn);

        await conn.commit();

        return res.status(200).json({
            success: true,
            message: `Đã xóa mặt hàng #${id}`,
            data: item
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Lỗi deleteOrderItem:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa mặt hàng',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    getAllOrderItems,
    getOrderItemById,
    createOrderItem,
    updateOrderItem,
    deleteOrderItem
};
