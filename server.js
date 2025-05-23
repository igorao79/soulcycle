import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS настройки для production
const allowedOrigins = [
  'https://igorao79.github.io',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Продвинутая настройка CORS
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, origin); // Return the actual origin instead of true
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // Preflight results can be cached for 24 hours
}));

// Разбор JSON в запросах
app.use(express.json());

// Enable pre-flight requests for all routes
app.options('*', cors());

// Additional headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigins);
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}); 