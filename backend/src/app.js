const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https:", "https://res.cloudinary.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Debug logging
app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Health Check
app.get('/', (req, res) => res.json({ message: 'IgnisGuard Backend Running' }));
app.get('/api', (req, res) => res.json({ message: 'IgnisGuard API Ready' }));

// Mount Routes
// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/inspections', require('./routes/inspectionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

module.exports = app;
