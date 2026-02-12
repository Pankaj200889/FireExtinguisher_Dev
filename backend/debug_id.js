require('dotenv').config();
const { Asset } = require('./src/models');
const sequelize = require('./src/config/db');

async function checkID() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const id = '8eaac21e-de87-4f18-a17d-ae4a83433314';
        console.log(`Checking ID: ${id}`);

        // Check raw query to be sure
        const [results] = await sequelize.query(`SELECT * FROM "Assets" WHERE id = '${id}'`);
        console.log('Raw Query Result Count:', results.length);
        if (results.length > 0) {
            console.log('Raw Row:', results[0]);
        }

        // Check Sequelize findByPk
        const asset = await Asset.findByPk(id);
        if (asset) {
            console.log('Sequelize findByPk: Found');
            console.log('Name:', asset.name);
            console.log('Serial:', asset.serial_number);
        } else {
            console.log('Sequelize findByPk: NOT FOUND');
        }

        // Check paranoid (deleted)
        const assetParanoid = await Asset.findByPk(id, { paranoid: false });
        if (assetParanoid && !asset) {
            console.log('Asset is SOFT DELETED');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkID();
