const { Asset } = require('./src/models');
const sequelize = require('./src/config/db');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const serial = 'FSB-003';
        const asset = await Asset.findOne({ where: { serial_number: serial } });

        if (!asset) {
            console.log(`Asset ${serial} not found.`);
        } else {
            console.log(`Asset Found: ${asset.name} (ID: ${asset.id})`);
            console.log(`Type of ID: ${typeof asset.id}`);

            // Test findByPk
            const valid = await Asset.findByPk(asset.id);
            if (valid) {
                console.log('findByPk success.');
            } else {
                console.log('findByPk FAILED.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

check();
