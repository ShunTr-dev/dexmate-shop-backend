const mongoose = require('mongoose');
const errorHandler = require('../utils/error-handler');
const crypto = require('crypto');

const { s3UploaderFile, deleteFileS3 } = require('../utils/s3');
const { createImagesDalle } = require("../utils/open-ai");
const { getTranslationFromDeepl } = require('../controllers/translations-controller');
const { countProductsByCategory } = require('../controllers/categories-controller');

const productsStatisticsControllers = require('../controllers/products-statistics-controller');
const Product = require('../models/product');
const ProductCategory = require('../models/product-category');
const ProductStatistic = require('../models/product-statistic');



/**
 * Get all visible products.
 *
 * This function fetches all the visible products available in the database. The visibility of a product is
 * determined by the `visible` property. Only products with `visible: true` are included in the response.
 *
 * Each product object includes information about the product and its associated category, populated using
 * the `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the products or if no visible products are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of visible products.
 */
const getAllProducts = async (req, res, next) => {
    let products;

    try {
        products = await Product.find({ visible: true }).sort({ sells: -1 }).populate('category');
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}

/**
 * Get 8 featured products.
 *
 * This function fetches 8 featured products available in the database. The visibility of a product is
 * determined by the `visible` property. Only products with `visible: true` are included in the response.
 *
 * Each product object includes information about the product and its associated category, populated using
 * the `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the products or if no visible products are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of visible products.
 */
const getFeaturedProducts = async (req, res, next) => {
    let products;

    try {
        products = await Product.find({ visible: true }).populate('category').limit(8);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}

/**
 * Get the related products.
 *
 * This function fetches 9 or related products visible products available in the database. The visibility of a product is
 * determined by the `visible` property. Only products with `visible: true` are included in the response.
 *
 * Each product object includes information about the product and its associated category, populated using
 * the `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the products or if no visible products are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of visible products.
 * @example
 * // Assuming you have an Express app set up and a route defined for this function.
 * // For example, if you have a route like: app.get('/products', getAllProducts);
 * // You can use the function as follows:
 * const express = require('express');
 * const app = express();
 * // Import the function getAllProducts from its file.
 * const { getAllProducts } = require('./path/to/your/file');
 *
 * // Define the route using the function.
 * app.get('/products', getAllProducts);
 * // Now you can get all the visible products by making a GET request to the defined route,
 * // for example: GET /products
 * // The function will respond with a JSON object containing an array of visible products.
 */
const getRelatedProducts = async (req, res, next) => {
    const productId = req.params.pid;
    let products;

    try {
        products = await Product.find({ _id: { $ne: productId.toString() }, visible: true }).limit(9).populate('category');
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}

/**
 * Get a product by its ID.
 *
 * This function fetches a product with the specified ID from the database and populates the associated category.
 * It also increments the view count for the product by calling the `addMetricViewsToProduct` function from the
 * `productsStatisticsControllers` module, passing the product ID and the authenticated user ID (if available).
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the product or if no product is found.
 * @returns {import('express').Response} A response with a JSON object containing the product details.
 */
const getProductById = async (req, res, next) => {
    const productId = req.params.pid;

    let product;
    try {
        product = await Product.findById(productId).populate('category');
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!product) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    let userId = null;
    if (req.userData) {
        userId = req.userData.userId;
    }

    productsStatisticsControllers.addMetricViewsToProduct(product._id, userId);

    res.json({ product: product.toObject({ getters: true }) });
};

/**
 * Get products by category ID.
 *
 * This function fetches all the products belonging to the specified category ID from the database.
 * Only products with `visible: true` and matching the specified category ID are included in the response.
 *
 * Each product object includes information about the product and its associated category, populated using
 * the `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the products or if no products are found for the specified category ID.
 * @returns {import('express').Response} A response with a JSON object containing an array of products for the specified category.
 */
const getProductsByCategory = async (req, res, next) => {
    let categoryId = req.params.cid;
    let products;

    try {
        products = await Product.find({  category: { $in: [ categoryId ]}, visible: true }).sort({ sells: -1 }).populate('category');
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}

/**
 * Get top-rated products.
 *
 * This function fetches the top-rated products available in the database. The top-rated products are determined
 * by the `rating` property in descending order (highest rating to lowest). Only products with `visible: true`
 * are included in the response.
 *
 * Each product object includes information about the product and its associated category, populated using the
 * `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the top-rated products or if no top-rated products are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of top-rated products.
 */
const getTopRatedProducts = async (req, res, next) => {
    let products;

    try {
        products = await Product.find({ visible: true }).sort({ rating: 'desc' }).populate('category').limit(3);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}

/**
 * Get recommended products.
 *
 * This function fetches recommended products available in the database. The recommended products are simply a selection
 * of products with `visible: true` and can be determined based on any recommendation logic or business rules specific
 * to your application.
 *
 * Each product object includes information about the product and its associated category, populated using the
 * `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the recommended products or if no recommended products are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of recommended products.
 */
const getRecommendedProducts = async (req, res, next) => {
    let products;

    try {
        products = await Product.find({ visible: true }).populate('category').limit(3);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}

/**
 * Get popular products.
 *
 * This function fetches popular products available in the database. The popularity of products can be determined
 * based on the `sells` property in descending order (highest sells to lowest). Only products with `visible: true`
 * are included in the response.
 *
 * Each product object includes information about the product and its associated category, populated using the
 * `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the popular products or if no popular products are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of popular products.
 */
const getPopularProducts = async (req, res, next) => {
    let products;

    try {
        products = await Product.find({ visible: true }).sort({ sells: 'desc' }).populate('category').limit(3);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}






const getHomeProducts = async (req, res, next) => {
    //GET TOP RATED PRODUCTS
    let topRatedProducts;

    try {
        topRatedProducts = await Product.find({ visible: true }).sort({ rating: 'desc' }).populate('category').limit(3);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!topRatedProducts) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    //GET RECOMMENDED PRODUCTS
    let recommendedProducts;

    try {
        recommendedProducts = await Product.find({ visible: true }).populate('category').limit(3);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!recommendedProducts) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    // GET POPULAR PRODUCTS
    let popularProducts;

    try {
        popularProducts = await Product.find({ visible: true }).sort({ sells: 'desc' }).populate('category').limit(3);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!popularProducts) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    // GET FEATURED PRODUCTS
    let featuredProducts;

    try {
        featuredProducts = await Product.find({ visible: true }).populate('category').limit(8);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!featuredProducts) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }


    res.json({
        topRatedProducts: topRatedProducts.map(product =>
            product.toObject({ getters: true })
        ),
        recommendedProducts: recommendedProducts.map(product =>
            product.toObject({ getters: true })
        ),
        popularProducts: popularProducts.map(product =>
            product.toObject({ getters: true })
        ),
        featuredProducts: featuredProducts.map(product =>
            product.toObject({ getters: true })
        )
    });

}

/**
 * Get all visible products.
 *
 * This function fetches all the visible products available in the database. The visibility of a product is
 * determined by the `visible` property. Only products with `visible: true` are included in the response.
 *
 * Each product object includes information about the product and its associated category, populated using
 * the `category` field.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the products or if no visible products are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of visible products.
 */
const getAllProductsAdmin = async (req, res, next) => {
    let products;

    try {
        products = await Product.find().sort({ sells: -1 });
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!products) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    res.json({
        products: products.map(product =>
            product.toObject({ getters: true })
        )
    });
}

const getInfoToEditProduct = async (req, res, next) => {
    const productId = req.params.pid;

    let product;
    try {
        product = await Product.findById(productId);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
    }

    if (!product) {
        return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
    }

    let categories;
    try {
        categories = await ProductCategory.find();
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a categories.', 500, error);
    }

    if (!categories) {
        return errorHandler(req, res, 'Could not find categories.', 404, null);
    }

    res.json({
        product: product.toObject({ getters: true }),
        categories: categories.map(product =>
            product.toObject({ getters: true })
        )
    });
}

const addProduct = async (req, res, next) => {
    if (req.userData) {
        creatorId = req.userData.userId;

        let product;
        let categories = [];

        // TO DO hacer que multer no modifique este campo
        if (req.body['categories.0']) {
            let havingCategories = true;
            let i = 0;
            while (havingCategories) {
                if (req.body['categories.' + i]) {
                    product.categories = categories.push(req.body['categories.' + i]);
                    i += 1;
                } else {
                    havingCategories = false;
                }
            }
        }

        try {
            product = await saveProduct(new Product({
                category: req.body.categories,
                title: [{
                    "en": req.body.titleEn,
                    "es": req.body.titleEs
                }],
                price: req.body.price,
                shortDescription: [{
                    "en": req.body.shortDescriptionEn,
                    "es": req.body.shortDescriptionEs
                }],
                largeDescription: [{
                    "en": req.body.largeDescriptionEn,
                    "es": req.body.largeDescriptionEs
                }],
                visible: req.body.visible,
                SKU: req.body.SKU,
                stock: req.body.stock,
                weight: req.body.weight,
                dimensions: req.body.dimensions,
                creatorId: creatorId,
                comments: [],
            }));
        } catch (error) {
            return errorHandler(req, res, error.message, error.code, error);
        }

        if (req.files) {
            req.files.map(async file => {
                try {
                    product.images.push(await s3UploaderFile(file.buffer, req.userData.userId));
                    await product.save();
                } catch (error) {
                    return errorHandler(req, res, 'Error handling the image', 500, error);
                }
            });
        }

        res.json({ product: product.toObject({ getters: true }) });
    } else {
        return errorHandler(req, res, 'Unauthoriced.', 401, null);
    }

}



const addProductWizard = async (req, res, next) => {
    const { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } = require("openai");
    let creatorId;

    if (req.userData) {
        creatorId = req.userData.userId;
    } else {
        creatorId = '64cb722f1adccab13cf8be3d'
        //return errorHandler(req, res, 'Unauthoriced.', 401, null);
    }

    let titleEn;
    let titleEs;
    try {
        titleEn = await getTranslationFromDeepl(req.body.title, null, 'en-GB');
        titleEs = await getTranslationFromDeepl(req.body.title, null, 'es');
    } catch (error) {
        return errorHandler(req, res, 'Error connecting with Deepl.', 500, error);
    }

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    let chatGPTresponse;
    try {
        chatGPTresponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: ChatCompletionRequestMessageRoleEnum.System,
                content: "Make product descriptions, return a JSON, with two fields shortDescription and largeDescription from the name I give you." 
            },{
                role: ChatCompletionRequestMessageRoleEnum.User,
                content: titleEn
            },],
            temperature: 0.6,
            max_tokens: 1000,
        });

        chatGPTresponseJSON = JSON.parse(chatGPTresponse.data.choices[0]?.message?.content);
        const shortDescriptionEn = chatGPTresponseJSON.shortDescription;
        const largeDescriptionEn = chatGPTresponseJSON.largeDescription;

        let shortDescriptionEs;
        let largeDescriptionEs;
        try {
            shortDescriptionEs = await getTranslationFromDeepl(shortDescriptionEn, null, 'es');
            largeDescriptionEs = await getTranslationFromDeepl(largeDescriptionEn, null, 'es');
        } catch (error) {
            return errorHandler(req, res, 'Error connecting with Deepl.', 500, error);
        }

        let product;
        try {
            product = await saveProduct(new Product({
                price: Math.floor(Math.random() * 80) + 1,
                rating: Math.floor(Math.random() * 5) + 1,
                category: ["64d8b9dba921ca3a177ac841"],
                title: [{
                    "en": titleEn,
                    "es": titleEs,
                }],
                price: Math.floor(Math.random() * 80) + 1,
                shortDescription: [{
                    "en": shortDescriptionEn,
                    "es": shortDescriptionEs
                }],
                largeDescription: [{
                    "en": largeDescriptionEn,
                    "es": largeDescriptionEs
                }],
                visible: true,
                creatorId: creatorId,
                comments: [],
            }));
        } catch (error) {
            return errorHandler(req, res, error.message, error.code, error);
        }

        const generatedImagesByDalle = await createImagesDalle('the main image for a e-shop of clothing for the product "' + titleEn + '", whith the description "' + largeDescriptionEn + '" ', 2, creatorId);

        generatedImagesByDalle.map(async image => {
            product.images.push(image);
        });

        await product.save();

        res.json({ productId: product._id });

        countProductsByCategory();
    } catch (error) {
        console.log(error);
        return errorHandler(req, res, error.response.statusText, error.response.status, null);
    }

}

const editProduct = async (req, res, next) => {
    if (req.userData) {

        let product;
        const productId = req.body.id;
        try {
            product = await Product.findById(productId);
        } catch (error) {
            return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
        }

        if (!product) {
            return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
        }

        let categories = [];
        // TO DO hacer que multer no modifique este campo
        if (req.body['categories.0']) {
            let havingCategories = true;
            let i = 0;
            while (havingCategories) {
                if (req.body['categories.' + i]) {
                    product.categories = categories.push(req.body['categories.' + i]);
                    i += 1;
                } else {
                    havingCategories = false;
                }
            }
        }

        product.category = categories;
        product.title = [{
            "en": req.body.titleEn,
            "es": req.body.titleEs
        }];
        product.price = req.body.price;
        product.shortDescription = [{
            "en": req.body.shortDescriptionEn,
            "es": req.body.shortDescriptionEs
        }];
        product.largeDescription = [{
            "en": req.body.largeDescriptionEn,
            "es": req.body.largeDescriptionEs
        }];
        product.visible = req.body.visible;
        product.SKU = req.body.SKU;
        product.stock = req.body.stock;
        product.weight = req.body.weight;
        product.dimensions = req.body.dimensions;

        // TO DO hacer que multer no modifique este campo
        if (req.body['imagesToDelete.0']) { // If there are images to delete
            let havingImagesToDelete = true;
            let i = 0;
            while (havingImagesToDelete) {
                if (req.body['imagesToDelete.' + i]) {
                    product.images = product.images.filter(img => img !== req.body['imagesToDelete.' + i]);
                    await deleteFileS3(req.body['imagesToDelete.' + i]);
                    i += 1;
                } else {
                    havingImagesToDelete = false;
                }
            }
        }

        try {
            await product.save();
        } catch (error) {
            return errorHandler(req, res, 'Error saving the product, please try later', 500, error);
        }

        if (req.files) {
            req.files.map(async file => {
                try {
                    product.images.push(await s3UploaderFile(file.buffer, req.userData.userId));
                    await product.save();
                } catch (error) {
                    return errorHandler(req, res, 'Error handling the image', 500, error);
                }
            });
        }

        countProductsByCategory();

        res.json({ product: product.toObject({ getters: true }) });
    } else {
        return errorHandler(req, res, 'Unauthoriced.', 401, null);
    }

}

const deleteProduct = async (req, res, next) => {
    if (req.userData) {
        const productId = req.params.pid;

        let product;
        try {
            product = await Product.findById(productId);

            if (product.images) {
                product.images.map(async image => {
                    await deleteFileS3(image);
                });
            }

        } catch (error) {
            return errorHandler(req, res, 'Could not find product for the provided id.', 404, error);
        }

        if (!product) {
            return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
        }

        try {
            await Product.deleteOne({ _id: productId })
            await ProductStatistic.deleteOne({ productId: productId });
        } catch (error) {
            return errorHandler(req, res, 'Error deleting the product, please try later', 500, error);
        }

        countProductsByCategory();

        return res.json({ message: 'Product deleted.' });
    } else {
        return errorHandler(req, res, 'Unauthoriced.', 401, null);
    }
}





//---------------------------------------------------------------------------------------
const saveProduct = async (product) => {

    let newProduct = product;

    if (newProduct.SKU === undefined) {
        newProduct.SKU = await crypto.randomBytes(32).toString('hex');
    }

    try {
        await newProduct.save();
    } catch (error) {
        console.log(error);

        throw new HttpError('Error creating the product, check the required fields.', 500);
    }

    const dateNow = new Date();
    const formatedDateNow = dateNow.toISOString().slice(0, 10);

    const ISODate = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 1).toISOString().slice(0, 10);
    const milisecondsDate = new Date(ISODate).valueOf();

    const productStatistic = new ProductStatistic({
        productId: newProduct._id,
        dailyStatistics: [{
            orders: 0,
            views: 0,
            sells: 0,
            dailyStatisticsDate: formatedDateNow,
            dailyStatisticsDateString: new Date(formatedDateNow).valueOf()
        }],
        monthlyStatistics: [{
            orders: 0,
            views: 0,
            sells: 0,
            monthlyStatisticsDate: ISODate,
            monthlyStatisticsDateString: milisecondsDate
        }]
    });

    try {
        await productStatistic.save();
    } catch (error) {
        throw new HttpError('Error creating the product statistics, check the required fields.', 500);
    }

    countProductsByCategory();

    return newProduct;
}



exports.getProductById = getProductById;
exports.getAllProducts = getAllProducts;
exports.getRelatedProducts = getRelatedProducts;
exports.getProductsByCategory = getProductsByCategory;
exports.getFeaturedProducts = getFeaturedProducts;
exports.getTopRatedProducts = getTopRatedProducts;
exports.getRecommendedProducts = getRecommendedProducts;
exports.getPopularProducts = getPopularProducts;
exports.getHomeProducts = getHomeProducts;

exports.getAllProductsAdmin = getAllProductsAdmin;
exports.getInfoToEditProduct = getInfoToEditProduct;
exports.saveProduct = saveProduct;
exports.addProduct = addProduct;
exports.addProductWizard = addProductWizard;
exports.editProduct = editProduct;
exports.deleteProduct = deleteProduct;