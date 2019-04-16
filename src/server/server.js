const PORT = 443,
      PORT_HTTP = 80,
      IP = '0.0.0.0';

const fs = require('fs'),
      https = require('https'),
      socketIO = require('socket.io'),
      http = require('http'),
      compression = require('compression'),
      path = require('path'),
      winston = require('winston'),
      rateLimit = require('express-rate-limit'),
      express = require('express'),
      app = express();

// Express settings //

app.use(compression());
app.use(express.json());
app.disable('x-powered-by');

//////////////////////////////////

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 700
}));

//////////////////////////////////

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

//////////////////////////////////

// SSL //

const privateKey  = fs.readFileSync('/etc/letsencrypt/live/talkmatcher.com/privkey.pem', 'utf8'),
      certificate = fs.readFileSync('/etc/letsencrypt/live/talkmatcher.com/fullchain.pem', 'utf8');

const credentials = {key: privateKey, cert: certificate};

//////////////////////////////////

app.use((req, res, next) => {
  if (!req.headers.host) {
    return next();
  }
  
  if (req.headers.host.slice(0, 4) === 'www.') {
    res.writeHead(301, { "Location": "https://" + req.headers.host.slice(4) + req.url });
    return res.end();
  }
  
  return next();
});

app.post('/api/logger', (req, res) => {
  logger.warn(req.body.message + '\n' +
              'Source: ' + req.body.source + '\n' +
              'Line no: ' + req.body.lineno + ', ' + 'Col no: ' + req.body.colno);
  return res.send('OK');
});


app.get('/sw.js', (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  return next();
});

app.use(express.static(path.join(__dirname, 'public')));

///////////////////////////

console.log('NODE_ENV mode: ' + process.env.NODE_ENV);

// HTTP/HTTPS INSTANCE //

// Redirect from http port 80 to https port 443
http
  .createServer((req, res) => {
      res.writeHead(301, { "Location": "https://" + req.headers.host + req.url });
      res.end();
  })
  .listen(PORT_HTTP);

const httpsServer = https
  .createServer(credentials, app)
  .listen(PORT, IP, () => {
    console.log('Server listening on ' + IP + ':' + PORT);
  });


/////////////////////////////////

// Sockets //

const io = socketIO(
  httpsServer,
  // Socket.io options https://socket.io/docs/server-api/
  {
    serveClient: false,
    pingTimeout: 5000, //ms
    pingInterval: 30000, //ms
    maxHttpBufferSize: 10e5, //bytes
    cookie: false
  }
);

require('./signaling-server')(io, logger);