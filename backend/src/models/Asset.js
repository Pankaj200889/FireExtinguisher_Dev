const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Asset = sequelize.define('Asset', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING, // Changed from ENUM to STRING to avoid sync issues
        allowNull: false,
    },
    serial_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    installation_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    // Core details promoted to columns
    mfg_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    make: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    capacity: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'KG',
    },
    // Maintenance Dates (Dynamic)
    last_hydro_test_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    next_hydro_test_due: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    last_refilled_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    next_refill_due: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    discharge_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    // JSON for extra type-specifics
    specifications: {
        type: DataTypes.JSON, // Changed from JSONB for wider compatibility
        defaultValue: {},
    },
    qr_code_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null for existing assets migration
        references: {
            model: 'Users', // Name of table
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING, // Changed from ENUM to STRING
        defaultValue: 'Pending Inspection',
    },
    last_inspection_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    next_inspection_due: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
}, {
    timestamps: true,
    paranoid: true, // Enable Soft Deletes
    indexes: [
        {
            unique: true,
            fields: ['serial_number'],
        },
    ],
});

module.exports = Asset;
