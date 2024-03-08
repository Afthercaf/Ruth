const config = require('./config');
const app = require('./app');

const port = config.port || 3000; // Si el puerto no está configurado, se usa el puerto 3000 por defecto

app.listen(port, () => {
    console.log("Server running on port", port);
});