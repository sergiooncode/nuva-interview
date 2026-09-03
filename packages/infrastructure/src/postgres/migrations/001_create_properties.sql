CREATE TABLE properties (
  id            text    PRIMARY KEY,
  title         text    NOT NULL,
  brand         text    NOT NULL,
  neighborhood  text    NOT NULL,
  status        text    NOT NULL CHECK (status IN ('available', 'reserved', 'rented')),
  bedrooms      integer NOT NULL CHECK (bedrooms >= 0),
  bathrooms     integer NOT NULL CHECK (bathrooms >= 0),
  max_occupancy integer NOT NULL CHECK (max_occupancy > 0),
  size_m2       integer NOT NULL CHECK (size_m2 > 0),
  monthly_rent  integer NOT NULL CHECK (monthly_rent >= 0),
  floor_type    text    NOT NULL,
  is_exterior   boolean NOT NULL,
  age_label     text    NOT NULL
);

-- The branded Cents type does not survive the wire, so the unit is asserted by the
-- column comment and by the integer type: a euro amount here would be a 100x undercharge.
COMMENT ON COLUMN properties.monthly_rent IS 'Integer euro cents, never euros';

-- The catalogue is filtered by availability on every request without exception, so it
-- leads both indexes. Facet counts group by bedrooms and bucket by rent.
CREATE INDEX properties_status_bedrooms_idx ON properties (status, bedrooms);
CREATE INDEX properties_status_rent_idx     ON properties (status, monthly_rent);
