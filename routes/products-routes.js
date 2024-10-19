const express = require('express');
const multer = require('multer');
//const { check } = require('express-validator');

const productsControllers = require('../controllers/products-controller');
// const fileUpload = require('../middleware/file-upload');
// const checkAuth = require('../middleware/check-auth');
const checkAdmin = require('../middleware/check-admin');

const router = express.Router();

router.get('/list', productsControllers.getAllProducts);

router.get('/category/:cid', productsControllers.getProductsByCategory);

router.get('/featuredProducts', productsControllers.getFeaturedProducts); // DEPRECATED
router.get('/topRatedProducts', productsControllers.getTopRatedProducts); // DEPRECATED
router.get('/recommendedProducts', productsControllers.getRecommendedProducts); // DEPRECATED
router.get('/popularProducts', productsControllers.getPopularProducts); // DEPRECATED
router.get('/homeProducts', productsControllers.getHomeProducts);
router.post('/add-product-wizard', productsControllers.addProductWizard);
router.get('/related/:pid', productsControllers.getRelatedProducts);

router.get('/:pid', productsControllers.getProductById);


// ---- checkAdmin - Middeware para ver si el usuario es ADMIN, A partir de aquí todas las rutas son para ADMIN ---------------------------------------------------------

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/bmp' || file.mimetype === 'image/webp' || file.mimetype === 'image/gif' ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

router.get('/admin/list', checkAdmin, productsControllers.getAllProductsAdmin);
router.post('/admin/add-product/', checkAdmin, multer({storage: multer.memoryStorage(), fileFilter: fileFilter}).any('newImages'), productsControllers.addProduct);
router.get('/admin/getInfoToedit/:pid', checkAdmin, productsControllers.getInfoToEditProduct);
router.post('/admin/edit-product/', checkAdmin, multer({storage: multer.memoryStorage(), fileFilter: fileFilter}).any('newImages'), productsControllers.editProduct);
router.delete('/admin/delete-product/:pid', checkAdmin, productsControllers.deleteProduct);

module.exports = router;