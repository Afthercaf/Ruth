require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

module.exports = {
    port: process.env.PORT || 80
};