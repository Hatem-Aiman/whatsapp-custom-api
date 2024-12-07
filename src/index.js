import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import messageRoutes from './routes/messageRoutes.js';
import fs from 'fs';
import https from 'https';
const privateKey = fs.readFileSync('localhost-key.pem', 'utf8');
const certificate = fs.readFileSync('localhost.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};
const app = express();



app.use(cors());
app.use(bodyParser.json());

app.use('/whatsapp', messageRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443, () => {
  console.log('HTTPS Server running on port 8443');
});
