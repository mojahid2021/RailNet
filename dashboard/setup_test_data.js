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
    console.log('Got Token');
    
    const axiosConfig = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    // 2. Get Stations
    console.log('Fetching stations...');
    const stationsRes = await axios.get(`${BASE_URL}/stations`, axiosConfig);
    const stations = stationsRes.data.data;
    
    let stationA = stations.find(s => s.name === 'Station A');
    let stationB = stations.find(s => s.name === 'Station B');

    if (!stationA) {
        console.log('Creating Station A...');
        const res = await axios.post(`${BASE_URL}/stations`, {
            name: 'Station A',
            city: 'STA',
            district: 'Loc A',
            division: 'Div A',
            latitude: 0,
            longitude: 0
        }, axiosConfig);
        stationA = res.data.data;
    }
    if (!stationB) {
        console.log('Creating Station B...');
        const res = await axios.post(`${BASE_URL}/stations`, {
            name: 'Station B',
            city: 'STB',
            district: 'Loc B',
            division: 'Div B',
            latitude: 0,
            longitude: 0
        }, axiosConfig);
        stationB = res.data.data;
    }
    console.log(`Found Station A: ${stationA.id}, Station B: ${stationB.id}`);

    // 3. Create Compartment
    console.log('Creating Compartment...');
    // Check if exists first to avoid duplicates if re-running
    const compsRes = await axios.get(`${BASE_URL}/compartments`, axiosConfig);
    let compartment = compsRes.data.data.find(c => c.name === 'AC Class');
    
    if (!compartment) {
        const compRes = await axios.post(`${BASE_URL}/compartments`, {
        name: 'AC Class',
        type: 'AC_CHAIR',
        price: 500,
        totalSeat: 60
        }, axiosConfig);
        compartment = compRes.data.data;
        console.log(`Created Compartment: ${compartment.id}`);
    } else {
        console.log(`Compartment already exists: ${compartment.id}`);
    }

    // 4. Create Route
    console.log('Creating Route...');
    const routePayload = {
      name: 'Route A-B',
      totalDistance: 100,
      startStationId: stationA.id,
      endStationId: stationB.id,
      stations: [
        {
          currentStationId: stationA.id,
          distance: 0.1,
          distanceFromStart: 0,
          // nextStationId: stationB.id, // Try omitting if nulls are issues, but this one is not null
          nextStationId: stationB.id,
          // beforeStationId: null // Omit
        },
        {
          currentStationId: stationB.id,
          distance: 100,
          distanceFromStart: 100,
          // nextStationId: null, // Omit
          beforeStationId: stationA.id
        }
      ]
    };
    
    let route;
    try {
        const routeRes = await axios.post(`${BASE_URL}/train-routes`, routePayload, axiosConfig);
        route = routeRes.data.data;
        console.log(`Created Route: ${route.id}`);
    } catch (e) {
        console.error('Route Creation Failed:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
        // Try to find if it exists
        const routesRes = await axios.get(`${BASE_URL}/train-routes`, axiosConfig);
        route = routesRes.data.data.find(r => r.name === 'Route A-B');
        if (route) console.log(`Found existing route: ${route.id}`);
        else throw e;
    }

    // 5. Create Train
    if (route) {
        console.log('Creating Train...');
        const trainPayload = {
        name: 'Test Express',
        number: '101',
        type: 'EXPRESS',
        trainRouteId: route.id,
        compartmentIds: [compartment.id]
        };
        const trainRes = await axios.post(`${BASE_URL}/trains`, trainPayload, axiosConfig);
        const train = trainRes.data.data;
        console.log(`Created Train: ${train.id}`);
    }

    console.log('Setup Complete!');

  } catch (error) {
    console.error('Error Status:', error.response ? error.response.status : 'Unknown');
    console.error('Error Data:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

main();
