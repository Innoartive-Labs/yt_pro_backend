const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { processReceivedPurchaseForDailyCounter, reverseReceivedPurchaseForDailyCounter } = require('../utils/dailyCounterUtils');

// Helper function to parse CSV image format back to array
const parseImageCSV = (imageCSV) => {
    if (!imageCSV) return [];
    return imageCSV.split(';').map(item => {
        const [number, filename] = item.split(',');
        return { number: parseInt(number), filename };
    });
};

dayjs.extend(utc);
dayjs.extend(timezone);


exports.createReceivedPurchase = (req, res) => {
    const { 
        received_purchase_number,
        purchase_order_id, 
        received_date, 
        vehicle_id, 
        driver_id, 
        remarks, 
        delivery_charges 
    } = req.body;
    
    const created_by = req.user.id;
    // Process multiple vehicle images and save as CSV with numbered names
    let vehicle_images = null;
    if (req.files?.vehicle_image && req.files.vehicle_image.length > 0) {
        const vehicleImageFiles = req.files.vehicle_image;
        vehicle_images = vehicleImageFiles.map((file, index) => `${index + 1},${file.filename}`).join(';');
    }
    
    // Process multiple delivery slip images and save as CSV with numbered names
    let delivery_slip_images = null;
    if (req.files?.delivery_slip_image && req.files.delivery_slip_image.length > 0) {
        const deliverySlipImageFiles = req.files.delivery_slip_image;
        delivery_slip_images = deliverySlipImageFiles.map((file, index) => `${index + 1},${file.filename}`).join(';');
    }
    
    db.query(
        'INSERT INTO received_purchases (received_purchase_number, purchase_order_id, received_date, vehicle_id, driver_id, remarks, vehicle_images, delivery_slip_images, delivery_charges, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [received_purchase_number, purchase_order_id, received_date, vehicle_id, driver_id, remarks, vehicle_images, delivery_slip_images, delivery_charges, created_by],
        async (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            
            // Process daily counter updates if delivery charges exist
            if (delivery_charges && parseFloat(delivery_charges) > 0 && purchase_order_id) {
                try {
                    // Get company_id from purchase order
                    db.query('SELECT company_id FROM purchase_orders WHERE id = ?', [purchase_order_id], async (err, poResults) => {
                        if (err) {
                            console.error('Error fetching purchase order company_id:', err);
                        } else if (poResults.length > 0) {
                            try {
                                await processReceivedPurchaseForDailyCounter(poResults[0].company_id, delivery_charges, received_date);
                            } catch (counterError) {
                                console.error('Error processing daily counter for received purchase:', counterError);
                            }
                        }
                    });
                } catch (counterError) {
                    console.error('Error processing daily counter for received purchase:', counterError);
                }
            }
            
            res.status(201).json({ id: result.insertId, message: 'Received purchase created successfully' });
        }
    );
};

exports.getAllReceivedPurchases = (req, res) => {
    const sql = `
        SELECT rp.*, po.purchase_order_number, v.vehicle_number, d.driver_name, u.user_name as created_by_name
        FROM received_purchases rp
        LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id
        LEFT JOIN vehicles v ON rp.vehicle_id = v.id
        LEFT JOIN drivers d ON rp.driver_id = d.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.is_deleted = 0
        ORDER BY rp.created_at DESC
    `;
    
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            const receivedPurchases = results.map(receivedPurchase => ({
                ...receivedPurchase,
                received_date: dayjs(receivedPurchase.received_date).tz('Asia/Karachi').format('YYYY-MM-DD'),
                vehicle_images: parseImageCSV(receivedPurchase.vehicle_images),
                delivery_slip_images: parseImageCSV(receivedPurchase.delivery_slip_images)
            }));
            res.json(receivedPurchases);
        });
    
};

