const db = require('../utils/db');

exports.createVehicle = (req, res) => {
    const { vehicle_name, vehicle_type, vehicle_number, vehicle_owner, vehicle_owner_phone, vehicle_owner_address, vehicle_owner_cnic } = req.body;
    let vehicle_image = req.file ? req.file.filename : null;
    db.query('INSERT INTO vehicles (vehicle_name, vehicle_type, vehicle_number, vehicle_owner, vehicle_owner_phone, vehicle_owner_address, vehicle_owner_cnic, vehicle_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [vehicle_name, vehicle_type, vehicle_number, vehicle_owner, vehicle_owner_phone, vehicle_owner_address, vehicle_owner_cnic, vehicle_image], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllVehicles = (req, res) => {
    db.query('SELECT * FROM vehicles WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getVehicleById = (req, res) => {
    db.query('SELECT * FROM vehicles WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Vehicle not found' });
        res.json(results[0]);
    });
};

exports.updateVehicle = (req, res) => {
    const { vehicle_name, vehicle_type, vehicle_number, vehicle_owner, vehicle_owner_phone, vehicle_owner_address, vehicle_owner_cnic } = req.body;
    let vehicle_image = req.file ? req.file.filename : req.body.vehicle_image;
    db.query('UPDATE vehicles SET vehicle_name=?, vehicle_type=?, vehicle_number=?, vehicle_owner=?, vehicle_owner_phone=?, vehicle_owner_address=?, vehicle_owner_cnic=?, vehicle_image=? WHERE id=? AND is_deleted=0', [vehicle_name, vehicle_type, vehicle_number, vehicle_owner, vehicle_owner_phone, vehicle_owner_address, vehicle_owner_cnic, vehicle_image, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Vehicle updated' });
    });
};

exports.deleteVehicle = (req, res) => {
    db.query('UPDATE vehicles SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Vehicle deleted (soft)' });
    });
}; 