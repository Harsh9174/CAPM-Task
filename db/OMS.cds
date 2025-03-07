
    @cds.persistence.exists
    entity Customers {
    key CustomerID : Integer @cds.auto.increment;
        Name       : String(100);
        Email      : String(100);
        Phone      : String(300);
        Address    : String(10);
        Country    : String(100);
}

    @cds.persistence.exists
    entity Orders {
    key OrderID     : Integer @cds.auto.increment;
        CustomerID  : Integer;
        Customer    : Association to Customers on Customer.CustomerID = CustomerID;
        OrderDate   : Timestamp;
        TotalAmount : Decimal(10, 2);
        items           : Composition of many OrderItems on items.OrderID = OrderID;
}

    @cds.persistence.exists
    entity Products {
    key ProductID : Integer @cds.auto.increment;
        Name      : String(100);
        Category  : String(100);
        Price     : Decimal(10, 2);
        Stock     : Integer

}

    @cds.persistence.exists
    entity OrderItems {
    key OrderItemID : Integer @cds.auto.increment;
        OrderID     : Integer; 
        ProductID   : Integer; 
        Product     : Association to Products on Product.ProductID = ProductID;
        Quantity    : Integer;
        subtotal    : Decimal(10, 2);
}

@cds.persistence.calcview
@cds.persistence.exists
entity Surplus_stock {
    key PRODUCTID : Integer;
	    NAME : String(100); 
	    CATEGORY : String(100);
	    FLAG : String(2);
	    PRICE : Decimal(10,2);
	    QUANTITY : Integer;
	    STOCK : Integer;
	    STOCK_REM : Integer
}