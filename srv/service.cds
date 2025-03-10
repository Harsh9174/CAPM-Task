using {
    Customers  as c,
    Orders     as o,
    Products   as p,
    OrderItems as oi
} from '../db/OMS';
using {Surplus_stock as ss} from '../db/OMS';

service MyService {
    entity Customers     as projection on c;
    entity Orders        as projection on o;
    entity Products      as projection on p;
    entity OrderItems    as projection on oi;
    entity Surplus_stock as projection on ss;

    action product_create(P_NAME : String(100),
                          P_CATEGORY : String(255),
                          P_PRICE : Integer,
                          P_STOCK : Integer)        returns String;

    action Customer_create(P_NAME : String(100),
                           P_EMAIL : String(255),
                           P_PHONE : String(20),
                           P_ADDRESS : String(100),
                           P_COUNTRY : String(100)) returns String;

    action placeOrder(Customers : CustomerInput,
                      OrderDate : Timestamp,
                      Items : Array of OrderItemInput) returns OrderResponse;
}

type CustomerInput {
    Name: String;
    Phone: String;
}

type OrderItemInput {
    ProductID : Integer;
    Quantity  : Integer;
    Price     : Decimal(10, 2);
}

type OrderResponse {
    OrderID     : Integer;
    TotalAmount : Decimal(10, 2);
    Message     : String;
}
