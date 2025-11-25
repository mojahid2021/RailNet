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

    // 2. Get Train
    console.log('Fetching Trains...');
    const trainsRes = await axios.get(`${BASE_URL}/trains`, axiosConfig);
    const train = trainsRes.data.data.find(t => t.name === 'Test Express');
    if (!train) {
        console.error('Train not found');
        return;
    }

    // 3. Get Route
    console.log('Fetching Route...');
    const routeRes = await axios.get(`${BASE_URL}/train-routes/${train.trainRouteId}`, axiosConfig);
    const route = routeRes.data.data;
    console.log('Route Stations:', JSON.stringify(route.stations, null, 2));

    // 4. Create Schedule
    console.log('Creating Schedule...');
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 1); // Tomorrow
    departureDate.setHours(8, 0, 0, 0);

    const payload = {
      trainId: train.id,
      departureTime: "08:00",
      stationSchedules: route.stations.map((s, index) => ({
        stationId: s.currentStation.id,
        estimatedArrival: new Date(departureDate.getTime() + index * 3600000).toISOString(),
        estimatedDeparture: new Date(departureDate.getTime() + index * 3600000 + 900000).toISOString(),
        platformNumber: "1",
        remarks: "On Time"
      }))
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

    const res = await axios.post(`${BASE_URL}/schedules`, payload, axiosConfig);
    console.log('Schedule Created:', res.data.data.id);

  } catch (error) {
    console.error('Error Status:', error.response ? error.response.status : 'Unknown');
    console.error('Error Data:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

main();
