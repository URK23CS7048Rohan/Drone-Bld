// South Indian hospitals + Ramanathapuram region dataset for Blood-Line Navigator
// Covers hospitals, blood banks, and logistics across Tamil Nadu and South India

export const MOCK_INVENTORY = [
    { id: 'inv-1', blood_type: 'O-', units: 32, location_type: 'bank', expiry_date: '2026-03-18', status: 'available', created_at: '2026-02-20T10:00:00Z' },
    { id: 'inv-2', blood_type: 'O+', units: 78, location_type: 'bank', expiry_date: '2026-03-22', status: 'available', created_at: '2026-02-18T09:30:00Z' },
    { id: 'inv-3', blood_type: 'A+', units: 41, location_type: 'hospital', expiry_date: '2026-03-10', status: 'available', created_at: '2026-02-19T14:15:00Z' },
    { id: 'inv-4', blood_type: 'A-', units: 9, location_type: 'bank', expiry_date: '2026-03-04', status: 'available', created_at: '2026-02-21T08:45:00Z' },
    { id: 'inv-5', blood_type: 'B+', units: 53, location_type: 'hospital', expiry_date: '2026-03-15', status: 'available', created_at: '2026-02-17T11:20:00Z' },
    { id: 'inv-6', blood_type: 'B-', units: 6, location_type: 'bank', expiry_date: '2026-03-02', status: 'reserved', created_at: '2026-02-22T07:00:00Z' },
    { id: 'inv-7', blood_type: 'AB+', units: 14, location_type: 'hospital', expiry_date: '2026-03-20', status: 'available', created_at: '2026-02-16T16:30:00Z' },
    { id: 'inv-8', blood_type: 'AB-', units: 3, location_type: 'bank', expiry_date: '2026-03-06', status: 'available', created_at: '2026-02-23T12:00:00Z' },
    { id: 'inv-9', blood_type: 'O+', units: 25, location_type: 'hospital', expiry_date: '2026-03-19', status: 'available', created_at: '2026-02-24T09:00:00Z' },
    { id: 'inv-10', blood_type: 'A+', units: 18, location_type: 'bank', expiry_date: '2026-03-12', status: 'available', created_at: '2026-02-25T11:30:00Z' },
    { id: 'inv-11', blood_type: 'B+', units: 22, location_type: 'bank', expiry_date: '2026-03-25', status: 'available', created_at: '2026-02-26T08:00:00Z' },
    { id: 'inv-12', blood_type: 'O-', units: 11, location_type: 'hospital', expiry_date: '2026-03-08', status: 'reserved', created_at: '2026-02-27T10:00:00Z' },
]

export const MOCK_DRONES = [
    { id: 'd-1', name: 'BL-D1', model: 'MediFly X4', status: 'active', battery_level: 87, current_lat: 9.3639, current_lng: 78.8395, altitude: 42, speed: 58, last_heartbeat: '2026-02-28T01:30:00Z' },
    { id: 'd-2', name: 'BL-D2', model: 'MediFly X4', status: 'active', battery_level: 72, current_lat: 9.3817, current_lng: 78.8192, altitude: 48, speed: 64, last_heartbeat: '2026-02-28T01:29:45Z' },
    { id: 'd-3', name: 'BL-D3', model: 'HemaWing Pro', status: 'charging', battery_level: 34, current_lat: 9.3712, current_lng: 78.8301, altitude: 0, speed: 0, last_heartbeat: '2026-02-28T01:25:00Z' },
    { id: 'd-4', name: 'BL-D4', model: 'HemaWing Pro', status: 'idle', battery_level: 95, current_lat: 9.3550, current_lng: 78.8450, altitude: 0, speed: 0, last_heartbeat: '2026-02-28T01:28:30Z' },
]

// Same drones in the format the drones page expects (with battery instead of battery_level)
export const MOCK_DRONES_FLEET = [
    { id: 'd-1', name: 'BL-D1 "Lifewing"', model: 'MediFly X4', battery: 87, status: 'delivering', lat: 9.3639, lng: 78.8395, altitude: 42, speed: 58, created_at: '2026-01-15T00:00:00Z' },
    { id: 'd-2', name: 'BL-D2 "Redline"', model: 'MediFly X4', battery: 72, status: 'dispatched', lat: 9.5447, lng: 78.5912, altitude: 48, speed: 64, created_at: '2026-01-15T00:00:00Z' },
    { id: 'd-3', name: 'BL-D3 "Hemex"', model: 'HemaWing Pro', battery: 34, status: 'charging', lat: 9.3712, lng: 78.8301, altitude: 0, speed: 0, created_at: '2026-01-20T00:00:00Z' },
    { id: 'd-4', name: 'BL-D4 "Vanta"', model: 'HemaWing Pro', battery: 95, status: 'idle', lat: 9.3550, lng: 78.8450, altitude: 0, speed: 0, created_at: '2026-01-20T00:00:00Z' },
]

