const cds = require('@sap/cds');

module.exports = function () {
    this.after('CREATE', 'Orders', async (req) => {
        const { OrderID, CustomerID } = req;
        console.log(`Order Created: OrderID=${OrderID}, CustomerID=${CustomerID}`);
    });

    this.before('CREATE', 'OrderItems', async (req) => {
        console.log(`Received OrderItem creation request:`, req.data);

        if (!req.data) {
            return req.error(400, `Invalid request data.`);
        }

        const { ProductID, Quantity, OrderID } = req.data;

        if (!ProductID || !Quantity || !OrderID) {
            console.log(`Missing ProductID, Quantity, or OrderID`);
            return req.error(400, `Missing ProductID, Quantity, or OrderID`);
        }

        const product = await cds.run(SELECT.one.from('Products').where({ ProductID }));

        if (product) {
            const productPrice = product.Price;
            console.log(`Product found: ProductID=${ProductID}, Price=${productPrice}`);

            req.data.subtotal = productPrice * Quantity;
            console.log(`Subtotal calculated: ${req.data.subtotal}`);
        } else {
            console.log(`Product not found: ProductID=${ProductID}`);
            return req.error(400, `Product with ID ${ProductID} not found`);
        }
    });

    this.after('CREATE', 'OrderItems', async (_, req) => {
        console.log(`✅ OrderItem created`);

        const orderItem = await cds.run(SELECT.one.from('OrderItems').where({ OrderItemID: req.data.OrderItemID }));

        if (!orderItem || !orderItem.OrderID) {
            console.log(`⚠ Warning: No OrderID found for OrderItemID=${req.data.OrderItemID}`);
            return;
        }

        const { OrderID, subtotal } = orderItem;

        // ✅ Ensure OrderItem row has correct subtotal
        await cds.run(UPDATE('OrderItems').set({ subtotal }).where({ OrderItemID: req.data.OrderItemID }));
        console.log(`Updated OrderItem subtotal: OrderItemID=${req.data.OrderItemID}, subtotal=${subtotal}`);

        // 🔄 Immediately update the total amount in the Orders table
        const result = await cds.run(
            SELECT.one`SUM(subtotal) as TotalAmount`.from('OrderItems').where({ OrderID })
        );

        if (result?.TotalAmount !== undefined) {
            await cds.run(UPDATE('Orders').set({ TotalAmount: result.TotalAmount }).where({ OrderID }));
            console.log(`Updated Orders.TotalAmount for OrderID=${OrderID} → ${result.TotalAmount}`);
        } else {
            console.log(`No subtotal found for OrderID=${OrderID}`);
        }

        
    });
};




