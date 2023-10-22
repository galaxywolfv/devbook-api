const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const { SECRET_KEY } = process.env;

const encryptToken = (token) => {
    const encryptedToken = CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
    return encryptedToken;
};

const decryptToken = (encryptedToken) => {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedToken;
};

const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        if (!token) {
            reject("A token is required for authentication");
        }
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            resolve(decoded);
        } catch (err) {
            reject("Invalid Token");
        }
    });
};

const auth = async (req, res, next) => {
    const token = req.headers["bearer"] || req.body.token;
    if (!token) {
        return res.status(401).send("A token is required for authentication");
    }
    try {
        const user = await getUserFromToken(token);
        req.user = user;
    } catch (err) {
        return res.status(401).send("Error: Authorization failed.");
    }
    return next();
};

const checkPermission = async (req, res, next) => {
    const token = req.headers["bearer"] || req.body.token;
    if (!token) {
        return res.status(401).send("A token is required for authentication");
    }
    try {
        const user = await getUserFromToken(token);
        if (user.role === 0) {
            req.user = user;
            return next();
        } else {
            return res.status(403).send("Access denied. Insufficient role permissions.");
        }
    } catch (err) {
        return res.status(401).send("Error: Authorization failed.");
    }
};

const getUserFromToken = async (token) => {
    try {
        const decryptedToken = decryptToken(token);
        const user = await verifyToken(decryptedToken);
        return user;
    } catch (err) {
        return null;
    }
};

module.exports = {
    encryptToken,
    auth,
    checkPermission
};