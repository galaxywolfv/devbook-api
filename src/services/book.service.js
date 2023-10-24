const express = require('express');
const bookModel = require('../models/book.model');
const { auth, checkPermission } = require('../middleware/auth');
const userModel = require('../models/user.model');

const router = express.Router();

// Create a new book
router.post('/save', checkPermission, async (req, res) => {
  try {
    const { title, isbn, link, image, description } = req.body;
    const author = req.user.username;

    if (!(title && author && isbn && link && description)) {
      return res.status(400).send('All input is required');
    }

    const book = await bookModel.create({
      title,
      author,
      isbn,
      link,
      image,
      description,
    });

    // Save the book to the user's publishedBooks array
    const user = await userModel.findOne({ username: author });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.publishedBooks.push(book);
    await user.save();

    return res.status(201).json(book);
  } catch (error) {
    console.error('Error saving book to MongoDB:', error);
    return res.status(500).json({ error: 'Failed to save book to the database' });
  }
});


// Get all books
router.get('/get-all', auth, async (req, res) => {
  try {
    const books = await bookModel.find();
    return res.status(200).json(books);
  } catch (error) {
    console.error('Error retrieving books from MongoDB:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get one book by id
router.post('/get/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await bookModel.findOne({ _id: id });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error retrieving book from MongoDB:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a book by id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isbn, link, image, description } = req.body;
    const author = req.user.username;

    if (!(title && author && isbn && link && description)) {
      return res.status(400).send('All input is required');
    }

    const updatedBook = await bookModel.findByIdAndUpdate(
      id,
      { title, author, isbn, link, image, description },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error('Error updating book in MongoDB:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Delete a book by id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBook = await bookModel.findOneAndDelete({ _id: id });

    if (!deletedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(deletedBook);
  } catch (error) {
    console.error('Error deleting book from MongoDB:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
