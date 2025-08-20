// require('dotenv').config(); // Load environment variables
// const express = require('express');
// const mysql = require('mysql2/promise'); // Import the promise-based version
// const app = express();
// const port = 3000;

// // EJS setup
// app.set('view engine', 'ejs');
// app.set('views', './views'); // Specify the views directory

// // MySQL connection configuration (replace with your Avien MySQL details)
// const dbConfig = {
//     host: process.env.DB_HOST, // e.g., 'us-cdbr-east-05.cleardb.net'
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE,
//     port: 13490
// };

// // Route to display data
// app.get('/', async (req, res) => {
//     let connection; // Declare connection outside try block for finally
//     try {
//         // Establish a new connection for each request (no pooling)
//         connection = await mysql.createConnection(dbConfig); 
//         const [rows, fields] = await connection.execute('SELECT * FROM personnel'); // Replace 'your_table_name'

//         res.render('index', { data: rows }); // Pass fetched data to EJS template
//     } catch (error) {
//         console.error('Error fetching data:', error);
//         res.status(500).send('Error retrieving data from the database.');
//     } finally {
//         if (connection) {
//             await connection.end(); // Ensure connection is closed
//         }
//     }
// });

// app.listen(port, () => {
//     console.log(`Server listening at http://localhost:${port}`);
// });
//----------------------------------------------------------------------
// const express = require('express');
// const mysql = require('mysql2/promise'); // Use promise-based version
// const ejs = require('ejs');
// require('dotenv').config(); // Load environment variables

// const app = express();
// const port = 3000;

// // Configure database connection pool
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE,
//     port: 13490,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// // Set EJS as the view engine
// app.set('view engine', 'ejs');
// app.set('views', './views'); // Specify the views directory

// // Route to display data from a table
// app.get('/', async (req, res) => {
//     let connection;
//     try {
//         connection = await pool.getConnection();
//         const [rows] = await connection.execute('SELECT * FROM personnel'); // Replace 'your_table_name'
//         res.render('index', { data: rows });
//     } catch (error) {
//         console.error('Error fetching data:', error);
//         res.status(500).send('Error fetching data from the database.');
//     } finally {
//         if (connection) connection.release(); // Release the connection back to the pool
//     }
// });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });
//----------------------------------------------------------------------
require('dotenv').config(); // Load environment variables
const express = require('express');
const mysql2 = require('mysql2');
const path = require('path');
const app = express();
const port = 3000;
const bodyParser = require('body-parser'); // To parse form data
const methodOverride = require('method-override'); // For PUT/DELETE from forms


// Configure MySQL connection (replace with your Avien MySQL details)
const dbConfig = {
    host: process.env.DB_HOST, // e.g., 'us-cdbr-east-05.cleardb.net'
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: 13490
};

const pool = mysql2.createPool(dbConfig);
// const urlstring = res.locals.currentUrl;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // Use method-override middleware

// Code below allows ejs scripts to reference their own URL (important for edit pages)
app.use((req, res, next) => {
    res.locals.currentUrl = req.originalUrl; // Full URL path including query string
    res.locals.currentHost = req.get('host'); // Hostname and port
    res.locals.currentProtocol = req.protocol; // http or https
    next();
});

// Route to fetch and display data
app.get('/', (req, res) => {
    pool.query('SELECT * FROM personnel', (error, results) => { // Replace 'your_table_name'
        if (error) {
            console.error('Error fetching data:', error);
            return res.status(500).send('Error fetching data from database.');
        }
        res.render('index', { data: results }); // Pass fetched data to EJS template
        // console.log(results)
        // console.log("re.params:")
        // console.log(req.params)
        // console.log("re.body:")
        // console.log(req.body)
        // console.log("URL is:")
        // console.log(res.locals.currentUrl)
    });
});

app.post('/', (req, res) => {
    const { service_number, grade, name } = req.body; // Extract data from the form

    // Basic validation (add more robust validation as needed)
    // if (!service_number || !grade || !name) {
    //     return res.send('All fields are required.');
    // }

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
    pool.query('SELECT * FROM personnel', (error, results) => { // Replace 'your_table_name'
        if (error) {
            console.error('Error fetching data:', error);
            return res.status(500).send('Error fetching data from database.');
        }
        res.render('edit', { data: results, urlstring: Number(res.locals.currentUrl.substr(1,8)) }); // Pass fetched data to EJS template
        // console.log("urlstring is:")
        // console.log(Number(res.locals.currentUrl.substr(1,8)))
        // console.log("row[0] is:")
        // console.log(results[0].service_number)
    });
});

// Route for edit page POST
app.put('/:id/edit', (req, res) => {
    const service_number = req.params.id;
    const { grade, name } = req.body;
    console.log(service_number)
    console.log({ grade, name })
    // const { service_number, grade, name } = req.body;

    // Basic validation (add more robust validation as needed)
    // if (!service_number || !grade || !name) {
    //     return res.send('All fields are required.');
    // }

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
    pool.query('SELECT * FROM personnel WHERE service_number = ?', [service_number], (error, results) => { // Replace 'your_table_name'
        if (error) {
            console.error('Error fetching data:', error);
            return res.status(500).send('Error fetching data from database.');
        }
        res.render('delete', { data: results, urlstring: Number(res.locals.currentUrl.substr(1,8)) }); // Pass fetched data to EJS template
        // console.log("re.params:")
        // console.log(req.params)
        // console.log("re.body:")
        // console.log(req.body)
        // console.log("urlstring is:")
        // console.log(Number(res.locals.currentUrl.substr(1,8)))
        // console.log("row[0] is:")
        // console.log(results[0].service_number)
    });
});

// Route for secondary delete page POST
// app.delete('/:id/delete', (req, res) => {
//     const service_number = req.params.id;
//     console.log(service_number)

//     // Basic validation (add more robust validation as needed)
//     // if (!service_number || !grade || !name) {
//     //     return res.send('All fields are required.');
//     // }

//     const query = 'DELETE FROM personnel WHERE service_number = ?';
//     pool.query(query, [service_number], (err, result) => {
//         if (err) {
//             console.error('DELETE Error deleting person:', err);
//             return res.send('Error deleting person.');
//         }
//         console.log(service_number)
//         console.log('person deleted successfully:', result.insertId);
//         res.redirect('/');
//     });
// });

// Route for delete page POST
app.delete('/:id', (req, res) => {
    const service_number = req.params.id;
    console.log(service_number)

    // Basic validation (add more robust validation as needed)
    // if (!service_number || !grade || !name) {
    //     return res.send('All fields are required.');
    // }

    const query = 'DELETE FROM personnel WHERE service_number = ?';
    pool.query(query, [service_number], (err, result) => {
        if (err) {
            console.error('DELETE Error deleting person:', err);
            return res.send('Error deleting person.');
        }
        console.log(service_number)
        console.log('person deleted successfully:', result.insertId);
        res.redirect('/');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});