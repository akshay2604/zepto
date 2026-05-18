create table picker_zone (
    id        uuid        not null primary key,
    picker_id uuid        not null references picker,
    zone_type varchar(20) not null,
    constraint uq_picker_zone unique (picker_id, zone_type)
);

create index idx_picker_zone_picker on picker_zone (picker_id);
