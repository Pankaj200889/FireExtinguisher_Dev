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

        // Deep Postgres Sweep: Drop any strictly serial_number unique constraint
        try {
            const [constraints] = await sequelize.query(`
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = '"Assets"'::regclass 
                AND conname ILIKE '%serial_number%'
                AND conname NOT ILIKE '%company_id%';
            `);
            for (let c of constraints) {
                await sequelize.query(`ALTER TABLE "Assets" DROP CONSTRAINT IF EXISTS "${c.conname}" CASCADE;`);
                console.log(`Aggressively shattered native constraint: ${c.conname}`);
            }
            
            // Also scrub indexes directly since Postgres protects constraints with indexes
            const [indexes] = await sequelize.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename ILIKE '%asset%' 
                AND indexname ILIKE '%serial_number%'
                AND indexname NOT ILIKE '%company_id%';
            `);
            for (let idx of indexes) {
                await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}" CASCADE;`);
                console.log(`Aggressively shattered native index: ${idx.indexname}`);
            }
        } catch (e) {
            console.log('Postgres raw constraint check failed or table not found yet.');
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
