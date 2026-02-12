const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for Railway/Heroku
            }
        }
    })
    : new Sequelize(
        process.env.DB_NAME || 'ignisguard',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASS || 'password',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres',
            logging: false,
        }
    );

module.exports = sequelize;
