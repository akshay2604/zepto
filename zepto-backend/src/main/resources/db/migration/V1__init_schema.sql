
    create table address (
        is_default boolean not null,
        lat numeric(9,6),
        lng numeric(9,6),
        pincode varchar(10),
        id uuid not null,
        user_id uuid not null,
        label varchar(50),
        city varchar(100),
        line1 varchar(300) not null,
        line2 varchar(300),
        primary key (id)
    );

    create table category (
        id uuid not null,
        parent_category_id uuid,
        name varchar(100) not null,
        primary key (id)
    );

    create table delivery (
        delivery_time_secs integer,
        assigned_at timestamp(6),
        delivered_at timestamp(6),
        picked_up_at timestamp(6),
        rider_phone varchar(15),
        id uuid not null,
        order_id uuid not null unique,
        status varchar(50),
        rider_name varchar(100),
        primary key (id)
    );

    create table inventory_ledger (
        qty_on_hand integer not null,
        qty_reserved integer not null,
        reorder_threshold integer not null,
        last_updated timestamp(6),
        id uuid not null,
        variant_id uuid not null,
        warehouse_id uuid not null,
        primary key (id),
        constraint uq_inventory_ledger_warehouse_variant unique (warehouse_id, variant_id)
    );

    create table order_item (
        line_total numeric(10,2) not null,
        qty integer not null,
        unit_price numeric(10,2) not null,
        id uuid not null,
        order_id uuid not null,
        variant_id uuid not null,
        primary key (id)
    );

    create table orders (
        amount_payable numeric(10,2),
        delivery_fee numeric(10,2),
        total_discount numeric(10,2),
        total_mrp numeric(10,2),
        delivered_at timestamp(6),
        placed_at timestamp(6),
        address_id uuid not null,
        id uuid not null,
        user_id uuid not null,
        warehouse_id uuid not null,
        status varchar(30) check (status in ('PLACED','PAYMENT_PENDING','CONFIRMED','PICKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
        primary key (id)
    );

    create table payment (
        amount numeric(10,2),
        paid_at timestamp(6),
        id uuid not null,
        order_id uuid not null unique,
        status varchar(20) check (status in ('PENDING','SUCCESS','FAILED','REFUNDED')),
        method varchar(50),
        gateway_txn_id varchar(100),
        primary key (id)
    );

    create table product (
        is_active boolean not null,
        category_id uuid not null,
        id uuid not null,
        brand varchar(100),
        name varchar(200) not null,
        description TEXT,
        primary key (id)
    );

    create table product_variant (
        is_available boolean not null,
        mrp numeric(10,2) not null,
        selling_price numeric(10,2) not null,
        id uuid not null,
        product_id uuid not null,
        unit varchar(20),
        pack_size varchar(50),
        sku_code varchar(100) not null unique,
        display_name varchar(200) not null,
        image_url varchar(500),
        primary key (id)
    );

    create table stock_movement (
        qty_delta integer not null,
        created_at timestamp(6),
        id uuid not null,
        reference_id uuid,
        variant_id uuid not null,
        warehouse_id uuid not null,
        movement_type varchar(30) not null check (movement_type in ('INBOUND','ORDER_RESERVE','ORDER_PICK','ORDER_CANCEL','SPOILAGE','ADJUSTMENT')),
        primary key (id)
    );

    create table user_account (
        is_active boolean not null,
        created_at timestamp(6),
        phone varchar(15) not null unique,
        id uuid not null,
        email varchar(200),
        name varchar(200) not null,
        primary key (id)
    );

    create table warehouse (
        is_active boolean not null,
        lat numeric(9,6),
        lng numeric(9,6),
        pincode varchar(10),
        id uuid not null,
        city varchar(100),
        name varchar(200) not null,
        address TEXT,
        primary key (id)
    );

    create index idx_inventory_ledger_warehouse_variant
       on inventory_ledger (warehouse_id, variant_id);

    create index idx_order_item_order
       on order_item (order_id);

    create index idx_orders_user
       on orders (user_id);

    create index idx_orders_status
       on orders (status);

    create index idx_stock_movement_variant_created
       on stock_movement (variant_id, created_at);

    alter table if exists address
       add constraint FK7aekkir5nb594est3cq9k7f2e
       foreign key (user_id)
       references user_account;

    alter table if exists category
       add constraint FKs2ride9gvilxy2tcuv7witnxc
       foreign key (parent_category_id)
       references category;

    alter table if exists delivery
       add constraint FKu4e8rjwmg09vmas3ccjwglso
       foreign key (order_id)
       references orders;

    alter table if exists inventory_ledger
       add constraint FKtk2sk2o9c8d6itkq10cruwcvo
       foreign key (variant_id)
       references product_variant;

    alter table if exists inventory_ledger
       add constraint FKmqqj0x4p78tg0igy0rghe0mf0
       foreign key (warehouse_id)
       references warehouse;

    alter table if exists order_item
       add constraint FKt4dc2r9nbvbujrljv3e23iibt
       foreign key (order_id)
       references orders;

    alter table if exists order_item
       add constraint FKcvr1aqkc2suhg2lvuwpfe0q0s
       foreign key (variant_id)
       references product_variant;

    alter table if exists orders
       add constraint FKf5464gxwc32ongdvka2rtvw96
       foreign key (address_id)
       references address;

    alter table if exists orders
       add constraint FKt1jid9kyxl7m56q1iclyrmrgw
       foreign key (user_id)
       references user_account;

    alter table if exists orders
       add constraint FKng7m6enak1pgyarn16ntgscwv
       foreign key (warehouse_id)
       references warehouse;

    alter table if exists payment
       add constraint FKlouu98csyullos9k25tbpk4va
       foreign key (order_id)
       references orders;

    alter table if exists product
       add constraint FK1mtsbur82frn64de7balymq9s
       foreign key (category_id)
       references category;

    alter table if exists product_variant
       add constraint FKgrbbs9t374m9gg43l6tq1xwdj
       foreign key (product_id)
       references product;

    alter table if exists stock_movement
       add constraint FK5ossoakh26yblc0fima0t4lsm
       foreign key (variant_id)
       references product_variant;

    alter table if exists stock_movement
       add constraint FKmp40immc6bpap7qpthgr3ff2g
       foreign key (warehouse_id)
       references warehouse;
