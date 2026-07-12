const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://horizon-backend-production-4f7a.up.railway.app/api/auth/unified/login', {
      identifier: 'admin@horizonunitedfc.com',
      password: 'H0riz0n@dm1n2026!'
    });
    console.log(res.data);
  } catch (err) {
    console.log("Status:", err.response ? err.response.status : "No response");
    console.error(err.response ? err.response.data : err.message);
  }
}

test();