export const MOCK_DELIVERIES = [
    { id: 'del-1', blood_type: 'O-', units: 4, origin: 'Ramanathapuram GH Blood Bank', destination: 'Govt Hospital Paramakudi', from_location: 'Ramanathapuram GH Blood Bank', drone_id: 'd-1', drone_name: 'BL-D1', distance_km: 42.5, eta_minutes: 18, status: 'in_transit', created_at: '2026-02-28T01:15:00Z', dispatched_at: '2026-02-28T01:15:00Z', delivered_at: null, hospitals: { name: 'Govt Hospital Paramakudi' }, drones: { name: 'BL-D1 "Lifewing"' } },
    { id: 'del-2', blood_type: 'A+', units: 6, origin: 'IRT-PM Blood Bank', destination: 'Kamuthi GH', from_location: 'IRT-PM Blood Bank', drone_id: 'd-2', drone_name: 'BL-D2', distance_km: 38.2, eta_minutes: 15, status: 'in_transit', created_at: '2026-02-28T01:10:00Z', dispatched_at: '2026-02-28T01:10:00Z', delivered_at: null, hospitals: { name: 'Kamuthi GH' }, drones: { name: 'BL-D2 "Redline"' } },
    { id: 'del-3', blood_type: 'B+', units: 5, origin: 'Ramanathapuram GH Blood Bank', destination: 'PHC Mandapam', from_location: 'Ramanathapuram GH Blood Bank', drone_id: 'd-4', drone_name: 'BL-D4', distance_km: 18.7, eta_minutes: 0, status: 'delivered', created_at: '2026-02-27T22:30:00Z', dispatched_at: '2026-02-27T22:30:00Z', delivered_at: '2026-02-27T23:05:00Z', hospitals: { name: 'PHC Mandapam' }, drones: { name: 'BL-D4 "Vanta"' } },
    { id: 'del-4', blood_type: 'O+', units: 8, origin: 'Rameswaram Blood Centre', destination: 'GH Ramanathapuram', from_location: 'Rameswaram Blood Centre', drone_id: 'd-1', drone_name: 'BL-D1', distance_km: 52.3, eta_minutes: 0, status: 'delivered', created_at: '2026-02-27T18:45:00Z', dispatched_at: '2026-02-27T18:45:00Z', delivered_at: '2026-02-27T19:30:00Z', hospitals: { name: 'GH Ramanathapuram' }, drones: { name: 'BL-D1 "Lifewing"' } },
    { id: 'del-5', blood_type: 'AB-', units: 2, origin: 'IRT-PM Blood Bank', destination: 'Mudukulathur GH', from_location: 'IRT-PM Blood Bank', drone_id: 'd-3', drone_name: 'BL-D3', distance_km: 25.8, eta_minutes: 0, status: 'delivered', created_at: '2026-02-27T14:20:00Z', dispatched_at: '2026-02-27T14:20:00Z', delivered_at: '2026-02-27T14:55:00Z', hospitals: { name: 'Mudukulathur GH' }, drones: { name: 'BL-D3 "Hemex"' } },
    { id: 'del-6', blood_type: 'O-', units: 3, origin: 'Ramanathapuram GH Blood Bank', destination: 'Thiruvadanai PHC', from_location: 'Ramanathapuram GH Blood Bank', drone_id: 'd-4', drone_name: 'BL-D4', distance_km: 34.1, eta_minutes: 0, status: 'delivered', created_at: '2026-02-26T20:10:00Z', dispatched_at: '2026-02-26T20:10:00Z', delivered_at: '2026-02-26T20:48:00Z', hospitals: { name: 'Thiruvadanai PHC' }, drones: { name: 'BL-D4 "Vanta"' } },
    { id: 'del-7', blood_type: 'B+', units: 4, origin: 'Rameswaram Blood Centre', destination: 'Tondi PHC', from_location: 'Rameswaram Blood Centre', drone_id: null, drone_name: null, distance_km: 28.6, eta_minutes: 0, status: 'pending', created_at: '2026-02-28T00:30:00Z', dispatched_at: '2026-02-28T00:30:00Z', delivered_at: null, hospitals: { name: 'Tondi PHC' }, drones: null },
]

