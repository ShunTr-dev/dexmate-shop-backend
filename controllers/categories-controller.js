const mongoose = require('mongoose');

//const HttpError = require('../models/http-error');
const errorHandler = require('../utils/error-handler');

const { s3UploaderFile, deleteFileS3 } = require('../utils/s3');
const { getTranslationFromDeepl } = require('../controllers/translations-controller');
const crypto = require('crypto');
const sharp = require('sharp');

const ProductCategory = require('../models/product-category');
const Product = require('../models/product');

const { createImagesDalle } =  require("../utils/open-ai");

/**
 * Get all product categories.
 *
 * This function fetches all the product categories available in the database.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the categories or if no categories are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of product categories.
 */
const getAllCategories = async (req, res, next) => {
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
		categories: categories.map(category =>
			category.toObject({ getters: true })
		)
	});
}

/**
 * Get Top selling product categories.
 *
 * This function fetches all the top selling product categories available in the database.
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the categories or if no categories are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of product categories.
 */
const getTopCategories = async (req, res, next) => {
	let categories;

	try {
		categories = await ProductCategory.find().sort({ "numberOfProducts": 'desc' }).limit(4);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a categories.', 500, error);
	}

	if (!categories) {
		return errorHandler(req, res, 'Could not find categories.', 404, null);
	}

	res.json({
		categories: categories.map(product =>
			product.toObject({ getters: true })
		)
	});
}

/**
 * Get a product category by id.
 *
 * This function fetches a product category by its id identified by `req.params.cid`.
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the categories or if no categories are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of product categories.
 */
const getCategoryById = async (req, res, next) => {
	const categoryId = req.params.cid;

	let category;
	try {
		category = await ProductCategory.findById(categoryId);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a category.', 500, error);
	}

	if (!category) {
		return errorHandler(req, res, 'Could not find category for the provided id.', 404, null);
	}

	res.json({ category: category.toObject({ getters: true }) });
};




const countProductsByCategory = async () => {
	try {
		categories = await ProductCategory.find();
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a categories.', 500, error);
	}

	if (categories) {
		categories.map(async category => {
			category.numberOfProducts = await Product.find({ category: { $in: [ category._id ]}, visible: true }).count();
			category.save();
		});
	}
}

const calculateSellsByCategory = async () => { // TO DO: añadir esto a la venta de productos
	try {
		categories = await ProductCategory.find();
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find categories.', 500, error);
	}

	if (categories) {
		categories.map(async category => { // TO DO: Hacer esto con un aggregate
			category.sells = 0;

			await Product.find({ category: { $in: [ category._id ]} }).then(products => {
				products.map(product => {
					category.sells += product.sells;
				});
			});

			category.save();
		});
	}
}
























const addCategory = async (req, res, next) => {
	if (req.userData) {

		let category;

		const nameEn = await getTranslationFromDeepl(req.body.name, null, 'en-GB');
		const nameEs = await getTranslationFromDeepl(req.body.name, null, 'es');

		try {
			category = new ProductCategory({
				name: [{
					"en": nameEn,
					"es": nameEs
				}],
				numberOfProducts: 0,
				sells: 0
			});
			await category.save();
		} catch (error) {
			return errorHandler(req, res, error.message, error.code, error);
		}

		const generatedImagesByDalle = await createImagesDalle('the main image for a e-shop of clothing for the category ' + nameEn, 1, req.userData.userId);

		generatedImagesByDalle.map(async image => {
			category.image.push(image);
		});

		await category.save();

		res.json({ categoryId: category._id });
	} else {
		return errorHandler(req, res, 'Unauthoriced.', 401, null);
	}

}


const getInfoToEditCategory = async (req, res, next) => {
	const categoryId = req.params.cid;

	let category;
	try {
		category = await ProductCategory.findById(categoryId);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a category.', 500, error);
	}

	if (!category) {
		return errorHandler(req, res, 'Could not find category for the provided id.', 404, null);
	}

	res.json({
		category: category.toObject({ getters: true })
	});
}


const editCategory = async (req, res, next) => {
	if (req.userData) {

		let category;
		const categoryId = req.body.id;
		try {
			category = await ProductCategory.findById(categoryId);
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find a category.', 500, error);
		}

		if (!category) {
			return errorHandler(req, res, 'Could not find category for the provided id.', 404, null);
		}

		category.name = [{
			"en": req.body.nameEn,
			"es": req.body.nameEs
		}];


		// TO DO hacer que multer no modifique este campo
		if (req.body['imagesToDelete.0']) { // If there are images to delete
			let havingImagesToDelete = true;
			let i = 0;
			while (havingImagesToDelete) {
				if (req.body['imagesToDelete.' + i]) {
					category.image = category.image.filter(img => img !== req.body['imagesToDelete.' + i]);
					await deleteFileS3(req.body['imagesToDelete.' + i]);
					i += 1;
				} else {
					havingImagesToDelete = false;
				}
			}
		}

		try {
			await category.save();
		} catch (error) {
			return errorHandler(req, res, 'Error saving the category, please try later', 500, error);
		}

		if (req.files) { //TO DO, ver por que no espera a subir la imagen
			req.files.map(async file => {
				try {
					category.image.push.push(await s3UploaderFile(file.buffer, req.userData.userId));
					await category.save();
				} catch (error) {
					return errorHandler(req, res, 'Error handling the image', 500, error);
				}
			});
		}

		res.json({ category: category.toObject({ getters: true }) });
	} else {
		return errorHandler(req, res, 'Unauthoriced.', 401, null);
	}

}


const deleteCategory = async (req, res, next) => {
	if (req.userData) {
		const categoryId = req.params.cid;

		let category;
		try {
			category = await ProductCategory.findById(categoryId);

			if (category.image) {
				category.image.map(async image => {
					await deleteFileS3(image);
				});
			}

		} catch (error) {
			return errorHandler(req, res, 'Could not find category for the provided id.', 404, error);
		}

		if (!category) {
			return errorHandler(req, res, 'Could not find category for the provided id.', 404, null);
		}

		try {
			await ProductCategory.deleteOne({ _id: categoryId })
			await Product.updateMany({ category: [categoryId] }, { $pull: { category: categoryId } });
		} catch (error) {
			return errorHandler(req, res, 'Error deleting the category, please try later', 500, error);
		}

		return res.json({ message: 'Category deleted.' });
	} else {
		return errorHandler(req, res, 'Unauthoriced.', 401, null);
	}
}












exports.getAllCategories = getAllCategories;
exports.getTopCategories = getTopCategories;
exports.getCategoryById = getCategoryById;

exports.countProductsByCategory = countProductsByCategory;

exports.addCategory = addCategory;
exports.getInfoToEditCategory = getInfoToEditCategory;
exports.editCategory = editCategory;
exports.deleteCategory = deleteCategory;

exports.calculateSellsByCategory = calculateSellsByCategory;