const pool = require('../config/db');

// Lấy danh sách tất cả sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, description, image, price, quantity, created_at, updated_at FROM products ORDER BY id ASC'
        );

        return res.status(200).json({
            success: true,
            total: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Lỗi getAllProducts:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi lấy danh sách sản phẩm',
            error: error.message
        });
    }
};

// Lấy chi tiết một sản phẩm theo id
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID sản phẩm không hợp lệ'
            });
        }

        const [rows] = await pool.query(
            'SELECT id, name, description, image, price, quantity, created_at, updated_at FROM products WHERE id = ?',
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy sản phẩm #${id}`
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Lỗi getProductById:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm sản phẩm',
            error: error.message
        });
    }
};

// Thêm mới sản phẩm
const createProduct = async (req, res) => {
    try {
        const { name, description, image, price, quantity } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Tên sản phẩm không được để trống'
            });
        }

        if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá sản phẩm không hợp lệ'
            });
        }

        let parsedQuantity = 0;
        if (quantity !== undefined && quantity !== null) {
            if (isNaN(quantity) || !Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng phải là số nguyên không âm'
                });
            }
            parsedQuantity = Number(quantity);
        }

        const trimmedName = name.trim();
        const trimmedDescription = description ? description.trim() : null;
        const trimmedImage = image && typeof image === 'string' && image.trim() !== '' ? image.trim() : null;
        const parsedPrice = Number(price);

        const [result] = await pool.query(
            'INSERT INTO products (name, description, image, price, quantity) VALUES (?, ?, ?, ?, ?)',
            [trimmedName, trimmedDescription, trimmedImage, parsedPrice, parsedQuantity]
        );

        const [newProduct] = await pool.query(
            'SELECT id, name, description, image, price, quantity, created_at, updated_at FROM products WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Thêm sản phẩm thành công',
            data: newProduct[0]
        });
    } catch (error) {
        console.error('Lỗi createProduct:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi thêm sản phẩm',
            error: error.message
        });
    }
};

// Cập nhật thông tin sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID sản phẩm không hợp lệ'
            });
        }

        const [existing] = await pool.query(
            'SELECT * FROM products WHERE id = ?',
            [Number(id)]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy sản phẩm #${id} để cập nhật`
            });
        }

        const currentProduct = existing[0];
        const { name, description, image, price, quantity } = req.body;

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Tên sản phẩm không được để trống'
                });
            }
        }

        if (price !== undefined) {
            if (isNaN(price) || Number(price) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giá sản phẩm không hợp lệ'
                });
            }
        }

        if (quantity !== undefined) {
            if (isNaN(quantity) || !Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng phải là số nguyên không âm'
                });
            }
        }

        const updatedName = name !== undefined ? name.trim() : currentProduct.name;
        const updatedDescription = description !== undefined ? (description ? description.trim() : null) : currentProduct.description;
        const updatedImage = image !== undefined ? (image && image.trim() !== '' ? image.trim() : null) : currentProduct.image;
        const updatedPrice = price !== undefined ? Number(price) : currentProduct.price;
        const updatedQuantity = quantity !== undefined ? Number(quantity) : currentProduct.quantity;

        await pool.query(
            'UPDATE products SET name = ?, description = ?, image = ?, price = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [updatedName, updatedDescription, updatedImage, updatedPrice, updatedQuantity, Number(id)]
        );

        const [updatedRows] = await pool.query(
            'SELECT id, name, description, image, price, quantity, created_at, updated_at FROM products WHERE id = ?',
            [Number(id)]
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            data: updatedRows[0]
        });
    } catch (error) {
        console.error('Lỗi updateProduct:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi cập nhật sản phẩm',
            error: error.message
        });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID sản phẩm không hợp lệ'
            });
        }

        const [existing] = await pool.query(
            'SELECT id, name, description, image, price, quantity FROM products WHERE id = ?',
            [Number(id)]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy sản phẩm #${id} để xóa`
            });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [Number(id)]);

        return res.status(200).json({
            success: true,
            message: `Đã xóa sản phẩm #${id}`,
            data: existing[0]
        });
    } catch (error) {
        console.error('Lỗi deleteProduct:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi xóa sản phẩm',
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
