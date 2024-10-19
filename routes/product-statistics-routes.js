const express = require('express');

const productsStatisticsControllers = require('../controllers/products-statistics-controller');
const checkAdmin = require('../middleware/check-admin');

const router = express.Router();
//router.get('/actualice-statistics', productsStatisticsControllers.actualiceProductStatistics);

// ---- Middeware para ver si el usuario es ADMIN, A partir de aquí todas las rutas son para ADMIN ---------------------------------------------------------
// router.use(checkAdmin); 
router.get('/products/:pid', checkAdmin, productsStatisticsControllers.getProductStatisticsById);


module.exports = router;