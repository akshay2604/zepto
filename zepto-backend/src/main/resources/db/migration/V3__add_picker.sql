    create table picker (
        active boolean not null,
        id uuid not null,
        warehouse_id uuid not null,
        phone varchar(15),
        name varchar(100) not null,
        primary key (id)
    );

    create index idx_picker_warehouse on picker (warehouse_id);

    alter table picker
        add constraint FK_picker_warehouse
        foreign key (warehouse_id) references warehouse;

    alter table orders
        add column picker_id uuid;

    alter table orders
        add constraint FK_orders_picker
        foreign key (picker_id) references picker;
