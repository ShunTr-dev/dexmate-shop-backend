const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const errorHandler = require('../utils/error-handler');
const HttpError = require('../models/http-error');
const User = require('../models/user');

/**
 * Get mailing data for the logged-in user.
 *
 * This function retrieves the mailing data (name, surname, email, phone, and address information) for the logged-in user.
 * If a user is logged in, it returns the mailing data from the user's profile. If there's no logged-in user, it returns an empty object.
 *
 * @async
 * @function
 * @param {Object} req - The request object containing information about the user.
 * @param {Object} res - The response object to send the mailing data.
 * @param {function} next - The next function to call when the operation is complete or there's an error.
 * @returns {Object} The mailing data object containing name, surname, email, phone, address, address2, city, zip, and country fields.
 *                  If there's no logged-in user, an empty object is returned.
 * @throws {HttpError} If there's an error while fetching the user's profile data.
 */
const getMailingData = async (req, res, next) => {
    let user;
    if (req.userData) {
        try {
            // TO DO hacer que el -select funcione
            user = await User.findById(req.userData.userId).select('-password, -payment_data, -avatar, -whishlist, -cart, -orders, -dateOfBirth, -legal, -subscribe_newsletter, -token');
            //console.log(user);
        } catch (error) {
            return errorHandler(req, res, 'Fetching user failed, please try again later.', 500, error);
        }

        if(!user) {
            return errorHandler(req, res, 'Could not find user for the provided id.', 500, null);
        }
        
        return res.json({
            name: user.name,
            surname: user.surname,
            email: user.email,
            phone: user.phone,
            address: user.mailing_addresses[0]?.address,
            address2: user.mailing_addresses[0]?.address2,
            city: user.mailing_addresses[0]?.city,
            zip: user.mailing_addresses[0]?.zipCode,
            country: user.mailing_addresses[0]?.country
        });
    } else {
        return res.json({});
    }
};

/**
 * Register a new user.
 *
 * This function handles the registration process for a new user. It takes the user's email, password, reminders, and terms_conditions as input.
 * It creates a new user using the provided information and stores it in the database.
 * If the registration is successful, it generates a JWT token for the user and returns it along with the user's ID, email, and initial cart data.
 *
 * @async
 * @function
 * @param {Object} req - The request object containing the user's registration data in the body.
 * @param {Object} res - The response object to send the registration result and token.
 * @param {function} next - The next function to call when the registration process is complete or there's an error.
 * @returns {Object} An object containing the user's ID, email, initial cart data, a value truthy if is admin, and a JWT token upon successful registration.
 * @throws {HttpError} If there are validation errors in the registration data (e.g., invalid email or password format).
 * @throws {HttpError} If there's an error while creating the user or generating the JWT token.
 */
const register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorHandler(req, res, 'Invalid inputs passed, please check your data.', 422, errors);
    }

    const { email, password, reminders, terms_conditions } = req.body;

    let createdUser;
    try {
        createdUser = await createUser(new User({
            email,
            password: password,
            legal: terms_conditions,
            subscribe_newsletter: reminders,
        }));
    } catch (error) {
        return errorHandler(req, res, error.message, error.code, null);
    }
    

    let token;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            `${process.env.SECRET_SEED}`, // seed para cifrar
            { expiresIn: `${process.env.SESSION_DURATION}` }
        );
    } catch (error) {
        return errorHandler(req, res, 'Register failed (JWT), please try again later.', 500, error);
    }

    const isAdmin = createdUser.groupId == '64be2e7b90b134d92ec1b68c' ? true : false;

    res.status(201).json({ userId: createdUser.id, email: createdUser.email, cart: createdUser.cart, isAdmin: isAdmin, token: token });
};

