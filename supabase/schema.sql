-- Blood-Line Navigator: Supabase Schema + Seed Data
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hospitals
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blood Inventory
CREATE TABLE IF NOT EXISTS blood_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blood_type TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units INTEGER NOT NULL DEFAULT 0,
  location_id UUID,
  location_type TEXT NOT NULL DEFAULT 'bank' CHECK (location_type IN ('bank','hospital')),
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drones
CREATE TABLE IF NOT EXISTS drones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'DJI Matrice 300',
  battery INTEGER NOT NULL DEFAULT 100 CHECK (battery >= 0 AND battery <= 100),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','dispatched','delivering','returning','charging','maintenance')),
  lat DOUBLE PRECISION NOT NULL DEFAULT 28.6139,
  lng DOUBLE PRECISION NOT NULL DEFAULT 77.2090,
  altitude DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drone_id UUID REFERENCES drones(id),
  from_location TEXT NOT NULL DEFAULT 'Central Blood Bank',
  to_hospital_id UUID REFERENCES hospitals(id),
  blood_type TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_transit','delivered','failed')),
  dispatched_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION DEFAULT 0,
  eta_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demand Predictions
CREATE TABLE IF NOT EXISTS demand_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES hospitals(id),
  blood_type TEXT NOT NULL,
  predicted_units INTEGER NOT NULL,
  actual_units INTEGER,
  prediction_date DATE NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.85 CHECK (confidence >= 0 AND confidence <= 1),
  mae DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detection Events
CREATE TABLE IF NOT EXISTS detection_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT,
  detected_type TEXT,
  confidence DOUBLE PRECISION,
  bounding_boxes JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('low_stock','expiring_soon','drone_fault','delivery_failed','critical_demand')),
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE blood_inventory, drones, deliveries, alerts;

-- ============================================================
-- SEED DATA — Ramanathapuram District, Tamil Nadu
-- ============================================================

INSERT INTO hospitals (id, name, lat, lng, city, capacity, contact) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'GH Ramanathapuram', 9.3639, 78.8395, 'Ramanathapuram', 450, '+91-4567-220330'),
  ('a1000000-0000-0000-0000-000000000002', 'Govt Hospital Paramakudi', 9.5447, 78.5912, 'Paramakudi', 300, '+91-4564-224455'),
  ('a1000000-0000-0000-0000-000000000003', 'Kamuthi Government Hospital', 9.4023, 78.9433, 'Kamuthi', 180, '+91-4577-262233'),
  ('a1000000-0000-0000-0000-000000000004', 'Rameswaram Government Hospital', 9.2876, 79.3129, 'Rameswaram', 200, '+91-4573-221100'),
  ('a1000000-0000-0000-0000-000000000005', 'PHC Mandapam', 9.2817, 79.1237, 'Mandapam', 50, '+91-4573-238844'),
  ('a1000000-0000-0000-0000-000000000006', 'Mudukulathur GH', 9.3317, 78.5083, 'Mudukulathur', 150, '+91-4564-253322'),
  ('a1000000-0000-0000-0000-000000000007', 'Thiruvadanai PHC', 9.7417, 78.9917, 'Thiruvadanai', 60, '+91-4564-244411');

INSERT INTO drones (id, name, model, battery, status, lat, lng, altitude, speed) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'BL-D1 "Lifewing"', 'MediFly X4', 87, 'idle', 9.3639, 78.8395, 0, 0),
  ('d1000000-0000-0000-0000-000000000002', 'BL-D2 "Redline"', 'MediFly X4', 72, 'delivering', 9.4200, 78.7800, 48, 64),
  ('d1000000-0000-0000-0000-000000000003', 'BL-D3 "Hemex"', 'HemaWing Pro', 34, 'charging', 9.3712, 78.8301, 0, 0),
  ('d1000000-0000-0000-0000-000000000004', 'BL-D4 "Vanta"', 'HemaWing Pro', 95, 'idle', 9.3550, 78.8450, 0, 0);

