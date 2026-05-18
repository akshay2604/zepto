ALTER TABLE user_account ADD COLUMN warehouse_id uuid;

ALTER TABLE user_account
    ADD CONSTRAINT fk_user_account_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id);
