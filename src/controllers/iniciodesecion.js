const { getConnection, sql } = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();


const login = async (req, res) => {
  const { nombreOEmail, contraseña } = req.body;

  if (!nombreOEmail || !contraseña) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
      const pool = await getConnection();
      
      // Validar administrador
      let result = await pool.request()
          .input('Nombre', sql.NVarChar, nombreOEmail)
          .input('Contraseña', sql.NVarChar, contraseña)
          .query('EXEC ValidarAdministrador @Nombre, @Contraseña');
      
      if (result.recordset.length > 0) {
          const user = result.recordset[0];
          const token = jwt.sign({ id: user.ID, role: 'admin' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
          return res.status(200).json({ mensaje: `Bienvenido Administrador: ${user.Nombre}`, token, role: 'admin' });
      }

      // Validar usuario
      result = await pool.request()
          .input('Nombre', sql.NVarChar, nombreOEmail)
          .input('Contraseña', sql.NVarChar, contraseña)
          .query('EXEC ValidarUsuario @Nombre, @Contraseña');
      
          if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const token = jwt.sign({ id: user.ID, role: 'user' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ nombre: user.Nombre, token, role: 'user' });
        }
        

      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  } catch (error) {
      res.status(500).json({ error: 'Error en el servidor', message: error.message });
  }
};


const register = async (req, res) => {
  const { nombre, email, cel, contraseña } = req.body;

  if (!nombre || !email || !cel|| !contraseña) {
    return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('Nombre', sql.NVarChar(100), nombre)
      .input('Email', sql.NVarChar(100), email)
      .input('Cel', sql.NVarChar(15), cel)
      .input('Contraseña', sql.NVarChar(100), contraseña)
      .execute('CrearUsuario');

    res.status(201).send({ status: "ok", message: `Usuario ${nombre} registrado correctamente`, redirect: "/" });

  } catch (error) {
    if (error.number === 50000 && error.state === 1) {
      return res.status(400).send({ status: "Error", message: error.message });
    }
    console.error('Error durante el registro:', error.message);
    res.status(500).send({ status: "Error", message: "Error interno del servidor" });
  }
}

const getUsers = async (req, res) => {
  try {
      const pool = await getConnection();
      const result = await pool.request().query('SELECT * FROM Usuarios');
      res.status(200).json(result.recordset);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching users', message: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { UsuarioID } = req.body;
  try {
      const pool = await getConnection();
      await pool.request()
          .input('UsuarioID', sql.Int, UsuarioID)
          .query('DELETE FROM Usuarios WHERE UsuarioID = @UsuarioID');

      res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
      console.error('Error deleting user:', error.message);
      res.status(500).json({ error: 'Error deleting user', message: error.message });
  }
};

module.exports = {
  login,
  register,
  getUsers, deleteUser
};
