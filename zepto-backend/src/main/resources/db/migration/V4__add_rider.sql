CREATE TABLE rider (
    id              uuid         NOT NULL,
    name            varchar(100) NOT NULL,
    phone           varchar(15),
    vehicle_number  varchar(20),
    active          boolean      NOT NULL DEFAULT true,
    warehouse_id    uuid,
    PRIMARY KEY (id)
);

CREATE INDEX idx_rider_warehouse ON rider (warehouse_id);

ALTER TABLE rider
    ADD CONSTRAINT fk_rider_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouse (id);
