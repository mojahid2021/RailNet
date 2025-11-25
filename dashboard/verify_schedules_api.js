const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const EMAIL = 'aammojahid@gmail.com';
const PASSWORD = '11223344';

async function main() {
  try {
    // 1. Login
    console.log('Logging in to Backend...');
    const loginRes = await axios.post(`${BASE_URL}/admin/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    const token = loginRes.data.data.token;
    const axiosConfig = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    // 2. Fetch Schedules
    console.log('Fetching Schedules...');
    const res = await axios.get(`${BASE_URL}/schedules`, axiosConfig);
    console.log('Schedules Response:', JSON.stringify(res.data, null, 2));

  } catch (error) {
    console.error('Error Status:', error.response ? error.response.status : 'Unknown');
    console.error('Error Data:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

main();
