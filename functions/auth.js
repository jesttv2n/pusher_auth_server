const Pusher = require("pusher");
const cors = require("cors")({
  origin: "*",
  credentials: true,
  methods: ["POST", "OPTIONS"],
});

// Initialisér Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "eu",
});

exports.handler = async function (event, context) {
  // Håndter CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Sørg for at det er en POST-anmodning
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const socketId = body.socket_id;
    const channel = body.channel_name;

    if (!socketId || !channel) {
      return {
        statusCode: 400,
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
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(auth),
    };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
