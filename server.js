const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Pusher = require("pusher");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Initialisér Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "eu",
});

// Authenticate endpoint
app.post("/pusher/auth", (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // For presence channels, kan du tilføje brugerdata
  if (channel.startsWith("presence-")) {
    const userData = {
      user_id: "display-" + Date.now(), // Genererer et unikt ID
      user_info: {
        type: "display",
      },
    };

    const auth = pusher.authenticate(socketId, channel, userData);
    res.send(auth);
  } else {
    // For private kanaler
    const auth = pusher.authenticate(socketId, channel);
    res.send(auth);
  }
});

// Simpel health check route
app.get("/", (req, res) => {
  res.send("Pusher Auth Server kører!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server kører på port ${PORT}`);
});
