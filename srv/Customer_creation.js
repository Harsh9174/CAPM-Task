const cds = require('@sap/cds');

module.exports = function () {

    this.on('Customer_create', async (req) => {
        const { P_NAME, P_EMAIL, P_PHONE, P_ADDRESS, P_COUNTRY } = req.data;

        if (!P_NAME || !P_EMAIL || P_PHONE === undefined || P_ADDRESS === undefined) {
            return req.error(400, 'Missing required parameters.');
        }

        try {
            const query = `CALL CUSTOMER_CREATION(?, ?, ?, ?, ?, ?,?);`;

            // Call procedure with properly bound parameters
            const result = await cds.db.run(query, [
                P_NAME,
                P_EMAIL,
                P_PHONE,
                P_ADDRESS,
                P_COUNTRY
            ]);

            console.log(`Stored procedure executed. Response:`, result);

            return { message: 'Customer created successfully' };

        } catch (error) {
            console.error('❌ Error executing stored procedure:', error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

};
