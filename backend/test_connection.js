
const axios = require('axios');

async function testConnection() {
    try {
        console.log("Testing connection to http://127.0.0.1:8000/health...");
        const response = await axios.get('http://127.0.0.1:8000/health');
        console.log("Response:", response.data);
    } catch (error) {
        console.error("Connection failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testConnection();
