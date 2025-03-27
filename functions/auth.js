const Pusher = require("pusher");
const querystring = require("querystring");

// Initialisér Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "eu",
});

// CORS headers
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async function (event, context) {
  // Håndter CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: headers,
      body: "",
    };
  }

  // Sørg for at det er en POST-anmodning
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Analyse af indkommende data - håndter både JSON og form-encoded
    let socketId, channel;

    // Check Content-Type header to determine parsing strategy
    const contentType = event.headers["content-type"] || "";

    if (contentType.includes("application/json")) {
      // Parse JSON body
      const body = JSON.parse(event.body);
      socketId = body.socket_id;
      channel = body.channel_name;
    } else {
      // Parse form-encoded body
      const formData = querystring.parse(event.body);
      socketId = formData.socket_id;
      channel = formData.channel_name;
    }

    console.log("Request parsed:", { socketId, channel });

    if (!socketId || !channel) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ error: "socket_id and channel_name required" }),
      };
    }

    let auth;
    if (channel.startsWith("presence-")) {
      const userData = {
        user_id: "display-" + Date.now(),
        user_info: {
          type: "display",
        },
      };
      auth = pusher.authenticate(socketId, channel, userData);
    } else {
      auth = pusher.authenticate(socketId, channel);
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(auth),
    };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
