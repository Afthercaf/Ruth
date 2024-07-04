const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { auth, requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
const { login, register,getUsers, deleteUser } = require('./controllers/iniciodesecion'); // Ajusta la ruta según la ubicación de tu archivo

dotenv.config();

const app = express();

// Configuración del middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Configuración de la sesión
app.use(session({
  secret: process.env.ACCESS_TOKEN_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Configuración de Auth0
app.use(auth({
  authRequired: false,
  auth0Logout: true,
  baseURL: 'https://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  secret: process.env.AUTH0_CLIENT_SECRET
}));

// Rutas
app.get('/admin', requiresAuth(), (req, res) => {
  res.sendFile(path.join(__dirname, 'htdocs', 'admin', 'index.html'));
});

app.get('/user', requiresAuth(), (req, res) => {
  res.sendFile(path.join(__dirname, 'htdocs', 'user', 'index.html'));
});

app.get('/callback', (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.oidc.logout({ returnTo: 'https://localhost/index.html' });
});

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

app.post('/login', login); // Integrar la ruta de login

// Otras rutas y configuraciones
app.use(require('./routes/productoroutes'));

module.exports = app;
