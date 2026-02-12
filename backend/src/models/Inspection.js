const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inspection = sequelize.define('Inspection', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    inspection_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    // Checklist results, remarks, and observation status
    findings: {
        type: DataTypes.JSONB,
        defaultValue: {},
        /* Example structure:
          {
            checklist: { "Pressure Gauge": "Pass", "Safety Pin": "Fail" },
            remarks: "Pin missing",
            observation: "Requires Maintenance"
          }
        */
    },
    // Array of image URLs
    evidence_photos: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    status: {
        type: DataTypes.ENUM('Pass', 'Fail', 'Maintenance'),
        allowNull: false,
    },
    locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True if inspection is older than 48 hours or manually locked',
    },
}, {
    timestamps: true,
});

module.exports = Inspection;
