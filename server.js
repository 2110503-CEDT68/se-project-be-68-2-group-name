//import { setServers } from "node:dns/promises";
const { setServers } = require("node:dns/promises");

setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const dotenv = require('dotenv');
const reservations = require('./routes/reservations');
const auth = require('./routes/auth');
const coworkingSpace = require('./routes/coworkingSpace');
const comments = require('./routes/comments');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const customEmojis = require('./routes/customEmojis');
const reactions = require('./routes/reactions');


// Load env vars
dotenv.config({ path: './config/config.env' });
connectDB();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.set('query parser', 'extended');

//Sanitize
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());

//Helmet
app.use(helmet());

//Prevent XSS
app.use(xss());

//Rate Limiting
const limiter=rateLimit({
    windowMs:10*60*1000,//10 mins
    max: 100
});
app.use(limiter);

//Prevent http param pollutions 
app.use(hpp());

//Enable CORS
app.use(cors());

app.use('/api/v1/coworkingspaces', coworkingSpace);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservations', reservations);
app.use('/api/v1/comments', comments);
app.use('/api/v1/custom-emojis', customEmojis);
app.use('/api/v1', reactions);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in ' + process.env.NODE_ENV + ' mode on port ' + PORT));

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});