INSERT INTO blood_inventory (blood_type, units, location_id, location_type, expiry_date, status) VALUES
  ('O-', 32, NULL, 'bank', NOW() + INTERVAL '18 days', 'available'),
  ('O+', 78, NULL, 'bank', NOW() + INTERVAL '22 days', 'available'),
  ('A+', 41, NULL, 'bank', NOW() + INTERVAL '10 days', 'available'),
  ('A-', 9, NULL, 'bank', NOW() + INTERVAL '4 days', 'available'),
  ('B+', 53, NULL, 'bank', NOW() + INTERVAL '15 days', 'available'),
  ('B-', 6, NULL, 'bank', NOW() + INTERVAL '2 days', 'reserved'),
  ('AB+', 14, NULL, 'bank', NOW() + INTERVAL '20 days', 'available'),
  ('AB-', 3, NULL, 'bank', NOW() + INTERVAL '6 days', 'available'),
  ('O+', 25, 'a1000000-0000-0000-0000-000000000001', 'hospital', NOW() + INTERVAL '19 days', 'available'),
  ('A+', 18, 'a1000000-0000-0000-0000-000000000002', 'hospital', NOW() + INTERVAL '12 days', 'available'),
  ('B+', 22, 'a1000000-0000-0000-0000-000000000004', 'hospital', NOW() + INTERVAL '25 days', 'available'),
  ('O-', 11, 'a1000000-0000-0000-0000-000000000001', 'hospital', NOW() + INTERVAL '8 days', 'reserved');

INSERT INTO deliveries (drone_id, from_location, to_hospital_id, blood_type, units, status, dispatched_at, delivered_at, distance_km, eta_minutes) VALUES
  ('d1000000-0000-0000-0000-000000000002', 'Ramanathapuram GH Blood Bank', 'a1000000-0000-0000-0000-000000000002', 'O-', 4, 'in_transit', NOW() - INTERVAL '8 minutes', NULL, 42.5, 18),
  ('d1000000-0000-0000-0000-000000000001', 'IRT-PM Blood Bank', 'a1000000-0000-0000-0000-000000000003', 'A+', 6, 'in_transit', NOW() - INTERVAL '12 minutes', NULL, 38.2, 15),
  ('d1000000-0000-0000-0000-000000000001', 'Ramanathapuram GH Blood Bank', 'a1000000-0000-0000-0000-000000000005', 'B+', 5, 'delivered', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 18.7, 0),
  ('d1000000-0000-0000-0000-000000000004', 'Rameswaram Blood Centre', 'a1000000-0000-0000-0000-000000000001', 'O+', 8, 'delivered', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', 52.3, 0),
  ('d1000000-0000-0000-0000-000000000003', 'IRT-PM Blood Bank', 'a1000000-0000-0000-0000-000000000006', 'AB-', 2, 'delivered', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours', 25.8, 0);

INSERT INTO demand_predictions (hospital_id, blood_type, predicted_units, actual_units, prediction_date, confidence, mae) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'O-', 28, 24, CURRENT_DATE, 0.88, 3.2),
  ('a1000000-0000-0000-0000-000000000001', 'O+', 42, 38, CURRENT_DATE, 0.92, 2.8),
  ('a1000000-0000-0000-0000-000000000002', 'A+', 18, 21, CURRENT_DATE, 0.85, 2.5),
  ('a1000000-0000-0000-0000-000000000002', 'B+', 15, 12, CURRENT_DATE, 0.87, 1.8),
  ('a1000000-0000-0000-0000-000000000004', 'O-', 10, 8, CURRENT_DATE - 1, 0.81, 1.5),
  ('a1000000-0000-0000-0000-000000000006', 'B+', 7, 6, CURRENT_DATE - 1, 0.79, 1.2),
  ('a1000000-0000-0000-0000-000000000003', 'AB+', 5, 4, CURRENT_DATE - 1, 0.76, 1.0),
  ('a1000000-0000-0000-0000-000000000001', 'A-', 8, 9, CURRENT_DATE - 2, 0.83, 1.6);

INSERT INTO alerts (type, message, severity, resolved) VALUES
  ('low_stock', 'AB- critically low (3 units) in Ramanathapuram GH — urgent donor drive needed', 'critical', FALSE),
  ('expiring_soon', 'B- batch #RMD-4021 expires in 2 days — 6 units at risk (Rameswaram)', 'warning', FALSE),
  ('drone_fault', 'BL-D3 entered charging mode at IRT-PM base — 34% battery', 'info', FALSE),
  ('delivery_failed', 'DEL-003 completed — 5 units B+ delivered to PHC Mandapam', 'info', TRUE),
  ('critical_demand', 'Paramakudi GH reports O- demand spike — festival trauma cases +35%', 'critical', FALSE),
  ('low_stock', 'A- critically low (9 units) across Ramanathapuram district', 'warning', FALSE);

