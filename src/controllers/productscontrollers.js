const { getConnection, sql } = require("../database/connection"); // Importa la conexión a la base de datos

// Obtener todos los productos
const getProducts = async (req, res) => {
  const { id } = req.params;

  try {
      const pool = await getConnection();
      const result = await pool.request()
          .input('ProductoID', sql.Int, id)
          .query('SELECT * FROM Productos WHERE ProductoID = @ProductoID');

      if (result.recordset.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.status(200).json(result.recordset[0]);
  } catch (error) {
      res.status(500).json({ error: 'Error al obtener el producto', message: error.message });
  }
};

// Obtener la vista de pedidos de clientes
const getClientOrdersView = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query("SELECT * FROM [VistaUsuarioPedidos];");
    res.json(result.recordset);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al obtener la vista de pedidos de clientes",
        message: error.message,
      });
  }
};

// Auditoría de cambios en productos
const getAuditLogs = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM [Auditoria];");
    res.json(result.recordset);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al obtener los registros de auditoría",
        message: error.message,
      });
  }
};
const getUserInfo = async (req, res) => {
  const userId = req.query.userId; // Assume user ID is passed as a query parameter
  try {
      const pool = await getConnection();
      const result = await pool.request()
          .input('UsuarioID', sql.Int, userId)
          .query('SELECT * FROM Usuarios WHERE UsuarioID = @UsuarioID');
      if (result.recordset.length === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.status(200).json(result.recordset[0]);
  } catch (error) {
      res.status(500).json({ error: 'Error al obtener la información del usuario', message: error.message });
  }
};

// El module.exports se usa para exportar los métodos a las rutas o llamadas directas
module.exports = {
  getProducts,
  getClientOrdersView,
  getAuditLogs,
  getUserInfo
};
