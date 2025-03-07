const cds = require('@sap/cds');
const { orders } = require('@sap/cds/lib/ql/cds-ql');

module.exports = function () {
    this.after('CREATE', 'Orders', async (req) => {
        if (!orders) {
            console.error(`❌ req.data is undefined in after 'CREATE' Orders.`);
            return;
        }

        const { OrderID, CustomerID } = orders;
        console.log(`✅ Order Created: OrderID=${OrderID}, CustomerID=${CustomerID}`);
    });

    this.before('CREATE', 'OrderItems', async (req) => {
        console.log(`➡ Received OrderItem creation request:`, req.data);

        if (!req.data) {
            return req.error(400, `❌ Invalid request data.`);
        }

        const { ProductID, Quantity, OrderID } = req.data;

        if (!ProductID || !Quantity || !OrderID) {
            console.log(`❌ Missing ProductID, Quantity, or OrderID`);
            return req.error(400, `❌ Missing ProductID, Quantity, or OrderID`);
        }

        // ✅ Fetch product details
        const product = await cds.run(SELECT.one.from('Products').where({ ProductID }));

        if (!product) {
            console.log(`❌ Product not found: ProductID=${ProductID}`);
            return req.error(400, `❌ Product with ID ${ProductID} not found`);
        }

        if (product.Stock < Quantity) {
            console.log(`❌ Not enough stock: Available=${product.Stock}, Requested=${Quantity}`);
            return req.error(400, `❌ Not enough stock available for ProductID=${ProductID}. Available: ${product.Stock}, Requested: ${Quantity}`);
        }

        console.log(`✅ Product found: ProductID=${ProductID}, Price=${product.Price}, Stock=${product.Stock}`);

        req.data.subtotal = product.Price * Quantity;
        console.log(`✅ Subtotal calculated: ${req.data.subtotal}`);
    });

    this.after('CREATE', 'OrderItems', async (_, req) => {
        if (!req.data) {
            console.error(`❌ req.data is undefined in after 'CREATE' OrderItems.`);
            return;
        }

        console.log(`✅ OrderItem created`);

        // ✅ Fetch the created OrderItem
        const orderItem = await cds.run(SELECT.one.from('OrderItems').where({ OrderItemID: req.data?.OrderItemID }));

        if (!orderItem || !orderItem.OrderID) {
            console.log(`⚠ Warning: No valid OrderItem found.`);
            return;
        }

        const { OrderID, ProductID, Quantity, subtotal } = orderItem;

        console.log(`🔄 Processing OrderItem: OrderItemID=${req.data.OrderItemID}, OrderID=${OrderID}`);

        // ✅ Ensure OrderItem row has correct subtotal
        await cds.run(UPDATE('OrderItems').set({ subtotal }).where({ OrderItemID: req.data.OrderItemID }));
        console.log(`✅ Updated OrderItem subtotal: OrderItemID=${req.data.OrderItemID}, subtotal=${subtotal}`);

        // 🔄 Update Orders.TotalAmount
        const result = await cds.run(
            SELECT.one`SUM(subtotal) as TotalAmount`.from('OrderItems').where({ OrderID })
        );

        if (result?.TotalAmount !== undefined) {
            await cds.run(UPDATE('Orders').set({ TotalAmount: result.TotalAmount }).where({ OrderID }));
            console.log(`✅ Updated Orders.TotalAmount for OrderID=${OrderID} → ${result.TotalAmount}`);
        } else {
            console.log(`⚠ No subtotal found for OrderID=${OrderID}`);
        }

        // 🔽 Deduct Stock from Products
        console.log(`🔄 Updating stock for ProductID=${ProductID}`);
        const updateStock = await cds.run(
            UPDATE('Products')
                .set({ Stock: { '-=': Quantity } })  // Deduct stock
                .where({ ProductID })
        );

        if (updateStock) {
            console.log(`✅ Stock updated for ProductID=${ProductID}. Deducted: ${Quantity}`);
        } else {
            console.log(`⚠ Failed to update stock for ProductID=${ProductID}`);
        }
    });
};