/**
 * Log in an existing user.
 *
 * This function handles the login process for an existing user. It takes the user's email and password as input.
 * It searches for the user with the provided email in the database and verifies the password.
 * If the login is successful, it generates a JWT token for the user and returns it along with the user's ID, email, and initial cart data.
 *
 * @async
 * @function
 * @param {Object} req - The request object containing the user's login credentials (email and password) in the body.
 * @param {Object} res - The response object to send the login result and token.
 * @param {function} next - The next function to call when the login process is complete or there's an error.
 * @returns {Object} An object containing the user's ID, email, initial cart data, a value truthy if is admin, and a JWT token upon successful login.
 * @throws {HttpError} If there's an error while searching for the user, verifying the password, or generating the JWT token.
 * @throws {HttpError} If the provided email is not found in the database or the password is incorrect.
 */
const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorHandler(req, res, 'Invalid inputs passed, please check your data.', 422, errors);
    }

    const { email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return errorHandler(req, res, 'Logging in failed, please try again later.', 500, error);
    }

    if (!existingUser) {
        return errorHandler(req, res, 'Invalid credentials, could not log you in.', 403, null);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password); // Se comparan las contraseñas
    } catch (error) {
        return errorHandler(req, res, 'Could not log you in, please check your credentials and try again.', 500, error);
    }

    if (!isValidPassword) {
        return errorHandler(req, res, 'Invalid credentials, could not log you in.', 403, null);
    }

    let token;
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            `${process.env.SECRET_SEED}`,
            { expiresIn: `${process.env.SESSION_DURATION}` }
        );
    } catch (error) {
        return errorHandler(req, res, 'Logging in failed, please try again later.', 500, error);
    }

    const isAdmin = existingUser.groupId == '64be2e7b90b134d92ec1b68c' ? true : false;

    // console.log({ userId: existingUser.id, email: existingUser.email, cart: existingUser.cart, isAdmin: isAdmin, token: token });

    res.json({ userId: existingUser.id, email: existingUser.email, cart: existingUser.cart, isAdmin: isAdmin, token: token });
};

/**
 * Unsubscribe a user from the newsletter.
 *
 * This function unsubscribes a user from the newsletter by setting the "subscribe_newsletter" field to false.
 * It takes the unsubscribe newsletter token as input to identify the user who wants to unsubscribe.
 * If the token matches a user in the database, the function updates the user's "subscribe_newsletter" field to false.
 *
 * @async
 * @function
 * @param {Object} req - The request object containing the unsubscribe newsletter token in the params.
 * @param {Object} res - The response object to send the result of the unsubscription.
 * @param {function} next - The next function to call when the unsubscription process is complete or there's an error.
 * @returns {Object} A JSON object containing a message indicating successful unsubscription.
 * @throws {HttpError} If there's an error while searching for the user or updating the "subscribe_newsletter" field.
 */
const unsubscribeNewsletter = async (req, res, next) => {
    const unsubscribeNewsletterToken = req.params.unt;

    let existingUser;

    try {
        existingUser = await User.findOne({ unsubcribeNewsletterToken: unsubscribeNewsletterToken });
    } catch (err) {
        return errorHandler(req, res, 'Logging in failed, please try again later.', 500, error);
    }

    existingUser.subscribe_newsletter = false;
    existingUser.save();

    res.json({ message: 'Unsubscribed successfully' });
}

/**
 * Creates a new user in the database.
 * 
 * Comprueba si el usuario existe en la base de datos (Email)
 * Si existe, le mete un hash a la contraseña
 * Y le mete un token para que pueda desuscribirse de la newsletter
 * Lo guarda
 * Y le envía un email (Si el usuario no tiene isFake a TRUE) al correo avisar al usuario que se ha registrado
 * 
 * @async
 * @function
 * @param {object} user - The user object containing user details such as email, password, etc.
 * @returns {Promise<object>} The newly created user object.
 * @throws {HttpError} If there's an issue while creating the user, it throws an HttpError with an appropriate error message and status code.
 * 
 * @throws {HttpError} If the user with the same email already exists, it throws an HttpError with a status code of 409 (Conflict).
 */
