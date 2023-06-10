const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const { Client,LocalAuth,MessageMedia } = require('whatsapp-web.js');

// membuat client baru
const client = new Client({
    authStrategy:new LocalAuth,
    puppeteer:{headless:true},
});

// prosess masuk whatsappjs menggunakan qrcode yang akan dikirim oleh whatsapp-web.js
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr)
});

//Proses dimana whatsapp.js siap digunakan
client.on('ready', () => {
    console.log('Client is ready!');
});

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