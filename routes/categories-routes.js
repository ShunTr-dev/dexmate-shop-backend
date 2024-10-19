const express = require('express');
const multer = require('multer');

const categoriesControllers = require('../controllers/categories-controller');
const router = express.Router();
const checkAdmin = require('../middleware/check-admin');

router.get('/list', categoriesControllers.getAllCategories);
router.get('/top', categoriesControllers.getTopCategories);
router.get('/:cid', categoriesControllers.getCategoryById);



// ---- checkAdmin - Middeware para ver si el usuario es ADMIN, A partir de aquí todas las rutas son para ADMIN ---------------------------------------------------------

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/bmp' || file.mimetype === 'image/webp' || file.mimetype === 'image/gif' ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

router.post('/admin/add-category/', checkAdmin, multer({storage: multer.memoryStorage(), fileFilter: fileFilter}).any('newImages'), categoriesControllers.addCategory);
router.get('/admin/getInfoToedit/:cid', checkAdmin, categoriesControllers.getInfoToEditCategory);
router.post('/admin/edit-category/', checkAdmin, multer({storage: multer.memoryStorage(), fileFilter: fileFilter}).any('newImages'), categoriesControllers.editCategory);
router.delete('/admin/delete-category/:cid', checkAdmin, categoriesControllers.deleteCategory);

module.exports = router;
