import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import messageRoutes from './routes/messageRoutes.js';
import fs from 'fs';
import https from 'https';

const privateKey = fs.readFileSync('localhost-key.pem', 'utf8');
const certificate = fs.readFileSync('localhost.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const allowedOrigins = ['https://localhost:4100']
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    credentials: true,
}


const app = express();


app.use(cors());
app.use(bodyParser.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/whatsapp', messageRoutes);


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}


let httpsServer = https.createServer(credentials, app);


httpsServer.listen(8443, () => {
    console.log('HTTPS Server running on port 8443');
});