exports.getReceivedPurchaseById = (req, res) => {
    const sql = `
        SELECT rp.*, po.purchase_order_number, v.vehicle_number, d.driver_name, u.user_name as created_by_name
        FROM received_purchases rp
        LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id
        LEFT JOIN vehicles v ON rp.vehicle_id = v.id
        LEFT JOIN drivers d ON rp.driver_id = d.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.id = ? AND rp.is_deleted = 0
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Received purchase not found' });
        const receivedPurchase = results[0];
        res.json({
            ...receivedPurchase,
            received_date: dayjs(receivedPurchase.received_date).tz('Asia/Karachi').format('YYYY-MM-DD'),
            vehicle_images: parseImageCSV(receivedPurchase.vehicle_images),
            delivery_slip_images: parseImageCSV(receivedPurchase.delivery_slip_images)
        });
    });
};

exports.updateReceivedPurchase = (req, res) => {
    const { 
        received_purchase_number,
        purchase_order_id, 
        received_date, 
        vehicle_id, 
        driver_id, 
        remarks, 
        delivery_charges 
    } = req.body;
    
    // Process multiple vehicle images and save as CSV with numbered names
    let vehicle_images = req.body.vehicle_images; // Keep existing if no new files
    if (req.files?.vehicle_image && req.files.vehicle_image.length > 0) {
        const vehicleImageFiles = req.files.vehicle_image;
        vehicle_images = vehicleImageFiles.map((file, index) => `${index + 1},${file.filename}`).join(';');
    }
    
    // Process multiple delivery slip images and save as CSV with numbered names
    let delivery_slip_images = req.body.delivery_slip_images; // Keep existing if no new files
    if (req.files?.delivery_slip_image && req.files.delivery_slip_image.length > 0) {
        const deliverySlipImageFiles = req.files.delivery_slip_image;
        delivery_slip_images = deliverySlipImageFiles.map((file, index) => `${index + 1},${file.filename}`).join(';');
    }
    
    // First get the current delivery charges to calculate the difference
    db.query('SELECT delivery_charges, purchase_order_id FROM received_purchases WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResults.length === 0) return res.status(404).json({ message: 'Received purchase not found' });
        
        const currentDeliveryCharges = parseFloat(currentResults[0].delivery_charges) || 0;
        const newDeliveryCharges = parseFloat(delivery_charges) || 0;
        const deliveryChargesDifference = newDeliveryCharges - currentDeliveryCharges;
        
        db.query(
            'UPDATE received_purchases SET received_purchase_number=?, purchase_order_id=?, received_date=?, vehicle_id=?, driver_id=?, remarks=?, vehicle_images=?, delivery_slip_images=?, delivery_charges=? WHERE id=? AND is_deleted=0',
            [received_purchase_number, purchase_order_id, received_date, vehicle_id, driver_id, remarks, vehicle_images, delivery_slip_images, delivery_charges, req.params.id],
            async (err, result) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                if (result.affectedRows === 0) return res.status(404).json({ message: 'Received purchase not found' });
                
                // Process daily counter updates if delivery charges changed
                if (deliveryChargesDifference !== 0 && purchase_order_id) {
                    try {
                        // Get company_id from purchase order
                        db.query('SELECT company_id FROM purchase_orders WHERE id = ?', [purchase_order_id], async (err, poResults) => {
                            if (err) {
                                console.error('Error fetching purchase order company_id:', err);
                            } else if (poResults.length > 0) {
                                try {
                                    // If delivery charges increased, it's an additional expense
                                    // If decreased, it's a reduction in expense (income)
                                    const amountToProcess = Math.abs(deliveryChargesDifference);
                                    const amountType = deliveryChargesDifference > 0 ? 'expense' : 'income';
                                    
                                    const dailyCounter = await require('../utils/dailyCounterUtils').getOrCreateDailyCounter(poResults[0].company_id);
                                    const formattedDate = dayjs(received_date).tz('Asia/Karachi').format('YYYY-MM-DD');
                                    
                                    // Update daily counter amount
                                    await require('../utils/dailyCounterUtils').updateDailyCounterAmount(dailyCounter.id, -deliveryChargesDifference);
                                    
                                    // Insert/update daily counter detail
                                    await require('../utils/dailyCounterUtils').insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, amountToProcess, amountType);
                                    
                                } catch (counterError) {
                                    console.error('Error processing daily counter for received purchase update:', counterError);
                                }
                            }
                        });
                    } catch (counterError) {
                        console.error('Error processing daily counter for received purchase update:', counterError);
                    }
                }
                
                res.json({ message: 'Received purchase updated successfully' });
            }
        );
    });
};

exports.deleteReceivedPurchase = (req, res) => {
    // First get the received purchase details to reverse daily counter updates
    db.query('SELECT delivery_charges, received_date, purchase_order_id FROM received_purchases WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResults.length === 0) return res.status(404).json({ message: 'Received purchase not found' });
        
        const receivedPurchase = currentResults[0];
        
        db.query('UPDATE received_purchases SET is_deleted=1 WHERE id=?', [req.params.id], async (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Received purchase not found' });
            
            // Reverse daily counter updates if delivery charges exist
            if (receivedPurchase.delivery_charges && parseFloat(receivedPurchase.delivery_charges) > 0 && receivedPurchase.purchase_order_id) {
                try {
                    // Get company_id from purchase order
                    db.query('SELECT company_id FROM purchase_orders WHERE id = ?', [receivedPurchase.purchase_order_id], async (err, poResults) => {
                        if (err) {
                            console.error('Error fetching purchase order company_id:', err);
                        } else if (poResults.length > 0) {
                            try {
                                await reverseReceivedPurchaseForDailyCounter(poResults[0].company_id, receivedPurchase.delivery_charges, receivedPurchase.received_date);
                            } catch (counterError) {
                                console.error('Error reversing daily counter for received purchase deletion:', counterError);
                            }
                        }
                    });
                } catch (counterError) {
                    console.error('Error reversing daily counter for received purchase deletion:', counterError);
                }
            }
            
            res.json({ message: 'Received purchase deleted successfully' });
        });
    });
};

exports.getReceivedPurchasesByPurchaseOrder = (req, res) => {
    const { purchase_order_id } = req.params;
    
    const sql = `
        SELECT rp.*, po.purchase_order_number, v.vehicle_number, d.driver_name, u.user_name as created_by_name
        FROM received_purchases rp
        LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id
        LEFT JOIN vehicles v ON rp.vehicle_id = v.id
        LEFT JOIN drivers d ON rp.driver_id = d.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.purchase_order_id = ? AND rp.is_deleted = 0
        ORDER BY rp.created_at DESC
    `;
    
    db.query(sql, [purchase_order_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        const receivedPurchases = results.map(receivedPurchase => ({
            ...receivedPurchase,
            received_date: dayjs(receivedPurchase.received_date).tz('Asia/Karachi').format('YYYY-MM-DD'),
            vehicle_images: parseImageCSV(receivedPurchase.vehicle_images),
            delivery_slip_images: parseImageCSV(receivedPurchase.delivery_slip_images)
        }));
        res.json(receivedPurchases);
    });
}; 