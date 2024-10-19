const express = require('express');

const fakerControllers = require('../controllers/data-faker-controller');

const router = express.Router();

router.get('/addUsers/:num_users_to_add', fakerControllers.addFakeUsers);

router.get('/addOrders/:num_orders_to_add', fakerControllers.addFakeOrders);

module.exports = router;
