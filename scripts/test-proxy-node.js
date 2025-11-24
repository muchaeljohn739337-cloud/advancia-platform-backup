const { getProxyClient } = require("./backend/dist/utils/proxyClient");

async function test() {
  try {
    const client = getProxyClient();
    console.log("Testing proxy client...");

    const isConnected = await client.testConnection();
    if (isConnected) {
      const ip = await client.getPublicIP();
      console.log("✅ Proxy client working. IP:", ip);

      const geo = await client.getGeolocation();
      console.log("✅ Location:", geo.city + ", " + geo.country_name);
    } else {
      console.log("❌ Proxy client connection failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

test();
