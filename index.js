const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const path = require('path');
const methodOverride = require('method-override');  // Ensure this line is declared only once
const bodyParser = require('body-parser');

const app = express();
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Notes',
  password: 'mohit',
  port: 5432,
});

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));  // Ensure this line is present to use method-override

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Route to fetch and display all books
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY date_read ASC');
    res.render('index', { books: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching books');
  }
});



// Route to fetch book cover by ISBN
app.get('/cover/:isbn', async (req, res) => {
  try {
    const isbn = req.params.isbn;
    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching book cover');
  }
});

// Route to create a new book entry
app.post('/books', async (req, res) => {
  const { title, author, rating, date_read, cover_url, notes } = req.body;
  try {
    await pool.query(
      'INSERT INTO books (title, author, rating, date_read, cover_url, notes) VALUES ($1, $2, $3, $4, $5, $6)',
      [title, author, rating, date_read, cover_url, notes]
    );
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding book');
  }
});

// Route to fetch and display a specific book for editing
app.get('/books/:id/edit', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.render('edit', { book: result.rows[0] });
    } else {
      res.status(404).send('Book not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching book');
  }
});

// Route to update a book entry using PATCH
app.patch('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, rating, date_read, cover_url, notes } = req.body;
  try {
    await pool.query(
      'UPDATE books SET title=$1, author=$2, rating=$3, date_read=$4, cover_url=$5, notes=$6 WHERE id=$7',
      [title, author, rating, date_read, cover_url, notes, id]
    );
    res.redirect('/'); // Redirect to the main page after updating
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating book');
  }
});

// Route to delete a book entry
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.redirect('/'); // Redirect to the main page after deletion
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting book');
  }
});

// Route to render add-book page
app.get('/books/add-book', (req, res) => {
  res.render('add-book');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
