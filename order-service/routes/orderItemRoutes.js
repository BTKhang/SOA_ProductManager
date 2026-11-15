const express = require('express');
const router = express.Router();
const orderItemController = require('../controllers/orderItemController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', orderItemController.getAllOrderItems);
router.get('/:id', orderItemController.getOrderItemById);
router.post('/', orderItemController.createOrderItem);
router.put('/:id', orderItemController.updateOrderItem);
router.delete('/:id', orderItemController.deleteOrderItem);

module.exports = router;
