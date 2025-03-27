const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Pusher = require("pusher");

const app = express();

// Middleware med mere specifik CORS-konfiguration
app.use(
  cors({
    // Tillad anmodninger fra alle oprindelser (du kan begrænse dette til specifikke domæner)
    origin: "*",
    // Tillad credentials (cookies, autorisation headers osv.)
    credentials: true,
    // Hvilke metoder der er tilladt
    methods: ["GET", "POST", "OPTIONS"],
    // Tillad disse headers i anmodninger
    allowedHeaders: ["Content-Type", "Authorization"],
    // Cache CORS-præflyvningsanmodninger i 86400 sekunder (1 dag)
    maxAge: 86400,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Initialisér Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "eu",
});

// Authenticate endpoint
app.options("/pusher/auth", cors());
app.post("/pusher/auth", (req, res) => {
  console.log("Auth anmodning modtaget:", {
    socketId: req.body.socket_id,
    channel: req.body.channel_name,
    headers: req.headers,
    body: req.body,
  });

  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  try {
    if (channel.startsWith("presence-")) {
      const userData = {
        user_id: "display-" + Date.now(),
        user_info: {
          type: "display",
        },
      };

      const auth = pusher.authenticate(socketId, channel, userData);
      console.log("Auth svar (presence):", auth);
      res.send(auth);
    } else {
      const auth = pusher.authenticate(socketId, channel);
      console.log("Auth svar (private):", auth);
      res.send(auth);
    }
  } catch (error) {
    console.error("Auth fejl:", error);
    res.status(500).send({ error: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).send("Server error: " + err.message);
});

// Sørg for at serveren lytter på alle interfaces
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server kører på port ${PORT}`);
});
