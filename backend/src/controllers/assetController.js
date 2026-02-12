const { Asset, Inspection, User } = require('../models');
const QRCode = require('qrcode');

// Create a new asset
exports.createAsset = async (req, res) => {
    try {
        const {
            name, type, serial_number, location, installation_date,
            mfg_year, make, capacity, unit, // New core fields
            specifications, status
        } = req.body;

        // Check if serial number exists
        const existingAsset = await Asset.findOne({ where: { serial_number } });
        if (existingAsset) {
            return res.status(400).json({ message: 'Asset with this serial number already exists' });
        }

        // Generate QR Code URL
        // TODO: update domain when deployed
        // Using local IP for dev testing so phone can scan
        const appDomain = process.env.APP_DOMAIN || 'http://192.168.1.3:5173';
        const qrUrl = `${appDomain}/v/${serial_number}`;

        // Generate default name if not provided
        const assetName = name || `${type} - ${serial_number}`;

        const asset = await Asset.create({
            name: assetName,
            type,
            serial_number,
            location,
            installation_date: installation_date || null,
            mfg_year: mfg_year === '' ? null : mfg_year,
            make,
            capacity: capacity === '' ? null : capacity,
            unit, // Save new fields
            specifications: specifications || {},
            qr_code_url: qrUrl,
            status: status, // Let model default handle it if undefined
            created_by: req.user ? req.user.id : null, // Track creator
            // last_inspection_date remains null initially
        });

        res.status(201).json(asset);
    } catch (error) {
        console.error('Asset Implementation Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all assets
// Get all assets
// Get all assets
// Get all assets
exports.getAllAssets = async (req, res) => {
    try {
        console.log(`[DEBUG] getAllAssets User: ${JSON.stringify(req.user)} Query: ${JSON.stringify(req.query)}`);

        // Base options
        let options = {
            order: [['createdAt', 'DESC']]
        };

        const userRole = req.user?.role?.toLowerCase() || '';
        let filterInspectorId = null;

        // Force inspectors to see only their own assets (Case Insensitive Check)
        if (userRole === 'inspector') {
            filterInspectorId = req.user.id;
        }
        // Allow explicit filtering for admins/others if needed via query param
        else if (req.query.inspector_id) {
            filterInspectorId = req.query.inspector_id;
        }

        if (filterInspectorId) {
            console.log(`[DEBUG] Filtering Assets by Inspector ID: ${filterInspectorId}`);
            options.include = [{
                model: Inspection,
                where: { inspector_id: filterInspectorId },
                required: true, // INNER JOIN: Only assets with inspections by this user
                attributes: []
            }];
        }

        const assets = await Asset.findAll(options);
        console.log(`[DEBUG] Found ${assets.length} assets`);
        res.json(assets);
    } catch (error) {
        console.error("GetAllAssets Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Dedicated endpoint for Reports (Heavy fetch)
exports.getComplianceReports = async (req, res) => {
    try {
        console.log("[DEBUG] Fetching Compliance Reports...");

        const assets = await Asset.findAll({
            order: [
                ['createdAt', 'DESC'],
                [Inspection, 'createdAt', 'DESC']
            ],
            include: [
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['name', 'email']
                },
                {
                    model: Inspection,
                    include: [{
                        model: User,
                        attributes: ['name', 'email']
                    }]
                }
            ]
        });

        // Debug log for specific asset to check photos
        const target = assets.find(a => a.serial_number === 'FE-2026-006');
        if (target) {
            console.log(`[DEBUG] FE-2026-006 Inspections: ${target.Inspections?.length}`);
            if (target.Inspections?.length > 0) {
                console.log(`[DEBUG] Latest Inspection Photos:`, target.Inspections[0].evidence_photos);
            }
        }

        res.json(assets);
    } catch (error) {
        console.error("Compliance Report Fetch Error:", error);
        res.status(500).json({
            message: 'Server error fetching reports',
            details: error.message,
            sqlError: error.original?.sqlMessage || error.parent?.message
        });
    }
};

// Get inspections for a specific asset
exports.getAssetInspections = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user;

        console.log("getAssetInspections - User ID:", userId, "Role:", role);

        const whereClause = { asset_id: id };

        // Inspectors can only see their own inspections
        if (role && role.toLowerCase() === 'inspector') {
            if (!userId) {
                console.error("Inspector role but no User ID in request");
                return res.status(400).json({ message: "User ID missing for inspector" });
            }
            whereClause.inspector_id = userId;
        }

        const inspections = await Inspection.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });
        res.json(inspections);
    } catch (error) {
        console.error('Fetch Inspections Error:', error);
        res.status(500).json({ message: 'Server error fetching inspections' });
    }
};

// Get asset by ID
exports.getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json(asset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get asset by Serial Number (Public/Scan)
exports.getAssetBySerial = async (req, res) => {
    try {
        console.log(`[DEBUG] Fetching asset by serial: ${req.params.serial}`);
        // Models already imported globally

        const asset = await Asset.findOne({
            where: { serial_number: req.params.serial },
            include: [{
                model: Inspection,
                limit: 1,
                order: [['createdAt', 'DESC']],
                include: [{
                    model: User,
                    attributes: ['name']
                }]
            }]
        });

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json(asset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Update asset details
exports.updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, location, installation_date,
            mfg_year, make, capacity, unit,
            specifications, status
        } = req.body;

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Update fields
        asset.name = name || asset.name;
        asset.location = location || asset.location;
        asset.installation_date = installation_date || asset.installation_date;
        asset.mfg_year = mfg_year || asset.mfg_year;
        asset.make = make || asset.make;
        asset.capacity = capacity || asset.capacity;
        asset.unit = unit || asset.unit;
        asset.status = status || asset.status;

        // Merge specifications if provided
        if (specifications) {
            asset.specifications = { ...asset.specifications, ...specifications };
        }

        await asset.save();
        res.json(asset);
    } catch (error) {
        console.error('Asset Update Error:', error);
        res.status(500).json({ message: 'Server error updating asset', error: error.message });
    }
};

// Delete asset
exports.deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await Asset.findByPk(id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        await asset.destroy();
        res.json({ message: 'Asset deleted' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Server error deleting asset' });
    }
};
