const { sql, getConnection } = require('../database/connection');
const fs = require('fs');
const path = require('path');

// Función para generar el archivo HTML del producto
const generateProductHtml = (product) => {
    const precio = typeof product.precio === 'number' ? product.precio.toFixed(2) : product.precio;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Producto - ${product.nombre}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Detalle del Producto</h1>
    </header>
    <main>
        <div class="product-container">
            <div class="left-column">
                <div class="product-images">
                    <img src="${product.imageUrl}" alt="${product.nombre}" class="main-image">
                </div>
            </div>
            <div class="right-column">
                <div class="product-details">
                    <h2>${product.nombre}</h2>
                    <p>Color gris</p>
                    <p class="rating">4.7 <span>★ ★ ★ ★ ☆</span> (111 opiniones)</p>
                    <p class="price"><span class="original-price">$${precio}</span> <span class="discount"></span></p>
                    <p>IVA incluido</p>
                    <p class="shipping-info">Envío a todo el país</p>
                    <p class="stock-status">${product.existencia > 0 ? 'Stock disponible' : 'Sin stock'}</p>
                    <p class="availability">Cantidad: ${product.existencia} unidad${product.existencia > 1 ? 'es' : ''} disponibles</p>
                    <div class="button-container">
                        <button class="buy-now">Comprar ahora</button>
                        <button class="add-to-cart">Agregar al carrito</button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>
</html>`;

    const filePath = path.join('C:', 'xampp', 'htdocs', 'productos', `producto_${product.ProductoID}.html`);
    try {
        fs.writeFileSync(filePath, htmlContent, 'utf8');
        console.log(`Archivo HTML creado correctamente: ${filePath}`);
    } catch (error) {
        console.error('Error al escribir el archivo HTML:', error.message);
    }
};

// Función para crear un producto
const createProduct = async (req, res) => {
    const { nombre, descripcion, precio, existencia } = req.body;
    const imageUrl = req.file ? `../img/${req.file.filename}` : null;

    if (!nombre || !descripcion || !precio || !existencia) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const pool = await getConnection();

        const result = await pool.request()
            .input('Nombre', sql.NVarChar, nombre)
            .input('Descripcion', sql.NVarChar, descripcion)
            .input('Precio', sql.Decimal(10, 2), precio)
            .input('Existencia', sql.Int, existencia)
            .input('ImagenUrl', sql.NVarChar, imageUrl)
            .query('INSERT INTO Productos (Nombre, Descripcion, Precio, Existencia, ImagenUrl) VALUES (@Nombre, @Descripcion, @Precio, @Existencia, @ImagenUrl)');

        // Obtener el ProductoID del producto recién insertado
        const insertedProduct = await pool.request()
            .input('Nombre', sql.NVarChar, nombre)
            .query('SELECT ProductoID FROM Productos WHERE Nombre = @Nombre');

        if (insertedProduct.recordset && insertedProduct.recordset.length > 0) {
            const productId = insertedProduct.recordset[0].ProductoID; // Obtener el ID del producto insertado
            const product = { ProductoID: productId, nombre, descripcion, precio, existencia, imageUrl };

            generateProductHtml(product); // Generar HTML después de la inserción exitosa

            return res.status(201).json({ mensaje: 'Producto creado con éxito' });
        } else {
            throw new Error('No se pudo obtener el ID del producto insertado');
        }
    } catch (error) {
        console.error('Error al crear el producto:', error.message);
        return res.status(500).json({ error: 'Error al crear el producto', message: error.message });
    }
};

// Función para obtener todos los productos
const getProducts = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Productos');
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos', message: error.message });
    }
};

// Función para actualizar un producto
const updateProduct = async (req, res) => {
    const { ProductoID, Nombre, Precio, Descripcion, Existencia, ImagenUrl } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('ProductoID', sql.Int, ProductoID)
            .input('Nombre', sql.NVarChar, Nombre)
            .input('Precio', sql.Decimal(10, 2), Precio)
            .input('Descripcion', sql.NVarChar, Descripcion)
            .input('Existencia', sql.Int, Existencia)
            .input('ImagenUrl', sql.NVarChar, ImagenUrl)
            .query('UPDATE Productos SET Nombre = @Nombre, Precio = @Precio, Descripcion = @Descripcion, Existencia = @Existencia, ImagenUrl = @ImagenUrl WHERE ProductoID = @ProductoID');

        // Obtener la información actualizada del producto
        const updatedProductResult = await pool.request()
            .input('ProductoID', sql.Int, ProductoID)
            .query('SELECT * FROM Productos WHERE ProductoID = @ProductoID');

        const updatedProduct = updatedProductResult.recordset[0];

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Regenerar el archivo HTML con la información actualizada del producto
        const product = {
            ProductoID: updatedProduct.ProductoID,
            nombre: updatedProduct.Nombre,
            descripcion: updatedProduct.Descripcion,
            precio: updatedProduct.Precio,
            existencia: updatedProduct.Existencia,
            imageUrl: updatedProduct.ImagenUrl
        };

        generateProductHtml(product);

        res.status(200).json({ message: 'Producto actualizado exitosamente y página HTML regenerada' });
    } catch (error) {
        console.error('Error al actualizar el producto:', error.message);
        res.status(500).json({ error: 'Error al actualizar el producto', message: error.message });
    }
};

// Función para eliminar un producto
const deleteProduct = async (req, res) => {
    const { ProductoID } = req.body;

    try {
        const pool = await getConnection();
        
        // Obtener la información del producto antes de eliminarlo
        const productResult = await pool.request()
            .input('ProductoID', sql.Int, ProductoID)
            .query('SELECT * FROM Productos WHERE ProductoID = @ProductoID');
        
        const product = productResult.recordset[0];
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Eliminar el producto de la base de datos
        await pool.request()
            .input('ProductoID', sql.Int, ProductoID)
            .query('DELETE FROM Productos WHERE ProductoID = @ProductoID');
        
        // Ruta del archivo HTML
        const htmlFilePath = path.join('C:', 'xampp', 'htdocs', 'productos', `producto_${product.ProductoID}.html`);
        
        // Ruta de la imagen
        const imageFilePath = path.join('C:', 'xampp', 'htdocs', 'img', path.basename(product.ImagenUrl));

        // Eliminar el archivo HTML
        if (fs.existsSync(htmlFilePath)) {
            fs.unlinkSync(htmlFilePath);
            console.log(`Archivo HTML eliminado: ${htmlFilePath}`);
        } else {
            console.log(`Archivo HTML no encontrado: ${htmlFilePath}`);
        }

        // Eliminar la imagen
        if (fs.existsSync(imageFilePath)) {
            fs.unlinkSync(imageFilePath);
            console.log(`Imagen eliminada: ${imageFilePath}`);
        } else {
            console.log(`Imagen no encontrada: ${imageFilePath}`);
        }

        res.status(200).json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error.message);
        res.status(500).json({ error: 'Error al eliminar el producto', message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
};
