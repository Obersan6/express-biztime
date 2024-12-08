const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

// Routes

/*
**GET /invoices :** Return info on invoices: like `{invoices: [{id, comp_code}, ...]}`
*/

// Retrieves info on invoices
router.get('/invoices', async (req, res, next) => {
    try {
        const invoices = await db.query(
            `SELECT id, comp_code
            FROM invoices 
            ORDER BY id`
        );
        return res.json('invoices', invoices.rows);

    } catch (err) {
        return next(err);
    }
});

/**GET /invoices/[id] :** Returns obj on given invoice.
If invoice cannot be found, returns 404. Returns `{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}`
*/

// Retrieve a specific invoice
router.get('/invoices/[id]', async (req, res, next) => {
    try{
        let id = req.params.code;

        const results = await db.query(
            `SELECT invoices.id, 
            invoices.amt, 
            invoices.paid,
            invoices.add_date,
            invoices.paid_date, 
            FROM invoices
            INNER JOIN companies 
            ON (invoices.comp_code = companies.code)
            WHERE id=$1`,
            [id]);

            if (results.rows.length === 0) {
                throw new EmpressError(`There is no invoice with id ${id}`, 404 );
            }
        
        const data = results.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description,
            },
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
        };

        return res.json({'invoice': invoice});

    } catch (err) {
        return next(err);
    }
});

/*
**POST /invoices :** Adds an invoice. Needs to be passed in JSON body of: `{comp_code, amt}`
Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`
*/

// Adds a new invoice
router.post('/invoices', async (req, res, next) => {
    try {
        const {compt_code, amt} = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );

        return res.json({'invoice': results.rows[0]});

    } catch (err) {
        return next(err);
    }
})

/*
**PUT /invoices/[id] :** Updates an invoice. If invoice cannot be found, returns a 404.
Needs to be passed in a JSON body of `{amt}` Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`
*/

// Update a specific invoice
router.put('/invoices/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { amt, paid } = req.body;
  
      // Validate input
      if (amt === undefined || paid === undefined) {
        return res.status(400).json({ error: "Missing 'amt' or 'paid' in request body" });
      }
  
      // Fetch the current invoice to check if 'paid' status has changed
      const invoiceResult = await db.query(
        `SELECT paid, paid_date FROM invoices WHERE id = $1`,
        [id]
      );
  
      if (invoiceResult.rows.length === 0) {
        // Invoice not found
        return res.status(404).json({ error: "Invoice not found" });
      }
  
      const invoice = invoiceResult.rows[0];
      let paidDate = invoice.paid_date;
  
      if (!invoice.paid && paid) {
        // Invoice was unpaid and is now paid
        paidDate = new Date();
      } else if (invoice.paid && !paid) {
        // Invoice was paid and is now unpaid
        paidDate = null;
      }
      // If 'paid' status hasn't changed, keep the existing 'paid_date'
  
      // Update the invoice
      const updateResult = await db.query(
        `UPDATE invoices
         SET amt = $1, paid = $2, paid_date = $3
         WHERE id = $4
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, paid, paidDate, id]
      );
  
      const updatedInvoice = updateResult.rows[0];
  
      return res.json({invoice: updatedInvoice});
    } catch (err) {
      return next(err);
    }
  }); 

 /*
  **DELETE /invoices/[id] :** Deletes an invoice.If invoice cannot be found, returns a 404. Returns: `{status: "deleted"}` Also, one route from the previous part should be updated:
*/

// Delete an invoice
router.delete('/:id', async (req, res, next) => {
    try {
      const {id} = req.params;
  
      // Delete the invoice
      const deleteResult = await db.query(
        `DELETE FROM invoices WHERE id = $1 RETURNING id`,
        [id]
      );
  
      if (deleteResult.rows.length === 0) {
        // Invoice not found
        return res.status(404).json({error: "Invoice not found"});
      }
  
      return res.json({status: "deleted"});
    } catch (err) {
      return next(err);
    }
  });


/*
**GET /companies/[code] :** Return obj of company: `{company: {code, name, description, invoices: [id, ...]}}` If the company given cannot be found, this should return a 404 status response.
*/

// routes/companies.js
router.get('/companies/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    // Query to fetch company details
    const companyResult = await db.query(
      `SELECT code, name, description
       FROM companies
       WHERE code = $1`,
      [code]
    );

    if (companyResult.rows.length === 0) {
      // Company not found
      return res.status(404).json({error: "Company not found"});
    }

    const company = companyResult.rows[0];

    // Query to fetch associated invoice IDs
    const invoicesResult = await db.query(
      `SELECT id
       FROM invoices
       WHERE comp_code = $1`,
      [code]
    );

    // Extract invoice IDs into an array
    const invoices = invoicesResult.rows.map(inv => inv.id);

    // Construct the response object
    const response = {
      company: {
        code: company.code,
        name: company.name,
        description: company.description,
        invoices: invoices
      }
    };

    return res.json(response);
  } catch (err) {
    return next(err);
  }
});





module.exports = router;
