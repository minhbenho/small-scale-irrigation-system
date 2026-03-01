import http from "http";

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("🧪 Starting API Tests...\n");

  try {
    // Test 1: Health Check
    console.log("1️⃣  Testing Health Endpoint...");
    let res = await makeRequest("GET", "/health");
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${JSON.stringify(res.body)}\n`);

    // Test 2: Register User
    console.log("2️⃣  Testing User Registration...");
    res = await makeRequest("POST", "/api/auth/register", {
      email: "testuser@example.com",
      password: "password123",
      name: "Test User",
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${JSON.stringify(res.body, null, 2)}`);
    const userId = res.body.user?.id;
    console.log(`   User ID: ${userId}\n`);

    // Test 3: Check if user exists in database
    console.log("3️⃣  Checking Database (Users List)...");
    // We'll simulate this by attempting to login
    res = await makeRequest("POST", "/api/auth/login", {
      email: "testuser@example.com",
      password: "password123",
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response Email: ${res.body.user?.email}`);
    console.log(`   Token Generated: ${res.body.accessToken ? "✅ Yes" : "❌ No"}\n`);
    const token = res.body.accessToken;

    // Test 4: Add a Device
    console.log("4️⃣  Testing Add Device...");
    res = await makeRequest(
      "POST",
      "/api/devices",
      {
        deviceCode: "device-001",
        displayName: "My First Device",
        deviceSecret: "secret12345",
      },
      {
        Authorization: `Bearer ${token}`,
      }
    );
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${JSON.stringify(res.body, null, 2)}`);
    const deviceId = res.body.id;
    console.log(`   Device ID: ${deviceId}\n`);

    // Test 5: List Devices
    console.log("5️⃣  Testing List Devices...");
    res = await makeRequest("GET", "/api/devices", null, {
      Authorization: `Bearer ${token}`,
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Devices Count: ${res.body?.length || 0}`);
    if (res.body && res.body.length > 0) {
      console.log(`   First Device: ${JSON.stringify(res.body[0], null, 2)}\n`);
    }

    // Test 6: Try to register duplicate user
    console.log("6️⃣  Testing Duplicate Registration...");
    res = await makeRequest("POST", "/api/auth/register", {
      email: "testuser@example.com",
      password: "password123",
      name: "Another User",
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Should Fail: ${res.status === 400 ? "✅ Yes" : "❌ No"}`);
    console.log(`   Error: ${res.body?.message}\n`);

    console.log("✅ All Tests Completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test Error:", error.message);
    process.exit(1);
  }
}

// Wait a bit for server to start
setTimeout(runTests, 2000);
