const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const config = require('../backend/src/config/db.js');

async function testQuery() {
    try {
        console.log("Connecting to Database...");
        const sequelize = config;
        await sequelize.authenticate();
        console.log("Database connected.");

        // LIST TABLES
        const tables = await sequelize.getQueryInterface().showAllSchemas();
        console.log("Tables:", tables);

        // CHECK TABLE STRUCTURE
        const assetDesc = await sequelize.getQueryInterface().describeTable('Assets');
        console.log("Assets Table:", Object.keys(assetDesc));

        try {
            const inspDesc = await sequelize.getQueryInterface().describeTable('Inspections');
            console.log("Inspections Table:", Object.keys(inspDesc));
        } catch (e) {
            console.log("Inspections Table: (Probably Does Not Exist)", e.message);
        }

        // CHECK SAMPLE DATA
        const [results] = await sequelize.query("SELECT id, serial_number, make, mfg_year, capacity FROM Assets LIMIT 5");
        console.log("Assets Sample:", results);

        // RUN FAILING QUERY
        console.log("Running Inspection Include Query...");
        const { Asset, Inspection, User } = require('../backend/src/models');

        // Ensure Models are Synced (Just in case, but usually dangerous in prod)
        // await sequelize.sync({ alter: true }); // Let's avoid altering if possible, just read.

        const assets = await Asset.findAll({
            limit: 1,
            include: [{
                model: Inspection,
                include: [{
                    model: User,
                    attributes: ['name', 'username']
                }]
            }]
        });
        console.log("Query Success! Found:", assets.length);
        console.log("First result:", JSON.stringify(assets[0], null, 2));

    } catch (error) {
        console.error("FATAL ERROR:", error);
        console.error("Original SQL Error:", error.original);
    } finally {
        process.exit();
    }
}

testQuery();
