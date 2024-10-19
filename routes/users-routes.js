const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controllers');

const router = express.Router();

router.get('/mailing-data', usersController.getMailingData);
router.post('/send-reset-email',[
	check('email').normalizeEmail().isEmail()
], usersController.sendResetPasswordEmail);

router.post('/reset-password',
	[
		check('token'),
		check('password').isLength({ min: 6 })
	],
	usersController.resetPassword);

router.post(
	'/register',
	[
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 6 }),
		check('reminders').isBoolean().withMessage('Reminder property only accepts boolean'),
		check('terms_conditions').isBoolean().withMessage('Terms and conditions property only accepts boolean')
	],
	usersController.register
);

router.post('/login',
	[
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 6 }),
	],
	usersController.login);

router.get('/unsubscribe-newsletter/:unt', usersController.unsubscribeNewsletter);
module.exports = router;