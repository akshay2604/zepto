create type zone_type_enum as enum ('AMBIENT', 'CHILLED', 'FROZEN', 'PRODUCE');
create type batch_status_enum as enum ('PENDING', 'ACTIVE', 'COMPLETE');

create table zone (
    id             uuid    not null primary key,
    warehouse_id   uuid    not null references warehouse,
    name           varchar(100) not null,
    zone_type      zone_type_enum not null,
    display_order  int     not null,
    x              float   not null,
    y              float   not null,
    w              float   not null,
    h              float   not null
);

create index idx_zone_warehouse on zone (warehouse_id);

create table pick_batch (
    id             uuid    not null primary key,
    warehouse_id   uuid    not null references warehouse,
    picker_id      uuid    references picker,
    status         batch_status_enum not null default 'PENDING',
    created_at     timestamp not null,
    completed_at   timestamp
);

create index idx_pick_batch_warehouse_status on pick_batch (warehouse_id, status);

create table pick_batch_order (
    id         uuid not null primary key,
    batch_id   uuid not null references pick_batch,
    order_id   uuid not null references orders
);

create index idx_pbo_batch on pick_batch_order (batch_id);

create table pick_batch_item (
    id             uuid    not null primary key,
    batch_id       uuid    not null references pick_batch,
    order_id       uuid    not null references orders,
    order_item_id  uuid    not null references order_item,
    variant_id     uuid    not null references product_variant,
    zone_type      zone_type_enum not null,
    sort_order     int     not null,
    qty            int     not null,
    picked         boolean not null default false,
    picked_at      timestamp
);

create index idx_pbi_batch_picked on pick_batch_item (batch_id, picked);
