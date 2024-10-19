const express = require('express');

const generalStatisticsControllers = require('../controllers/general-statistics-controller');
const checkAdmin = require('../middleware/check-admin');

const router = express.Router();

// ---- Middeware para ver si el usuario es ADMIN, A partir de aquí todas las rutas son para ADMIN ---------------------------------------------------------
// router.use(checkAdmin); 


router.get('/add-general-statistics', generalStatisticsControllers.addGeneralStatistics);
router.get('/get-general-statistics', checkAdmin, generalStatisticsControllers.getGeneralStatistics);
//router.get('/actualice-user-statistics', generalStatisticsControllers.actualiceUserStatistics);

module.exports = router;