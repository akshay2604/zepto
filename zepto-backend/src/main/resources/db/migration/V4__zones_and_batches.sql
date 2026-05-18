create table zone (
    id             uuid    not null primary key,
    warehouse_id   uuid    not null references warehouse,
    name           varchar(100) not null,
    zone_type      varchar(20) not null,
    display_order  int     not null,
    x              float8  not null,
    y              float8  not null,
    w              float8  not null,
    h              float8  not null
);

create index idx_zone_warehouse on zone (warehouse_id);

create table pick_batch (
    id             uuid    not null primary key,
    warehouse_id   uuid    not null references warehouse,
    picker_id      uuid    references picker,
    status         varchar(20) not null default 'PENDING',
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
    zone_type      varchar(20) not null,
    sort_order     int     not null,
    qty            int     not null,
    picked         boolean not null default false,
    picked_at      timestamp
);

create index idx_pbi_batch_picked on pick_batch_item (batch_id, picked);
