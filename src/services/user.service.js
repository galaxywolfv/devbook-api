const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userModel = require("../models/user.model");
const { auth, encryptToken, checkPermission } = require('../middleware/auth');

require('mongodb');
require('dotenv').config();

const { SECRET_KEY, FACTOR } = process.env;

const router = express.Router();

router.post('/save', async (req, res) => {
    try {
        const reqUsername = req.body.username;
        const reqPassword = req.body.password;

        if (!(reqUsername && reqPassword)) {
            return res.status(400).send("All input is required");
        }

        const username = reqUsername.toLowerCase();

        const oldUser = await userModel.findOne({ username });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        const password = await bcrypt.hash(reqPassword, +FACTOR);

        const user = await userModel.create({
            username: username,
            password: password
        });

        const role = 1;

        const token = jwt.sign({ user_id: user._id, username, role },
            SECRET_KEY, { expiresIn: "1y" });

        return res.status(201).json(encryptToken(token));
    } catch (error) {
        console.error('Error saving data to MongoDB:', error);
        return res.status(500).json({ error: 'Failed to save data to the database' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const reqUsername = req.body.username;
        const reqPassword = req.body.password;

        if (!(reqUsername && reqPassword)) {
            return res.status(400).send("All input is required");
        }

        const username = reqUsername.toLowerCase();
        const password = reqPassword;

        const user = await userModel.findOne({ username });
        const role = user.role;

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ user_id: user._id, username, role },
                SECRET_KEY, { expiresIn: "1y" });

            return res.status(200).json(encryptToken(token));
        } else {
            return res.status(400).send("Invalid Credentials");
        }
    } catch (error) {
        console.error('Error saving data to MongoDB:', error);
        return res.status(500).json({ error: 'Failed to save data to the database' });
    }
});

router.get("/get-self", auth, async (req, res) => {
    try {
        const username = req.user.username
        const user = await userModel.findOne({ username });
        res.status(200).json(user);
    } catch (error) {
        console.error('Error from MongoDB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/get-all", checkPermission, async (req, res) => {
    try {
        const users = await userModel.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error from MongoDB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/get-one", checkPermission, async (req, res) => {
    try {
        const { username } = req.body;
        const user = await userModel.findOne({ username });
        res.status(200).json(user);
    } catch (error) {
        console.error('Error from MongoDB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;