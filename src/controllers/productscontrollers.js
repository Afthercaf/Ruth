const { getConnection, sql } = require('../database/connection');


// Obtener todos los productos
const getProducts = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM [Products-Mache]");  
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener productos", message: error.message });
    }
};

// Crear un nuevo producto
    const createProduct = async (req, res) => {
        const { Name_producto, Precio, Existencia = 0, ID_Maquina } = req.body;
    
        if (!Name_producto || Existencia == null) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }
    
        try {
            const pool = await getConnection();
            const tableName = "[Products-Mache]";
    
            const result = await pool
                .request()
                .input("Name_producto", sql.VarChar, Name_producto)
                .input("Precio", sql.Decimal, Precio)
                .input("Existencia", sql.Int, Existencia)
                .input("ID_Maquina", sql.Int, ID_Maquina)
                .query(
                    `INSERT INTO [Products-Mache] (Name_producto, Precio, Existencia,ID_Maquina ) VALUES (@Name_producto, @Precio, @Existencia, @ID_Maquina);`
                );
                    console.log(result);
                    res.json(  Name_producto,Precio, Existencia);
            //res.status(201).json({
                //id: result.recordset[0].id,
                //Name_producto,
                //Precio,
                //Existencia
           // });
        } catch (error) {
            res.status(500).json({ error: "Error al crear el producto", message: error.message });
        }
    };

// Eliminar un producto por su ID
const deleteProduct = async (req, res) => {
  const { ID } = req.body;

  // Validar si ID es un número válido
  if (isNaN(ID)) {
    return res.status(400).json({ error: "ID de producto inválido" });
  }

  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("ID", sql.Int, ID)
      .query("DELETE FROM [Products-Mache] WHERE ID = @ID");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el producto", message: error.message });
  }
};
// Actualizar un producto por su ID
const updateProduct = async (req, res) => {
    const { ID } = req.body;
    const { Name_producto, Precio, Existencia } = req.body;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("Name_producto", sql.VarChar, Name_producto)
            .input("Precio", sql.Decimal, Precio)
            .input("Existencia", sql.Int, Existencia)
            .input("id", sql.Int, ID)
            .query(
                "UPDATE [Products-Mache] SET Name_producto = @Name_producto, Precio = @Precio, Existencia = @Existencia WHERE id = @id"
            );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el producto", message: error.message });
    }
};

const getProductsWithMachines = async (req, res) => {
    try {
      const pool = await getConnection();
  
      // Une las tablas usando un LEFT JOIN para incluir todos los productos, incluso si no tienen una máquina asociada
      const result = await pool.request()
        .query(`
        SELECT p.*, m.IDMAQUINAS AS machineId, m.Ubicacion AS location, e.Nombre AS estado
        FROM [Products-Mache] AS p
        LEFT JOIN Maquinas AS m ON p.ID_Maquina = m.IDMAQUINAS
        LEFT JOIN Estados AS e ON m.IDEstado = e.IDestados;
        `);
        console.log(result);
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener productos", message: error.message });
    }
  };
// Crear un nuevo producto
const createMachin = async (req, res) => {
  const { IDMAQUINAS, Ubicacion,  IDEstado= 0,  } = req.body;

  if (!Ubicacion == null) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
      const pool = await getConnection();
      const tableName = "[Products-Mache]";

      const result = await pool
          .request()
          .input("Ubicacion", sql.VarChar, Ubicacion)
          .query(
              `INSERT INTO [Maquinas] (Ubicacion) VALUES (@Ubicacion);`
          );
              console.log(result);
              res.json( Ubicacion);
      //res.status(201).json({
          //id: result.recordset[0].id,
          //Name_producto,
          //Precio,
          //Existencia
     // });
  } catch (error) {
      res.status(500).json({ error: "Error al crear el producto", message: error.message });
  }
};

const getlist = async (req, res) => {
    const { id_maquina } = req.query; // Obtén el ID de máquina desde la consulta

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("ID_Maquina", sql.Int, id_maquina) // Usa el ID de máquina para filtrar los productos
            .query("SELECT * FROM [Products-Mache] WHERE ID_Maquina = @ID_Maquina");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener productos", message: error.message });
    }
};
  




module.exports = { getProducts, createProduct, deleteProduct, updateProduct,getProductsWithMachines,createMachin,getlist };
