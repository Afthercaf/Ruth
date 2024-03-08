const express = require('express');
const cors = require('cors');
const productsRoutes = require('./routes/productoroutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Utiliza el middleware de cors
app.use(cors());

app.use(productsRoutes);

module.exports = app;
