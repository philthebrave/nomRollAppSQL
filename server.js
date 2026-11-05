require('dotenv').config(); // Load environment variables
const express = require('express');
const mysql2 = require('mysql2');
const path = require('path');
const app = express();
const port = 3000;
const bodyParser = require('body-parser'); // To parse form data
const methodOverride = require('method-override'); // For PUT/DELETE from forms

// Configure MySQL connection
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: 13490,
    ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
    }
};

const pool = mysql2.createPool(dbConfig);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Code below allows ejs scripts to reference their own URL (important for edit pages)
app.use((req, res, next) => {
    res.locals.currentUrl = req.originalUrl; // Full URL path including query string
    res.locals.currentHost = req.get('host'); // Hostname and port
    res.locals.currentProtocol = req.protocol; // http or https
    next();
});

// Route to main page
app.get('/', (req, res) => {
    pool.query('SELECT * FROM personnel', (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
            return res.status(500).send('Error fetching data from database.');
        }
        res.render('index', { data: results }); // Pass fetched data to EJS template
    });
});

// Add new person
app.post('/', (req, res) => {
    const { service_number, grade, name } = req.body; // Extract data from the form
    const query = 'INSERT INTO personnel VALUES (?, ?, ?)';
    pool.query(query, [service_number, grade, name], (err, result) => {
        if (err) {
            console.error('Error inserting person:', err);
            return res.send('POST Error adding person.');
        }
        console.log('person added successfully:', result.insertId);
        res.redirect('/'); // Redirect to a page displaying all people
    });
});

// Route to edit page
app.get('/:id/edit', (req, res) => {
    const personId = req.params.id;
    const query = 'SELECT * FROM personnel WHERE service_number = ?';
    pool.query(query, [personId], (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
            return res.status(500).send('Error fetching data from database.');
        }
        res.render('edit', { data: results, urlstring: Number(res.locals.currentUrl.substr(1,8)) }); // Pass fetched data to EJS template
    });
});

// Edit existing person
app.put('/:id', (req, res) => {
    const service_number = req.params.id;
    const { grade, name } = req.body;
    const query = 'UPDATE personnel SET grade = ?, name = ? WHERE service_number = ?';
    pool.query(query, [grade, name, service_number], (err, result) => {
        if (err) {
            console.error('PUT Error inserting person:', err);
            return res.send('Error adding person.');
        }
        console.log('person added successfully:', result.insertId);
        res.redirect('/'); // Redirect to a page displaying all people
    });
});

// Route to ARE YOU SURE delete page
app.get('/:id/delete', (req, res) => {
    const service_number = req.params.id;
    pool.query('SELECT * FROM personnel WHERE service_number = ?', [service_number], (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
            return res.status(500).send('Error fetching data from database.');
        }
        res.render('delete', { data: results, urlstring: Number(res.locals.currentUrl.substr(1,8)) }); // Pass fetched data to EJS template
    });
});

// Delete person
app.delete('/:id', (req, res) => {
    const service_number = req.params.id;
    const query = 'DELETE FROM personnel WHERE service_number = ?';
    pool.query(query, [service_number], (err, result) => {
        if (err) {
            console.error('DELETE Error deleting person:', err);
            return res.send('Error deleting person.');
        }
        res.redirect('/');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
