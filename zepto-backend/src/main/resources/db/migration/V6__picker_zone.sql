ALTER TABLE picker ADD COLUMN zone_id uuid REFERENCES zone(id);
CREATE INDEX idx_picker_zone ON picker (zone_id);
