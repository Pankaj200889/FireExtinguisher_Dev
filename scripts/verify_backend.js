const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';
let assetSerialNumber = 'TEST-FE-001';
let assetId = '';

const client = axios.create({ baseURL: API_URL });

async function runVerification() {
    console.log('--- Starting IgnisGuard Backend Verification ---');

    try {
        // 1. Health Check
        try {
            const health = await client.get('/');
            console.log('✅ Backend is running:', health.data.message);
        } catch (e) {
            console.error('❌ Backend not reachable. Is it running?');
            process.exit(1);
        }

        // 2. Register Admin
        const email = `admin_${Date.now()}@ignisguard.com`;
        const password = 'password123';
        try {
            await client.post('/auth/register', {
                name: 'Test Admin',
                email,
                password,
                role: 'admin'
            });
            console.log('✅ Admin Registered:', email);
        } catch (e) {
            console.log('⚠️ Registration failed (might extend):', e.response?.data?.message || e.message);
        }

        // 3. Login
        try {
            const loginRes = await client.post('/auth/login', { email, password });
            token = loginRes.data.token;
            client.defaults.headers.common['x-auth-token'] = token;
            console.log('✅ Login Successful. Token received.');
        } catch (e) {
            console.error('❌ Login Failed:', e.response?.data || e.message);
            process.exit(1);
        }

        // 4. Create Asset
        try {
            const assetRes = await client.post('/assets', {
                name: 'Test Extinguisher',
                type: 'Fire Extinguisher',
                serial_number: assetSerialNumber,
                location: 'Test Lab',
                specifications: { capacity: 5, unit: 'KG' }
            });
            assetId = assetRes.data.id;
            console.log('✅ Asset Created:', assetSerialNumber);
        } catch (e) {
            if (e.response?.status === 400 && e.response.data.message.includes('already exists')) {
                console.log('⚠️ Asset already exists, fetching details...');
                // Fetch the asset to get ID
                try {
                    // We need a get by serial endpoint or search.
                    // We verified checking by serial public endpoint
                    const publicAsset = await client.get(`/assets/scan/${assetSerialNumber}`);
                    assetId = publicAsset.data.id;
                    console.log('✅ Asset Found:', assetSerialNumber);
                } catch (err) {
                    console.error('❌ Could not fallback fetch asset:', err.message);
                }
            } else {
                console.error('❌ Asset Creation Failed:', e.response?.data || e.message);
            }
        }

        if (!assetId) {
            console.error('❌ Cannot proceed without Asset ID');
            process.exit(1);
        }

        // 5. Submit Inspection
        try {
            await client.post('/inspections', {
                asset_id: assetId,
                status: 'Pass',
                findings: { checklist: { pressure: 'ok' } },
                evidence_photos: []
            });
            console.log('✅ Inspection Submitted.');
        } catch (e) {
            console.error('❌ Inspection Submission Failed:', e.response?.data || e.message);
        }

        // 6. Check Lock Status
        try {
            const lockRes = await client.get(`/inspections/check-lock/${assetSerialNumber}`);
            if (lockRes.data.locked) {
                console.log('✅ 48-Hour Lock Verified: Asset is Locked.');
            } else {
                console.warn('⚠️ Asset is NOT Locked (First inspection?)');
            }
        } catch (e) {
            console.error('❌ Lock Check Failed:', e.message);
        }

        console.log('--- Verification Complete ---');

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

runVerification();
