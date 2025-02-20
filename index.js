const express = require("express");
const session = require("express-session");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(
    cors({
      origin: "http://localhost:4200", // Reemplázalo con la URL de tu frontend
      credentials: true, // Permite el envío de cookies de sesión
    })
  );

app.use(express.json());
app.use(
  session({
    secret: "secreto_super_seguro",
    resave: false,
    saveUninitialized: true,
  })
);

const DB_FILE = "db.json";


const cargarDatos = () => {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  return { productos: [], usuarios: [{ id: 1, usuario: "admin", contraseña: "admin", rol: "admin" }] };
};

const guardarDatos = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify({ productos, usuarios }, null, 2));
};

let { productos, usuarios } = cargarDatos();

const autenticar = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.rol === "admin") {
    next();
  } else {
    res.status(401).json({ mensaje: "No autorizado" });
  }
};

// Listar productos
app.get("/productos", (req, res) => {
  res.json(productos);
});

// Obtener un producto por ID
app.get("/productos/:id", (req, res) => {
  const producto = productos.find((p) => p.id === parseInt(req.params.id));
  producto ? res.json(producto) : res.status(404).json({ mensaje: "Producto no encontrado" });
});

// Añadir producto (requiere autenticación)
app.post("/productos", autenticar, (req, res) => {
  const nuevoProducto = { id: productos.length + 1, ...req.body };
  productos.push(nuevoProducto);
  guardarDatos();
  res.status(201).json(nuevoProducto);
});

// Modificar producto (requiere autenticación)
app.put("/productos/:id", autenticar, (req, res) => {
  let producto = productos.find((p) => p.id === parseInt(req.params.id));
  if (producto) {
    Object.assign(producto, req.body);
    guardarDatos();
    res.json(producto);
  } else {
    res.status(404).json({ mensaje: "Producto no encontrado" });
  }
});

// Modificar stock
app.patch("/productos/:id/stock", (req, res) => {
  let producto = productos.find((p) => p.id === parseInt(req.params.id));
  if (producto) {
    producto.stock = req.body.stock;
    guardarDatos();
    res.json(producto);
  } else {
    res.status(404).json({ mensaje: "Producto no encontrado" });
  }
});

// Borrar producto (requiere autenticación)
app.delete("/productos/:id", autenticar, (req, res) => {
  productos = productos.filter((p) => p.id !== parseInt(req.params.id));
  guardarDatos();
  res.json({ mensaje: "Producto eliminado" });
});

// Listar usuarios (requiere autenticación)
app.get("/usuarios", autenticar, (req, res) => {
  res.json(usuarios);
});

// Añadir usuario (requiere autenticación)
app.post("/usuarios", autenticar, (req, res) => {
  const nuevoUsuario = { id: usuarios.length + 1, ...req.body };
  usuarios.push(nuevoUsuario);
  guardarDatos();
  res.status(201).json(nuevoUsuario);
});

// Modificar usuario (requiere autenticación)
app.put("/usuarios/:id", autenticar, (req, res) => {
  let usuario = usuarios.find((u) => u.id === parseInt(req.params.id));
  if (usuario) {
    Object.assign(usuario, req.body);
    guardarDatos();
    res.json(usuario);
  } else {
    res.status(404).json({ mensaje: "Usuario no encontrado" });
  }
});

// Inicio de sesión
app.post("/login", (req, res) => {
  const { usuario, contraseña } = req.body;
  const user = usuarios.find((u) => u.usuario === usuario && u.contraseña === contraseña);
  if (user) {
    req.session.usuario = user;
    res.json({ mensaje: "Login exitoso" });
  } else {
    res.status(401).json({ mensaje: "Credenciales incorrectas" });
  }
});

// Cierre de sesión
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ mensaje: "Sesión cerrada" });
});

// Verificar sesión activa
app.get("/auth/status", (req, res) => {
    if (req.session.usuario) {
      res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
      res.json({ autenticado: false });
    }
  });

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
