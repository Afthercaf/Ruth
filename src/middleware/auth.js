const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../database/connection');

const authenticateToken = async (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const pool = await getConnection();
        const result = await pool.request()
            .input('UsuarioID', sql.Int, decoded.id)
            .query('SELECT * FROM Usuarios WHERE UsuarioID = @UsuarioID');

        if (result.recordset.length === 0) {
            return res.status(403).json({ error: 'Usuario no autorizado' });
        }

        req.user = result.recordset[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token no válido' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso restringido a administradores' });
    }
};

module.exports = { authenticateToken, authorizeAdmin };