export const MOCK_ALERTS = [
    { id: 'a-1', type: 'low_stock', severity: 'critical', message: 'AB- stock at 3 units in Ramanathapuram GH — urgent donor drive needed', status: 'active', resolved: false, created_at: '2026-02-28T01:00:00Z' },
    { id: 'a-2', type: 'expiring_soon', severity: 'warning', message: 'B- batch #RMD-4021 expires in 2 days — 6 units at risk (Rameswaram Centre)', status: 'active', resolved: false, created_at: '2026-02-27T22:15:00Z' },
    { id: 'a-3', type: 'drone_fault', severity: 'info', message: 'BL-D3 entered charging mode at IRT-PM base — 34% battery', status: 'active', resolved: false, created_at: '2026-02-28T01:25:00Z' },
    { id: 'a-4', type: 'delivery_failed', severity: 'info', message: 'DEL-003 completed — 5 units B+ delivered to PHC Mandapam', status: 'resolved', resolved: true, created_at: '2026-02-27T22:32:00Z' },
    { id: 'a-5', type: 'critical_demand', severity: 'warning', message: 'Paramakudi GH reports O- demand spike — festival trauma cases +35%', status: 'active', resolved: false, created_at: '2026-02-27T20:00:00Z' },
    { id: 'a-6', type: 'low_stock', severity: 'critical', message: 'A- critically low (9 units) across Ramanathapuram district', status: 'active', resolved: false, created_at: '2026-02-28T00:45:00Z' },
]

