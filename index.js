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


const loadData = () => {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  return {
    products: [
      { "id": 1, "name": "Smartphone Samsung Galaxy S23", "price": 799.99, "stock": 15 },
      { "id": 2, "name": "Laptop Dell XPS 15", "price": 1299.99, "stock": 10 },
      { "id": 3, "name": "Auriculares Sony WH-1000XM5", "price": 349.99, "stock": 20 },
      { "id": 4, "name": "Monitor LG UltraGear 27\"", "price": 499.99, "stock": 8 },
      { "id": 5, "name": "Teclado mecánico Logitech G Pro X", "price": 129.99, "stock": 30 },
      { "id": 6, "name": "Mouse inalámbrico Razer Basilisk X", "price": 69.99, "stock": 25 },
      { "id": 7, "name": "Tablet iPad Air 2022", "price": 599.99, "stock": 12 },
      { "id": 8, "name": "Smartwatch Apple Watch Series 9", "price": 429.99, "stock": 18 },
      { "id": 9, "name": "Cámara Sony Alpha A7 III", "price": 1999.99, "stock": 5 },
      { "id": 10, "name": "Consola PlayStation 5", "price": 499.99, "stock": 7 }
    ],
    users: [
      { id: 1, user: "admin", password: "admin", rol: "admin" },
      { id: 2, user: "manager", password: "manager", rol: "manager" },
      { id: 3, user: "seller", password: "seller", rol: "seller" }
    ]
  };
};

const saveData = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify({ products, users }, null, 2));
};

let { products, users } = loadData();

const authenticate = (authorizedRoles = ['admin']) => {
  
  return (req, res, next) => {
    if (req.session.user && authorizedRoles.includes(req.session.user.rol)) {
      next();
    } else {
      res.status(401).json({ mensaje: "No autorizado" });
    }
  };
} 

// Listar products
app.get("/products", (req, res) => {
  res.json(products);
});

// Obtener un product por ID
app.get("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  product ? res.json(product) : res.status(404).json({ mensaje: "Producto no encontrado" });
});

// Añadir product (requiere autenticación)
app.post("/products", authenticate(['admin', 'manager']), (req, res) => {
  const newProduct = { id: products.length + 1, ...req.body };
  products.push(newProduct);
  saveData();
  res.status(201).json(newProduct);
});

// Modificar product (requiere autenticación)
app.put("/products/:id", authenticate(['manager', 'admin']), (req, res) => {
  let product = products.find((p) => p.id === parseInt(req.params.id));
  if (product) {
    Object.assign(product, req.body);
    saveData();
    res.json(product);
  } else {
    res.status(404).json({ mensaje: "Producto no encontrado" });
  }
});

// Modificar stock
app.patch("/products/:id/stock", authenticate(['manager', 'seller', 'admin']), (req, res) => {
  let product = products.find((p) => p.id === parseInt(req.params.id));
  if (product) {
    product.stock = req.body.stock;
    saveData();
    res.json(product);
  } else {
    res.status(404).json({ mensaje: "Producto no encontrado" });
  }
});

// Borrar producto (requiere autenticación)
app.delete("/products/:id", authenticate(['manager', 'admin']), (req, res) => {
  products = products.filter((p) => p.id !== parseInt(req.params.id));
  saveData();
  res.json({ mensaje: "Producto eliminado" });
});

// Listar usuarios (requiere autenticación)
app.get("/users", authenticate(['admin']), (req, res) => {
  res.json(users);
});

// Añadir usuario (requiere autenticación)
app.post("/users", authenticate(['admin']), (req, res) => {
  const nuevoUsuario = { id: users.length + 1, ...req.body };
  users.push(nuevoUsuario);
  saveData();
  res.status(201).json(nuevoUsuario);
});

// Modificar usuario (requiere autenticación)
app.put("/users/:id", authenticate(['admin']), (req, res) => {
  let user = users.find((u) => u.id === parseInt(req.params.id));
  if (user) {
    Object.assign(user, req.body);
    saveData();
    res.json(user);
  } else {
    res.status(404).json({ mensaje: "Usuario no encontrado" });
  }
});

// Inicio de sesión
app.post("/login", (req, res) => {
  const { user, password } = req.body;
  const userDB = users.find((u) => u.user === user && u.password === password);
  if (userDB) {
    req.session.user = userDB;

    res.json({ mensaje: "Login exitoso", user: { user: userDB.user, rol: userDB.rol } });
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
  if (req.session.user) {
    res.json({ autenticado: true, user: req.session.user });
  } else {
    res.status(401).json({ autenticado: false });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
