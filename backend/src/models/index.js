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

// Multi-Tenant Associations
Company.hasMany(User, { foreignKey: 'company_id' });
User.belongsTo(Company, { foreignKey: 'company_id' });

Company.hasMany(Asset, { foreignKey: 'company_id' });
Asset.belongsTo(Company, { foreignKey: 'company_id' });

Company.hasMany(Inspection, { foreignKey: 'company_id' });
Inspection.belongsTo(Company, { foreignKey: 'company_id' });

module.exports = {
    sequelize,
    User,
    Asset,
    Inspection,
    Company
};
