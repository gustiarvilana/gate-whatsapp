const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const fileUpload = require("express-fileupload");
const axios = require("axios");
const router = require("router");

const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// lib.Request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    debug: true,
  })
);

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

// membuat client baru
const client = new Client({
  restartOnAuthFail: true,
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
});

// proses algoritma bot
client.on("message", async (message) => {
  if (message.body == "!halo") {
    message.reply("ada yang bisa saya bantu?");
  } else if (message.body == "otp") {
    message.reply("kirim otp!");
  } else if (message.body == "asd123") {
    const contact = await message.getContact();
    const name = contact.id.user;
    axios
      .post("http://192.168.1.77/e-lhp/api/laporan/test", {
        text: contact.pushname,
      })
      .then((response) => {
        console.log(response.data.data.text);
        message.reply(name);
      })
      .catch((err) => {
        message.reply("err");
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  } else {
    const contact = await message.getContact();
    const name = contact.pushname;
    const number = contact.number;
    axios
      .post("https://elhp.ramarmalia.com/api/laporan/test", {
        name: name,
        number: number,
        message: message.body,
      })
      .then((response) => {
        console.log(response.data.data.text);
        message.reply(name);
      })
      .catch((err) => {
        message.reply("err");
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
});

//proses dimana client disconect dari whatsapp-web
client.on("disconnected", (reason) => {
  console.log("disconnectd whatsapp-bot", reason);
});

client.initialize();

// socket.io
io.on("connection", function (socket) {
  socket.emit("message", "Connecting API...");

  client.on("qr", (qr) => {
    console.log("QRCode RECIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code revived, Scan please!");
    });
  });

  client.on("ready", () => {
    console.log("Ready!");
    socket.emit("ready", "Whatsapp is Ready!");
    socket.emit("message", "Whatsapp is Ready!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });
  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    client.destroy();
    client.initialize();
  });
});

// cek number wa
const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

// Send Message
app.post("/send-message", async (req, res) => {
  const number = req.body.number;
  const message = req.body.message;
  await client
    .sendMessage(number, message)
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

// Send Media
app.post("/send-media", async (req, res) => {
  const number = req.body.number;
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  // const media = MessageMedia.fromFilePath('./image-example.png');
  // const file = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
  let mimetype;
  const attachment = await axios
    .get(fileUrl, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      mimetype = response.headers["content-type"];
      return response.data.toString("base64");
    });

  const media = new MessageMedia(mimetype, attachment, "Media");

  await client
    .sendMessage(number, media, { caption: caption })
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

server.listen(port, function () {
  console.log("App running on *: " + port);
});
