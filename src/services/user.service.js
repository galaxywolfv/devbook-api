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
        return res.status(500).json({ error: 'Invalid Credentials' });
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

router.get("/list/save/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.user;

        if (!(username && id)) {
            return res.status(400).send("Username and bookId are required");
        }

        // Find the user by username
        const user = await userModel.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the book is not already in the user's savedBooks
        const isBookAlreadySaved = user.savedBooks.some(
            (savedBookId) => savedBookId.toString() === id.toString()
        );

        if (isBookAlreadySaved) {
            return res.status(409).json({ error: "Book already saved by the user" });
        }

        // Add the book reference (bookId) to the user's savedBooks array
        user.savedBooks.push(id);
        await user.save();

        return res.status(201).json(user.savedBooks);
    } catch (error) {
        console.error("Error saving book to user's list:", error);
        return res.status(500).json({ error: "Failed to save book to the user's list" });
    }
});


// Find own saved books by username
router.get("/list/find", auth, async (req, res) => {
    try {
        const { username } = req.user;

        if (!username) {
            return res.status(400).send("Username is required");
        }

        // Find the user by username and return their savedBooks
        const user = await userModel.findOne({ username }).populate('savedBooks');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user.savedBooks);
    } catch (error) {
        console.error("Error retrieving user's saved books:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Find a user's saved books by username
router.get("/list/find/:username", auth, async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).send("Username is required");
        }

        // Find the user by username and return their savedBooks
        const user = await userModel.findOne({ username }).populate('savedBooks');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user.savedBooks);
    } catch (error) {
        console.error("Error retrieving user's saved books:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Remove a book from a user's saved books by bookId
router.delete("/list/delete/:bookId", auth, async (req, res) => {
    try {
        const { username } = req.user;
        const { bookId } = req.params;

        if (!bookId) {
            return res.status(400).send("Book ID is required");
        }

        // Find the user by username and remove the bookId from the savedBooks array
        const user = await userModel.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.savedBooks = user.savedBooks.filter((savedBookId) => savedBookId.toString() !== bookId);
        await user.save();

        return res.status(200).json(user.savedBooks);
    } catch (error) {
        console.error("Error deleting book from user's saved books:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Find own published books by username
router.get("/publish/find", auth, async (req, res) => {
    try {
        const { username } = req.user;

        if (!username) {
            return res.status(400).send("Username is required");
        }

        // Find the user by username and populate the publishedBooks field with book documents
        const user = await userModel.findOne({ username }).populate('publishedBooks');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user.publishedBooks);
    } catch (error) {
        console.error("Error retrieving user's published books:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Find a user's published books by username
router.get("/publish/find/:username", auth, async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).send("Username is required");
        }

        // Find the user by username and populate the publishedBooks field with book documents
        const user = await userModel.findOne({ username }).populate('publishedBooks');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user.publishedBooks);
    } catch (error) {
        console.error("Error retrieving user's published books:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;