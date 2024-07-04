-- Tabla de Productos
CREATE TABLE Productos (
    ProductoID INT PRIMARY KEY IDENTITY,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(255),
    Precio DECIMAL(10, 2) NOT NULL,
    Existencia INT NOT NULL,
    ImagenUrl NVARCHAR(255)
);

-- Tabla de Usuarios
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY,
    Nombre NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Cel NVARCHAR(15),
    Contraseña NVARCHAR(100) NOT NULL
);

-- Tabla de Pedidos
CREATE TABLE Pedidos (
    PedidoID INT PRIMARY KEY IDENTITY,
    UsuarioID INT NOT NULL,
    FechaPedido DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Tabla de Detalles de Pedido
CREATE TABLE DetallesPedido (
    DetalleID INT PRIMARY KEY IDENTITY,
    PedidoID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL,
    Precio DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (PedidoID) REFERENCES Pedidos(PedidoID),
    FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

-- Tabla de Auditoría
CREATE TABLE Auditoria (
    AuditoriaID INT PRIMARY KEY IDENTITY,
    Tabla NVARCHAR(100) NOT NULL,
    Operacion NVARCHAR(100) NOT NULL,
    FechaOperacion DATETIME NOT NULL DEFAULT GETDATE(),
    DatosPrevios NVARCHAR(MAX),
    DatosNuevos NVARCHAR(MAX)
);

-- Tabla de Administrador
CREATE TABLE Administrador (
    AdmnID INT PRIMARY KEY IDENTITY,
    Nombre NVARCHAR(100) NOT NULL,
    Contraseña NVARCHAR(100) NOT NULL
);

-- Procedimientos almacenados
CREATE PROCEDURE CrearUsuario
    @Nombre NVARCHAR(100),
    @Email NVARCHAR(100),
    @Cel NVARCHAR(15),
    @Contraseña NVARCHAR(100)
AS
BEGIN
    IF EXISTS (SELECT 1 FROM Usuarios WHERE Email = @Email)
    BEGIN
        RAISERROR ('El email ya está registrado.', 16, 1);
        RETURN;
    END

    INSERT INTO Usuarios (Nombre, Email, Cel, Contraseña)
    VALUES (@Nombre, @Email, @Cel, @Contraseña);
END

CREATE PROCEDURE ValidarUsuario
    @Email NVARCHAR(100),
    @Contraseña NVARCHAR(100)
AS
BEGIN
    SELECT UsuarioID, Nombre, Email
    FROM Usuarios
    WHERE Email = @Email AND Contraseña = @Contraseña;
END

CREATE PROCEDURE ValidarAdministrador
    @Nombre NVARCHAR(100),
    @Contraseña NVARCHAR(100)
AS
BEGIN
    SELECT AdmnID, Nombre
    FROM Administrador
    WHERE Nombre = @Nombre AND Contraseña = @Contraseña;
END

-- Insertar administrador por defecto
INSERT INTO Administrador (Nombre, Contraseña)
VALUES ('admin', 'superadmin');

-- Creación de índices
CREATE INDEX idx_Productos_NombreProducto ON Productos(Nombre);
CREATE INDEX idx_Usuarios_Email ON Usuarios(Email);
CREATE INDEX idx_Pedidos_FechaPedido ON Pedidos(FechaPedido);

-- Creación de vistas
CREATE VIEW VistaUsuarioPedidos AS
SELECT u.Nombre AS NombreUsuario, p.PedidoID, p.FechaPedido, dp.ProductoID, dp.Cantidad, dp.Precio
FROM Usuarios u
JOIN Pedidos p ON u.UsuarioID = p.UsuarioID
JOIN DetallesPedido dp ON p.PedidoID = dp.PedidoID;

-- Creación de procedimientos almacenados con transacciones
CREATE PROCEDURE RegistrarPedido (
    @UsuarioID INT,
    @ProductoID INT,
    @Cantidad INT
)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar disponibilidad de productos y actualizar inventario
        UPDATE Productos SET Existencia = Existencia - @Cantidad WHERE ProductoID = @ProductoID;

        -- Registrar pedido y detalles
        INSERT INTO Pedidos (UsuarioID, FechaPedido) VALUES (@UsuarioID, GETDATE());
        DECLARE @PedidoID INT = SCOPE_IDENTITY();
        INSERT INTO DetallesPedido (PedidoID, ProductoID, Cantidad, Precio)
        VALUES (@PedidoID, @ProductoID, @Cantidad, (SELECT Precio FROM Productos WHERE ProductoID = @ProductoID));

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        -- Manejo de errores, registro en la tabla de Auditoria, etc.
    END CATCH
END;

-- Creación de disparadores para auditoría
CREATE TRIGGER DisparadorAuditoriaProducto
ON Productos
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    DECLARE @Tabla NVARCHAR(100) = 'Productos';
    DECLARE @Operacion NVARCHAR(50);
    DECLARE @DatosPrevios NVARCHAR(MAX) = NULL;
    DECLARE @DatosNuevos NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted)
    BEGIN
        IF EXISTS (SELECT * FROM deleted)
        BEGIN
            SET @Operacion = 'UPDATE';
            SELECT @DatosPrevios = (SELECT * FROM deleted FOR JSON PATH);
            SELECT @DatosNuevos = (SELECT * FROM inserted FOR JSON PATH);
        END
        ELSE
        BEGIN
            SET @Operacion = 'INSERT';
            SELECT @DatosNuevos = (SELECT * FROM inserted FOR JSON PATH);
        END
    END
    ELSE
    BEGIN
        SET @Operacion = 'DELETE';
        SELECT @DatosPrevios = (SELECT * FROM deleted FOR JSON PATH);
    END

    INSERT INTO Auditoria (Tabla, Operacion, FechaOperacion, DatosPrevios, DatosNuevos)
    VALUES (@Tabla, @Operacion, GETDATE(), @DatosPrevios, @DatosNuevos);
END;
