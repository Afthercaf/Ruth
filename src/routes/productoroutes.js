const { Router } = require('express');
const { getProducts, createProduct, deleteProduct, updateProduct, getProductsWithMachines, createMachin, getlist } = require('../controllers/productscontrollers');

const router = Router();

// Define las rutas para tus controladores
router.get('/products', getProductsWithMachines);
router.post('/api/products/agregar', createProduct);
router.post('/products/crearmaquina', createMachin);
router.get('/products/lista', getlist);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id', updateProduct);

module.exports = router;

