
    @cds.persistence.exists
    entity Customers {
    key CustomerID : Integer;
        Name       : String(100);
        Email      : String(100);
        Phone      : String(300);
        Address    : String(10);
}

    @cds.persistence.exists
    entity Orders {
    key OrderID     : Integer;
        CustomerID  : Integer;
        Customer    : Association to Customers on Customer.CustomerID = CustomerID;
        OrderDate   : Timestamp;
        TotalAmount : Decimal(10, 2);
}

    @cds.persistence.exists
    entity Products {
    key ProductID : Integer;
        Name      : String(100);
        Category  : String(100);
        Price     : Decimal(10, 2);
        Stock     : Integer

}

    @cds.persistence.exists
    entity OrderItems {
    key OrderItemID : Integer;
        OrderID     : Integer; 
        ProductID   : Integer; 
        Order       : Association to Orders on Order.OrderID = OrderID;
        Product     : Association to Products on Product.ProductID = ProductID;
        Quantity    : Integer;
        subtotal    : Decimal(10, 2);
}
