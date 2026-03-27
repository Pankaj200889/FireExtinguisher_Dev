require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 5000;

let server;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    console.log('Unhandled Rejection at:', promise);
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`Uncaught Exception: ${err.message}`);
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully (PostgreSQL).');

        // Drop global unique constraint on serial_number to allow multi-tenant identically named serials
        try {
            const queryInterface = sequelize.getQueryInterface();
            const indices = await queryInterface.showIndex('Assets');
            for (const index of indices) {
                // If it's a unique constraint explicitly on strictly serial_number, destroy it
                if (
                    index.name.includes('serial_number') && 
                    !index.name.includes('company_id') &&
                    index.unique === true
                ) {
                    await queryInterface.removeIndex('Assets', index.name);
                    console.log(`Successfully dropped global constraint/index: ${index.name}`);
                }
            }
        } catch (e) {
            console.log('Index dynamic sweep failed or passed natively.');
        }

        // Sync models
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');

        server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`http://localhost:${PORT}`);
        });

        // Keep alive check
        server.on('close', () => {
            console.log('Server closed');
        });

        // FORCE KEEP ALIVE
        setInterval(() => {
            console.log('Heartbeat: Server is still running...');
        }, 60000 * 60); // Log every hour

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

console.log("Railway Node.js Backend Active - Main Branch");
startServer();
