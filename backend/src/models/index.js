const sequelize = require('../config/db');
const User = require('./User');
const Asset = require('./Asset');
const Inspection = require('./Inspection');

const Company = require('./Company');

// Associations
User.hasMany(Inspection, { foreignKey: 'inspector_id' });
Inspection.belongsTo(User, { foreignKey: 'inspector_id' });

Asset.hasMany(Inspection, { foreignKey: 'asset_id' });
Inspection.belongsTo(Asset, { foreignKey: 'asset_id' });
Asset.belongsTo(User, { as: 'Creator', foreignKey: 'created_by' });

module.exports = {
    sequelize,
    User,
    Asset,
    Inspection,
    Company
};
