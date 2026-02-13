const { Inspection, Asset, User } = require('../models');
const { Op } = require('sequelize');

// Check if asset is locked for inspection (within 48 hours of last inspection)
exports.checkLockStatus = async (req, res) => {
    try {
        const { serial } = req.params;
        const asset = await Asset.findOne({ where: { serial_number: serial } });

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        if (!asset.last_inspection_date) {
            return res.json({ locked: false, message: 'Ready for inspection' });
        }

        const lastInspectionTime = new Date(asset.last_inspection_date).getTime();
        const currentTime = new Date().getTime();
        const hoursSinceLast = (currentTime - lastInspectionTime) / (1000 * 60 * 60);

        if (hoursSinceLast < 48) {
            // Fetch the last inspection to show summary
            const lastInspection = await Inspection.findOne({
                where: { asset_id: asset.id },
                order: [['createdAt', 'DESC']],
                include: [{ model: User, attributes: ['name'] }]
            });

            return res.json({
                locked: true,
                message: 'Inspection recently completed',
                remaining_hours: 48 - hoursSinceLast,
                last_inspection: lastInspection
            });
        }

        res.json({ locked: false, message: 'Ready for inspection' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Submit a new inspection
exports.submitInspection = async (req, res) => {
    try {
        const {
            asset_id, status, findings, evidence_photos,
            // Maintenance Dates (Optional updates during inspection)
            last_hydro_test_date, next_hydro_test_due,
            last_refilled_date, next_refill_due,
            discharge_date
        } = req.body;
        const inspector_id = req.user.id;

        const asset = await Asset.findByPk(asset_id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Create Inspection
        const inspection = await Inspection.create({
            asset_id,
            inspector_id,
            status,
            findings,
            evidence_photos,
            inspection_date: new Date()
        });

        // Update Asset Status & Dates
        let newAssetStatus = asset.status;
        if (status === 'Fail' || status === 'Maintenance') {
            newAssetStatus = 'Maintenance Required';
        } else if (status === 'Pass') {
            newAssetStatus = 'Operational';
        }

        // Calculate next due date (defaulting to Monthly for MVP, can be dynamic based on Asset Type)
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);

        // Prepare update object with fallback to existing values if not provided
        // Only update maintenance dates if they are passed in the request (i.e., edited by user)
        const updateData = {
            status: newAssetStatus,
            last_inspection_date: new Date(),
            next_inspection_due: nextDue
        };

        if (last_hydro_test_date) updateData.last_hydro_test_date = last_hydro_test_date;
        if (next_hydro_test_due) updateData.next_hydro_test_due = next_hydro_test_due;
        if (last_refilled_date) updateData.last_refilled_date = last_refilled_date;
        if (next_refill_due) updateData.next_refill_due = next_refill_due;
        if (discharge_date) updateData.discharge_date = discharge_date;

        await asset.update(updateData);

        res.status(201).json({ message: 'Inspection submitted successfully', inspection });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Inspection History for an Asset
exports.getAssetHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user;

        const whereClause = { asset_id: id };

        // Inspectors can only see their own inspections
        if (role && role.toLowerCase() === 'inspector') {
            if (!userId) {
                return res.status(400).json({ message: "User ID missing for inspector" });
            }
            whereClause.inspector_id = userId;
        }

        const inspections = await Inspection.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['name'] }]
        });

        res.json(inspections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get Single Inspection by ID
// Update existing inspection
exports.updateInspection = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status, findings, evidence_photos,
            // Maintenance Dates (Optional updates)
            last_hydro_test_date, next_hydro_test_due,
            last_refilled_date, next_refill_due,
            discharge_date
        } = req.body;

        const inspection = await Inspection.findByPk(id);
        if (!inspection) {
            return res.status(404).json({ message: 'Inspection not found' });
        }

        // Update Inspection
        await inspection.update({
            status,
            findings,
            evidence_photos,
            // Assuming inspection_date remains original or updates to now? Keeping original usually better for history, or explicit update.
            // Let's keep original date unless specifically requested, but for corrections usually we keep the record ID.
        });

        // Update Asset Status & Dates (Sync with latest correction)
        const asset = await Asset.findByPk(inspection.asset_id);
        if (asset) {
            let newAssetStatus = asset.status;
            if (status === 'Fail' || status === 'Maintenance') {
                newAssetStatus = 'Maintenance Required';
            } else if (status === 'Pass') {
                newAssetStatus = 'Operational';
            }

            const updateData = { status: newAssetStatus };
            if (last_hydro_test_date) updateData.last_hydro_test_date = last_hydro_test_date;
            if (next_hydro_test_due) updateData.next_hydro_test_due = next_hydro_test_due;
            if (last_refilled_date) updateData.last_refilled_date = last_refilled_date;
            if (next_refill_due) updateData.next_refill_due = next_refill_due;
            if (discharge_date) updateData.discharge_date = discharge_date;

            await asset.update(updateData);
        }

        res.json({ message: 'Inspection updated successfully', inspection });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error check', error: error.message });
    }
};