const createUser = async (user) => {
    let createdUser = user;
    let existingUser;
    try {
        existingUser = await User.findOne({ email: createdUser.email });
    } catch (error) {
        throw new HttpError('Register failed, please try again later.', 500);
    }

    if (existingUser) {
        throw new HttpError('User exists already, please login instead.', 409);
    }

    if (createdUser.password === undefined) {
        createdUser.password = crypto.randomBytes(32).toString('hex');
    }

    createdUser.unsubcribeNewsletterToken = crypto.randomBytes(32).toString('hex');

    try {
        createdUser.password = await bcrypt.hash(createdUser.password, 12);
    } catch (error) {
        throw new HttpError('Could not create user, please try again.', 500);
    }

    try {
        await createdUser.save();
    } catch (error) {
        throw new HttpError('Register failed, please try again later.', 500);
    }

    if (!createdUser.isFake && createdUser.active) {
        const sgMail = require('@sendgrid/mail');

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const msg = {
            to: createdUser.email,
            from: 'dexmate_shop@proton.me',
            templateId: process.env.SENDGRID_TEMPLATE_NEW_USER_ID.trim(),
            dynamicTemplateData: {
                subject: `New user in ${process.env.REACT_APP_SHOP_NAME}`,
                url_login: '/login',
                url_terms_and_conditions: '/legal/terms-of-service',
                url_unsubscribe: '/user/unsubscribe/' + createdUser.unsubcribeNewsletterToken,
            }
        };
        sgMail.send(msg);
    }

    return createdUser;
}

/**
 * Sends a reset password email to the user with the provided email address.
 *
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the email is sent or rejects with an error.
 */
const sendResetPasswordEmail = async (req, res, next) => {
    const { email } = req.body;
    
    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return errorHandler(req, res, 'Error finding the user.', 500, error);
    }

    if (!existingUser) {
        return errorHandler(req, res, 'No user found with this email.', 409, null);
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    existingUser.resetPasswordToken = resetPasswordToken;
    existingUser.save();

    if (!existingUser.isFake && existingUser.active) {
        const sgMail = require('@sendgrid/mail');

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: existingUser.email,
            from: 'dexmate_shop@proton.me',
            templateId: process.env.SENDGRID_TEMPLATE_PASSWORD_RECOVERY_ID.trim(),
            dynamicTemplateData: {
                subject: `Password recovery for ${process.env.REACT_APP_SHOP_NAME}`,
                url_terms_and_conditions: '/legal/terms-of-service',
                url_unsubscribe: '/user/unsubscribe/' + existingUser.unsubcribeNewsletterToken,
                url_password_recovery: '/user/password-reset/' + resetPasswordToken,
            }
        };
        sgMail.send(msg);
    }

    res.json({ message: 'Reset email sended' });
}

/**
 * Resets the password for the user with the provided reset token.
 *
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the password is reset or rejects with an error.
 */
const resetPassword = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return errorHandler(req, res, 'Invalid inputs passed, please check your data.', 422, null);
    }

    const { token, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ resetPasswordToken: token, active: true });
    } catch (error) {
        return errorHandler(req, res, 'Fetching user failed, please try again later.', 404, error);
    }

    if (!existingUser) {
        return errorHandler(req, res, 'User not found.', 404, null);
    }

    try {
        existingUser.password = await bcrypt.hash(password, 12);
    } catch (error) {
        return errorHandler(req, res, 'Could not reset password, please try again.', 500, error);
    }

    try {
        await existingUser.save();
    } catch (error) {
        return errorHandler(req, res, 'Reset password, please try again later.', 500, error);
    }

    res.json({ message: 'Password reset' });
}

exports.getMailingData = getMailingData;
exports.register = register;
exports.login = login;
exports.unsubscribeNewsletter = unsubscribeNewsletter;
exports.createUser = createUser;
exports.sendResetPasswordEmail = sendResetPasswordEmail;
exports.resetPassword = resetPassword;