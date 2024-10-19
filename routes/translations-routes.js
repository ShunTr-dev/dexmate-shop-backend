const express = require('express');
//const { check } = require('express-validator');

const translationsControllers = require('../controllers/translations-controller');
// const fileUpload = require('../middleware/file-upload');
// const checkAuth = require('../middleware/check-auth');
const checkAdmin = require('../middleware/check-admin');

const router = express.Router();
// ---- Middeware para ver si el usuario es ADMIN, A partir de aquí todas las rutas son para ADMIN ---------------------------------------------------------
router.post('/', checkAdmin, translationsControllers.getTranslation);

//router.get('/admin/list', translationsControllers.aaaaaaaa);

module.exports = router;