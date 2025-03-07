const cds = require('@sap/cds');

module.exports = function () {

    this.on('product_create', async (req) => {
        const { P_NAME, P_CATEGORY, P_PRICE, P_STOCK } = req.data;

        if (!P_NAME || !P_CATEGORY || P_PRICE === undefined || P_STOCK === undefined) {
            return req.error(400, 'Missing required parameters.');
        }

        console.log(`Calling stored procedure with: ${P_NAME}, ${P_CATEGORY}, ${P_PRICE}, ${P_STOCK}`);

        try {
            const query = `CALL PRODUCT_CREATION(?, ?, ?, ?, ?, ?);`;

            // Call procedure with properly bound parameters
            const result = await cds.db.run(query, [
                P_NAME,
                P_CATEGORY,
                P_PRICE,
                P_STOCK,
            ]);

            console.log(`Stored procedure executed. Response:`, result);

            return { message: 'Product created successfully' };

        } catch (error) {
            console.error('❌ Error executing stored procedure:', error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

};
