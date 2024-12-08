/*
STEP 2: Add Company Routes

1) Create ***routes/companies.js*** with a router in it.

- All routes in this file should be found under *companies/*.

- All routes here will respond with JSON responses. These responses will be in an object format where the value is the data from the database.

So, for example, the “get list of companies should return”:
{companies: [{code, name}, ...]}

Assuming result is the result from your query, you could produce this with a line like:
return res.json({companies: result.rows})

These routes need to be given data in JSON format, not the standard “url-encoded form body” — so you’ll need to make sure that your app.js includes the middleware to parse JSON.
*/

const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

// Routes

/* 
GET /companies : Returns list of companies, like {companies: [{code, name}, ...]}
*/

// Returs list of companies 
router.get('/companies', async (req, res, next) => {
    try{
        const results = await db.query(
            `SELECT code, name
             FROM companies
             ORDER BY name`
        );
        return res.json('companies', results.rows);
    } catch (err) {
        return next(err);
    } 
});

/*
GET /companies/[code] : Return obj of company: {company: {code, name, description}}
If the company given cannot be found, this should return a 404 status response.
*/ 

// Returns a company
router.get('/companies/[code]', async (req, res, next) => {
    try{
        let code = req.params.code;

    const results = await db.query(
        `SELECT code, name, description
        FROM companies
        WHERE code=$1`, [code]
    );

    if (results.rows.length === 0) {
        throw new ExpressError(`The company ${code} does not exist:`, 404)
    }

    const company = results.rows[0];
    
    return res.json({'company': company});
    
    } catch (err) {
        return next(err);
    }
});

/*
POST /companies : Adds a company. Needs to be given JSON like: {code, name, description} Returns obj of new company:  {company: {code, name, description}}
*/

// Adds a company
router.post('/companies', async (req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const results = await db.query(
            `INSERT INTO companies (code, name, description) 
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );
        return res.json({'company': results.rows[0]});
    }catch (err) {
        return next(err);
    }
});

/*
PUT /companies/[code] :** Edit existing company. 
Should return 404 if company cannot be found.
Needs to be given JSON like: `{name, description}` 
Returns update company object: `{company: {code, name, description}}`
*/

// Update 'company'
router.put('/companies/[code', async (req, res, next) => {
    try {
        const {code} = req.params;
        const {name, description} = req.body;

        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
            [name, description, code]
        );
        
        if (results.rows.length === 0) {
            throw new ExpressError(`The company ${code} does not exist`, 404)
        }
        
        const company = results.rows[0];

        return res.json({'company': company})

    } catch (err) {
        return next(e)
    }
});

/*
**DELETE /companies/[code] :** Deletes company. Should return 404 if company cannot be found.
Returns `{status: "deleted"}`
 */

// Deletes a company
router.delete('/companies/[code]', async (req, res, next) => {
    try {
        const results = await db.query(
            `DELETE FROM companies WHERE code=$1`, 
            [req.params.code]
        );

        if (results.rows.length === 0) {
            throw new ExpressError(`The company ${code} does not exist`, 404)
        }

        return res.send[{status: 'deleted'}]

    } catch (err) {
        return next(err);
    }
});




module.exports = router;