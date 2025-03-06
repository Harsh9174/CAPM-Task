using { Customers as c, Orders as o, Products as p, OrderItems as oi } from '../db/OMS';

service MyService {
    entity Customers as projection on c;
    entity Orders as projection on o;
    entity Products as projection on p;
    entity OrderItems as projection on oi;
}
