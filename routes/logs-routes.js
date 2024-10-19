const express = require('express');

const logsControllers = require('../controllers/logs-controller');

const router = express.Router();

router.get('/error-log', logsControllers.getlastErrorLogs);
router.get('/log', logsControllers.getlastLogs);

//router.get('/top', categoriesControllers.getTopCategories);

//router.get('/:cid', categoriesControllers.getCategoryById);

module.exports = router;
