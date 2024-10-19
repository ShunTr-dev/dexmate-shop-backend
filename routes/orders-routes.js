const express = require('express');
const checkAdmin = require('../middleware/check-admin');

const ordersControllers = require('../controllers/orders-controller');

const router = express.Router();

router.get('/user-list', ordersControllers.getUserOrders);
router.get('/order-shipping-completed/:oid', ordersControllers.setOrderShippingStatusToCompleted);
router.get('/invoice/:oid', ordersControllers.getOrderInvoice);

// ---- checkAdmin - Middeware para ver si el usuario es ADMIN, A partir de aquí todas las rutas son para ADMIN ---------------------------------------------------------
router.get('/admin/list', checkAdmin, ordersControllers.getAllOrdersAdmin);
router.get('/admin/list/pending', checkAdmin, ordersControllers.getAllPendingOrdersAdmin);
router.get('/admin/list/cancelled', checkAdmin, ordersControllers.getAllCancelledOrdersAdmin);
router.get('/admin/list/completed', checkAdmin, ordersControllers.getAllCompletedOrdersAdmin);
router.get('/admin/list/pending-payment', checkAdmin, ordersControllers.getAllPendingPaymentOrdersAdmin);


module.exports = router;
