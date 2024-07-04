const { sql, getConnection } = require('../database/connection');

const createOrder = async (req, res) => {
    const { UsuarioID, productos } = req.body;  // Ensure UsuarioID is correctly extracted

    if (!UsuarioID || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'Faltan campos obligatorios o los productos son inválidos' });
    }

    try {
        const pool = await getConnection();
        const request = pool.request();

        // Begin transaction
        await request.query('BEGIN TRANSACTION');

        // Loop through productos and prepare parameters
        for (const producto of productos) {
            const { ProductoID, Existencia } = producto;

            await request.input('UsuarioID', sql.Int, UsuarioID);
            await request.input('ProductoID', sql.Int, ProductoID);
            await request.input('Cantidad', sql.Int, Existencia);

            // Execute stored procedure RegistrarPedido
            await request.execute('RegistrarPedido');
        }

        // Commit transaction
        await request.query('COMMIT TRANSACTION');

        res.status(201).json({ message: 'Pedido registrado exitosamente' });
    } catch (error) {
        // Rollback transaction on error
        await request.query('ROLLBACK TRANSACTION');
        console.error('Error al registrar el pedido:', error);
        res.status(500).json({ error: 'Error al registrar el pedido' });
    }
};

module.exports = {
    createOrder,
};
