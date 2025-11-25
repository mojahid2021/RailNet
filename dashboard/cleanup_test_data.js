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

    // 2. Find and Delete Train
    console.log('Finding Train...');
    const trainsRes = await axios.get(`${BASE_URL}/trains`, axiosConfig);
    const train = trainsRes.data.data.find(t => t.name === 'Test Express');
    if (train) {
        console.log(`Deleting Train: ${train.id}`);
        await axios.delete(`${BASE_URL}/trains/${train.id}`, axiosConfig);
    } else {
        console.log('Train not found.');
    }

    // 3. Find and Delete Route
    console.log('Finding Route...');
    const routesRes = await axios.get(`${BASE_URL}/train-routes`, axiosConfig);
    const route = routesRes.data.data.find(r => r.name === 'Route A-B');
    if (route) {
        console.log(`Deleting Route: ${route.id}`);
        await axios.delete(`${BASE_URL}/train-routes/${route.id}`, axiosConfig);
    } else {
        console.log('Route not found.');
    }

    // 4. Find and Delete Compartment
    console.log('Finding Compartment...');
    const compsRes = await axios.get(`${BASE_URL}/compartments`, axiosConfig);
    const compartment = compsRes.data.data.find(c => c.name === 'AC Class');
    if (compartment) {
        console.log(`Deleting Compartment: ${compartment.id}`);
        await axios.delete(`${BASE_URL}/compartments/${compartment.id}`, axiosConfig);
    } else {
        console.log('Compartment not found.');
    }

    // 5. Find and Delete Stations
    console.log('Finding Stations...');
    const stationsRes = await axios.get(`${BASE_URL}/stations`, axiosConfig);
    const stationA = stationsRes.data.data.find(s => s.name === 'Station A');
    const stationB = stationsRes.data.data.find(s => s.name === 'Station B');

    if (stationA) {
        console.log(`Deleting Station A: ${stationA.id}`);
        await axios.delete(`${BASE_URL}/stations/${stationA.id}`, axiosConfig);
    }
    if (stationB) {
        console.log(`Deleting Station B: ${stationB.id}`);
        await axios.delete(`${BASE_URL}/stations/${stationB.id}`, axiosConfig);
    }

    console.log('Cleanup Complete!');

  } catch (error) {
    console.error('Error Status:', error.response ? error.response.status : 'Unknown');
    console.error('Error Data:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

main();
