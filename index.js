const express = require('express');
require('dotenv').config();
const cookies = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const app = express();

const dbo = require('./conn');

app.use(cookies());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
}

app.set('view engine', 'ejs');

const port = process.env.SERVER_PORT || 5000;
app.listen(port, () => {
  dbo.connectToServer();
  console.log(`URL shortener server listening on port ${port}`);
});

// API routes
app.use(require('./routes/urls'));
app.use(require('./routes/users'));

// react frontend
app.use(express.static(path.join(__dirname, '..', 'build')));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
})