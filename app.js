const { Client,LocalAuth,MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express')
const socketIO = require('socket.io');
const http = require('http');
// const puppeteer = require('puppeteer');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// lib.Request
app.use(express.json());
app.use(express.urlencoded({extended:true}));


// membuat client baru
const client = new Client({
    authStrategy:new LocalAuth,
    puppeteer:{headless:true},
});

app.get('/',(req,res)=>{
    res.sendFile('index.html',{root:__dirname})
});

// prosess masuk whatsappjs menggunakan qrcode yang akan dikirim oleh whatsapp-web.js


//Proses dimana whatsapp.js siap digunakan


// proses algoritma bot
client.on('message', async message => {
    if (message.body == '!halo') {
        message.reply('ada yang bisa saya bantu?');
    }
});

client.on('message', async message => {
    if (message.body == 'otp') {
        message.reply('kirim otp!');
    }
});

//proses dimana client disconect dari whatsapp-web
client.on('disconnected', (reason) => {
    console.log('disconnectd whatsapp-bot',reason);
});

client.initialize();

// socket.io
io.on('connection', function(socket){
    socket.emit('message', 'Connecting API...')

    client.on('qr', (qr) => {
        console.log('QRCode RECIVED',qr);
        qrcode.toDataURL(qr,(err,url)=>{
            socket.emit('qr',url);
            socket.emit('message','QR Code revived, Scan please!');
        })
    });

    client.on('ready', () => {
         socket.emit('ready','Whatsapp is Ready!')
         socket.emit('message','Whatsapp is Ready!')
    });
});

// Send Message
app.post('/send-message', [
    // body('number').notEmpty(),
    // body('message').notEmpty(),
], (req,res)=>{
    // const errors = validationResult(req).formatWith(({msg})=>{
    //     return msg;
    // });

    // if (!errors.isEmpty) {
    //     return res.status(422).json({
    //         status:false,
    //         message:errors.mapped(),
    //     });
    // }

    const number = req.body.number;
    const message = req.body.message;

    client.sendMessage(number,message)
        .then(response=>{
            res.status(200).json({
                status:true,
                response:response,
            })
        })
        .catch(err=>{
             res.status(500).json({
                status:false,
                response:err,
            })
        });
});

// Send Media
app.post('/send-media', (req,res)=>{
    const number = req.body.number;
    const caption = req.body.caption;
    const media = MessageMedia.fromFilePath('./image/test.jpg');

    client.sendMessage(number,media,{caption:caption})
        .then(response=>{
            res.status(200).json({
                status:true,
                response:response,
            })
        })
        .catch(err=>{
             res.status(500).json({
                status:false,
                response:err,
            })
        });
});

server.listen(8000, function(){
    console.log('App running on *: '+ 8000);
});