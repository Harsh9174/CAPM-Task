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
            console.error('Error executing stored procedure:', error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

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
            console.error('Error executing stored procedure:', error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });



    this.on('placeOrder', async (req) => {
        console.log(`Received placeOrder request:`, req.data);

        const { Customers, OrderDate, Items } = req.data;
        if (!Customers || !Customers.Name || !Customers.Phone || !Items || Items.length === 0) {
            return req.error(400, ` Missing customer details or empty order items.`);
        }


        const customer = await cds.run(
            SELECT.one.from('Customers').where({ Name: Customers.Name, Phone: Customers.Phone })
        );

        if (!customer) {
            return req.error(400, `Customer not found: ${Customers.Name}, ${Customers.Phone}`);
        }

        const maxOrder = await cds.run(SELECT.one`MAX(OrderID) as maxID`.from('Orders'));
        const newOrderID = (maxOrder.maxID || 0) + 1;


        const productIds = Items.map(item => item.ProductID);
        const productData = await cds.run(SELECT.from('Products').where({ ProductID: { in: productIds } }));


        const productMap = {};
        productData.forEach(prod => {
            productMap[prod.ProductID] = { Price: parseFloat(prod.Price), Stock: prod.Stock };
        });

        let totalAmount = 0;
        const orderItemsToInsert = [];
        const stockUpdates = [];

        let maxOrderItem = await cds.run(SELECT.one`MAX(OrderItemID) as maxID`.from('OrderItems'));
        let nextOrderItemID = (maxOrderItem.maxID || 0) + 1;

        for (let item of Items) {
            const { ProductID, Quantity, Price } = item;

            if (!ProductID || !Quantity || !Price) {
                console.log(`Invalid OrderItem data:`, item);
                continue;
            }

            const product = productMap[ProductID];

            if (!product) {
                console.log(`Product not found: ProductID=${ProductID}`);
                continue;
            }

            if (product.Stock < Quantity) {
                console.log(`Not enough stock: Available=${product.Stock}, Requested=${Quantity}`);
                continue;
            }

            // Fix floating-point price mismatch issue by using a tolerance value (0.01)
            if (Math.abs(product.Price - Price) > 0.01) {
                console.log(`⚠ Price Mismatch: UI Price=${Price}, Actual Price=${product.Price}`);
                continue;
            }

            const subtotal = Price * Quantity;
            totalAmount += subtotal;

            orderItemsToInsert.push({
                OrderItemID: nextOrderItemID++,  //
                OrderID: newOrderID,
                ProductID,
                Quantity,
                subtotal
            });

            stockUpdates.push({
                ProductID,
                NewStock: product.Stock - Quantity
            });
        }

        if (orderItemsToInsert.length === 0) {
            return req.error(400, "No valid items to place an order.");
        }

        
        await cds.run(
            INSERT.into('Orders').entries({
                OrderID: newOrderID,
                CustomerID: customer.CustomerID,
                OrderDate: OrderDate || new Date().toISOString(),
                TotalAmount: totalAmount
            })
        );

        console.log(`Order Created: OrderID=${newOrderID}`);


        await cds.run(INSERT.into('OrderItems').entries(orderItemsToInsert));
        console.log(`Inserted ${orderItemsToInsert.length} OrderItems.`);

        for (let stock of stockUpdates) {
            await cds.run(UPDATE('Products').set({ Stock: stock.NewStock }).where({ ProductID: stock.ProductID }));
            console.log(`Stock Updated for ProductID=${stock.ProductID}: New Stock=${stock.NewStock}`)
            console.log(`Transaction Successfull`);
        }
        return {
            OrderID: newOrderID,
            TotalAmount: totalAmount,
            Message: `Order placed successfully!`
        };
    });

};
