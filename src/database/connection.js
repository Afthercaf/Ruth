const sql = require('mssql');

// Configuración de la base de datos
const dbSettings = {
  user: "resien",
  password: "12345678",
  server: "localhost",
  database: "TiendaONLINE",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function getConnection() {
  try {
    const pool = await sql.connect(dbSettings);
    return pool;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    throw error;
  }
}

module.exports = {
  getConnection: getConnection,
  sql: sql,
};