exports.getInspectionById = async (req, res) => {
    try {
        const { id } = req.params;
        const inspection = await Inspection.findByPk(id, {
            include: [{ model: User, attributes: ['name'] }]
        });

        if (!inspection) {
            return res.status(404).json({ message: 'Inspection not found' });
        }
        res.json(inspection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getMyStats = async (req, res) => {
    try {
        const inspector_id = req.user.id;

        if (!inspector_id) {
            return res.status(400).json({ message: "User ID missing" });
        }

        const whereClause = { inspector_id };

        const total = await Inspection.count({ where: whereClause });
        const passed = await Inspection.count({ where: { inspector_id, status: 'Pass' } });
        const failed = await Inspection.count({ where: { inspector_id, status: 'Fail' } });
        const maintenance = await Inspection.count({ where: { inspector_id, status: 'Maintenance' } });

        // Calculate Average Pass Rate per Category
        // 1. Fetch all inspections for this user (Raw, no joins to avoid filtering issues)
        const inspections = await Inspection.findAll({
            where: { inspector_id },
            raw: true
        });

        console.log(`[DEBUG] MyStats - Manual Fetch Count: ${inspections.length}`);

        // 2. Extract unique Asset IDs
        const assetIds = [...new Set(inspections.map(i => i.asset_id).filter(id => id))];

        // 3. Fetch Asset Types manually
        const assets = await Asset.findAll({
            where: { id: assetIds },
            attributes: ['id', 'type'],
            raw: true
        });

        // 4. Create lookup map
        const assetTypeMap = {};
        assets.forEach(a => {
            assetTypeMap[a.id] = a.type;
        });

        const breakdown = {
            'Fire Extinguisher': { total: 0, operational: 0, health: 0 },
            'Fire Hose Reel': { total: 0, operational: 0, health: 0 },
            'Hydrant Hose Reel': { total: 0, operational: 0, health: 0 },
            'Fire Sand Bucket': { total: 0, operational: 0, health: 0 }
        };

        // 5. Aggregate
        inspections.forEach(insp => {
            let type = assetTypeMap[insp.asset_id];

            if (!type) {
                // If asset not found in DB (deleted?) or asset_id null
                type = 'Unknown';
            }

            // Normalize
            const normType = type.toLowerCase().trim();
            const mapKeys = {
                'fire-extinguisher': 'Fire Extinguisher',
                'fire extinguisher': 'Fire Extinguisher',
                'fire hose reel': 'Fire Hose Reel',
                'hose-reel': 'Fire Hose Reel',
                'hydrant': 'Hydrant Hose Reel',
                'hydrant hose reel': 'Hydrant Hose Reel',
                'fire bucket': 'Fire Sand Bucket',
                'fire sand bucket': 'Fire Sand Bucket',
                'sand-bucket': 'Fire Sand Bucket'
            };

            const finalType = mapKeys[normType] || type;

            if (!breakdown[finalType]) {
                breakdown[finalType] = { total: 0, operational: 0, health: 0 };
            }

            breakdown[finalType].total++;

            if (insp.status === 'Pass' || insp.status === 'Operational') {
                breakdown[finalType].operational++;
            }
        });

        // Calculate % Health
        Object.keys(breakdown).forEach(key => {
            const item = breakdown[key];
            if (item.total > 0) {
                item.health = Math.round((item.operational / item.total) * 100);
            }
        });

        // Remove 'Unknown' category if it exists to keep UI clean
        delete breakdown['Unknown'];

        res.json({
            total,
            passed,
            failed,
            maintenance,
            breakdown
        });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
