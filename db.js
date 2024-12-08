/** Database setup for BizTime. */

// Import pg library
const {client} = require('pg');

let DB_URI;

// test db and app db
if (process.env.NODE_ENV === 'test') {
    DB_URI = 'postgresql:///expressError.js';
} else {
    DB_URI = 'postgresql:///biztime'
}

let db = new Client({
    connectionString: DB_URI
});

db.connect();

module.exports = db;