export const MOCK_HOSPITALS = [
    // Ramanathapuram District
    { id: 'h-1', name: 'GH Ramanathapuram', city: 'Ramanathapuram', address: 'Collector Office Road, Ramanathapuram 623501', lat: 9.3639, lng: 78.8395, capacity: 450, contact: '+91-4567-220330', contact_number: '+91-4567-220330', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-2', name: 'Govt Hospital Paramakudi', city: 'Paramakudi', address: 'Main Road, Paramakudi 623707', lat: 9.5447, lng: 78.5912, capacity: 300, contact: '+91-4564-224455', contact_number: '+91-4564-224455', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-3', name: 'Kamuthi Government Hospital', city: 'Kamuthi', address: 'Hospital Road, Kamuthi 623604', lat: 9.4023, lng: 78.9433, capacity: 180, contact: '+91-4577-262233', contact_number: '+91-4577-262233', emergency_active: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-4', name: 'Rameswaram Govt Hospital', city: 'Rameswaram', address: 'Pamban Road, Rameswaram 623526', lat: 9.2876, lng: 79.3129, capacity: 200, contact: '+91-4573-221100', contact_number: '+91-4573-221100', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-5', name: 'PHC Mandapam', city: 'Mandapam', address: 'Mandapam Camp 623518', lat: 9.2817, lng: 79.1237, capacity: 50, contact: '+91-4573-238844', contact_number: '+91-4573-238844', emergency_active: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-6', name: 'Mudukulathur GH', city: 'Mudukulathur', address: 'Bus Stand Road, Mudukulathur 623703', lat: 9.3317, lng: 78.5083, capacity: 150, contact: '+91-4564-253322', contact_number: '+91-4564-253322', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-7', name: 'Thiruvadanai PHC', city: 'Thiruvadanai', address: 'Thiruvadanai Town 623407', lat: 9.7417, lng: 78.9917, capacity: 60, contact: '+91-4564-244411', contact_number: '+91-4564-244411', emergency_active: false, created_at: '2026-01-01T00:00:00Z' },
    // Madurai
    { id: 'h-8', name: 'Govt Rajaji Hospital (GRH)', city: 'Madurai', address: 'Panagal Road, Madurai 625020', lat: 9.9252, lng: 78.1198, capacity: 2800, contact: '+91-452-2532535', contact_number: '+91-452-2532535', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-9', name: 'Meenakshi Mission Hospital', city: 'Madurai', address: 'Lake Area, Melur Road, Madurai 625107', lat: 9.9485, lng: 78.1600, capacity: 600, contact: '+91-452-2588741', contact_number: '+91-452-2588741', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    // Chennai
    { id: 'h-10', name: 'Govt General Hospital Chennai', city: 'Chennai', address: 'Park Town, Chennai 600003', lat: 13.0827, lng: 80.2707, capacity: 3200, contact: '+91-44-25305000', contact_number: '+91-44-25305000', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'h-11', name: 'Apollo Hospitals Chennai', city: 'Chennai', address: '21 Greams Lane, Chennai 600006', lat: 13.0604, lng: 80.2496, capacity: 700, contact: '+91-44-28293333', contact_number: '+91-44-28293333', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    // Coimbatore
    { id: 'h-12', name: 'CMCH Coimbatore', city: 'Coimbatore', address: 'Avinashi Road, Coimbatore 641014', lat: 11.0168, lng: 76.9558, capacity: 1500, contact: '+91-422-2301393', contact_number: '+91-422-2301393', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    // Trichy
    { id: 'h-13', name: 'Govt Hospital Trichy', city: 'Tiruchirappalli', address: 'Royal Road, Trichy 620001', lat: 10.8155, lng: 78.6967, capacity: 1200, contact: '+91-431-2414969', contact_number: '+91-431-2414969', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    // Kochi
    { id: 'h-14', name: 'Amrita Hospital Kochi', city: 'Kochi', address: 'Ponekkara, Kochi 682041', lat: 10.0261, lng: 76.3125, capacity: 1350, contact: '+91-484-2858100', contact_number: '+91-484-2858100', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
    // Bangalore
    { id: 'h-15', name: 'Nimhans Bangalore', city: 'Bangalore', address: 'Hosur Road, Bangalore 560029', lat: 12.9381, lng: 77.5965, capacity: 1000, contact: '+91-80-26995000', contact_number: '+91-80-26995000', emergency_active: true, created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_PREDICTIONS = [
    { id: 'p-1', hospital_id: 'h-1', hospital_name: 'GH Ramanathapuram', blood_type: 'O-', predicted_units: 28, actual_units: 24, confidence: 0.88, prediction_date: '2026-02-28', mae: 3.2 },
    { id: 'p-2', hospital_id: 'h-1', hospital_name: 'GH Ramanathapuram', blood_type: 'O+', predicted_units: 42, actual_units: 38, confidence: 0.92, prediction_date: '2026-02-28', mae: 2.8 },
    { id: 'p-3', hospital_id: 'h-2', hospital_name: 'Govt Hospital Paramakudi', blood_type: 'A+', predicted_units: 18, actual_units: 21, confidence: 0.85, prediction_date: '2026-02-28', mae: 2.5 },
    { id: 'p-4', hospital_id: 'h-2', hospital_name: 'Govt Hospital Paramakudi', blood_type: 'B+', predicted_units: 15, actual_units: 12, confidence: 0.87, prediction_date: '2026-02-28', mae: 1.8 },
    { id: 'p-5', hospital_id: 'h-4', hospital_name: 'Rameswaram Govt Hospital', blood_type: 'O-', predicted_units: 10, actual_units: 8, confidence: 0.81, prediction_date: '2026-02-27', mae: 1.5 },
    { id: 'p-6', hospital_id: 'h-6', hospital_name: 'Mudukulathur GH', blood_type: 'B+', predicted_units: 7, actual_units: 6, confidence: 0.79, prediction_date: '2026-02-27', mae: 1.2 },
    { id: 'p-7', hospital_id: 'h-3', hospital_name: 'Kamuthi Government Hospital', blood_type: 'AB+', predicted_units: 5, actual_units: 4, confidence: 0.76, prediction_date: '2026-02-27', mae: 1.0 },
    { id: 'p-8', hospital_id: 'h-1', hospital_name: 'GH Ramanathapuram', blood_type: 'A-', predicted_units: 8, actual_units: 9, confidence: 0.83, prediction_date: '2026-02-26', mae: 1.6 },
    { id: 'p-9', hospital_id: 'h-8', hospital_name: 'Govt Rajaji Hospital', blood_type: 'O+', predicted_units: 65, actual_units: 58, confidence: 0.90, prediction_date: '2026-02-28', mae: 4.2 },
    { id: 'p-10', hospital_id: 'h-10', hospital_name: 'Govt General Hospital Chennai', blood_type: 'A+', predicted_units: 48, actual_units: 44, confidence: 0.91, prediction_date: '2026-02-28', mae: 3.0 },
    { id: 'p-11', hospital_id: 'h-12', hospital_name: 'CMCH Coimbatore', blood_type: 'B+', predicted_units: 30, actual_units: 28, confidence: 0.86, prediction_date: '2026-02-27', mae: 2.2 },
    { id: 'p-12', hospital_id: 'h-14', hospital_name: 'Amrita Hospital Kochi', blood_type: 'O-', predicted_units: 22, actual_units: null, confidence: 0.84, prediction_date: '2026-03-01', mae: null },
]
