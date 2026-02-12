const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';

async function verifyReports() {
    console.log('--- Starting IgnisGuard Report Verification ---');

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin_1770713329728@ignisguard.com', // Using the admin created in previous verification
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('✅ Login Successful. Token received.');

        // 2. Generate Report
        console.log('Requesting Compliance Report...');
        const reportRes = await axios.get(`${API_URL}/reports/generate`, {
            headers: { 'x-auth-token': token },
            responseType: 'arraybuffer'
        });

        console.log(`Response Status: ${reportRes.status}`);
        console.log(`Content Type: ${reportRes.headers['content-type']}`);
        console.log(`Content Length: ${reportRes.data.length} bytes`);

        if (reportRes.headers['content-type'] === 'application/pdf') {
            console.log('✅ Report Generation Successful: PDF received.');
            fs.writeFileSync('test_report.pdf', reportRes.data);
            console.log('📄 Saved to test_report.pdf');
        } else {
            console.error('❌ Failed: Response is not a PDF.');
            console.log('Received Body snippet:', reportRes.data.toString().substring(0, 100));
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) {
            console.error('Server Responded:', error.response.status, error.response.data.toString());
        }
    }
    console.log('--- Verification Complete ---');
}

verifyReports();
