const express = require('express');
const { check } = require('express-validator');

const cartsControllers = require('../controllers/carts-controller');

const router = express.Router();

router.post('/checkout',
    [
        check('name').isLength({ min: 3 }).withMessage('Name is required'),
        check('surname').isLength({ min: 3 }).withMessage('Surname is required'),
        check('telephone').isLength({ min: 3 }).withMessage('Telephone is required'),
        check('address').isLength({ min: 3 }).withMessage('Address is required'),
        check('city').isLength({ min: 3 }).withMessage('City is required'),
        check('zip').isLength({ min: 3 }).withMessage('Zip is required'),
        check('country').isLength({ min: 3 }).withMessage('Country is required')
    ],
    cartsControllers.checkout);

router.post('/update', cartsControllers.updateCart);
router.get('/checkout-success/:oid', cartsControllers.checkoutSuccess);
router.get('/checkout-error/:oid', cartsControllers.checkoutError);

router.get('/:userId', cartsControllers.getUserCart);

module.exports = router;