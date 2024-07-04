const { Router } = require('express');
const {  getClientOrdersView, getAuditLogs,getUserInfo } = require('../controllers/productscontrollers');
const { login, register,getUsers, deleteUser } = require('../controllers/iniciodesecion');
const { createProduct, getProducts, updateProduct, deleteProduct} = require('../controllers/ProductosPostGet');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { createOrder } = require('../controllers/creaorder');
const router = Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'C:/xampp/htdocs/img');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage });

// Rutas para productos
router.post('/createProduct', upload.single('imagen'), createProduct);
router.get('/getproducts', getProducts);
router.put('/upproducts', updateProduct);
router.delete('/delproducts', deleteProduct);
router.get('/getONEusers', getUserInfo);

router.post("/registro", register); // Crear un nuevo Usuario
router.get('/getusers', getUsers);
router.delete('/delusers', deleteUser);


router.post('/orden', authenticateToken, createOrder);
router.get('/api/vista-clientes-pedidos', authenticateToken, getClientOrdersView); // Ruta para obtener la vista de pedidos de clientes (protegida)
router.get('/api/auditoria', getAuditLogs); // Obtener los registros de auditoría (solo para administradores)

module.exports = router;
