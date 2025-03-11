require("dotenv").config() // Carregar variáveis do .env

const express = require("express")
const cors = require("cors")
const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error("Erro: A variável JWT_SECRET não está definida no .env!")
  process.exit(1) // Finaliza a execução se a chave não estiver configurada
}

// Middleware
app.use(cors())
app.use(express.json())

// Inicializar banco de dados SQLite
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Erro ao abrir o banco de dados", err)
  } else {
    console.log("Conectado ao banco de dados SQLite")
    createTables()
  }
})

// Criar tabelas se não existirem
function createTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          due_date DATETIME,
          completed BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `)
  })
}

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Não autorizado" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" })
    }

    req.user = user
    next()
  })
}

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "../frontend")))

// Rotas de autenticação
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" })
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) return res.status(500).json({ error: "Erro no banco de dados" })

      if (user) return res.status(400).json({ error: "E-mail já cadastrado" })

      const hashedPassword = await bcrypt.hash(password, 10)

      db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao criar usuário" })

        res.status(201).json({ message: "Usuário criado com sucesso" })
      })
    })
  } catch (error) {
    console.error("Erro no registro:", error)
    res.status(500).json({ error: "Erro no servidor" })
  }
})

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios" })
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados" })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas" })
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "24h" })
    res.json({ token })
  })
})

app.get("/api/auth/validate", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user })
})

// Rotas de tarefas
app.get("/api/tasks", authenticateToken, (req, res) => {
  db.all("SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC", [req.user.id], (err, tasks) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar tarefas" })
    res.json(tasks)
  })
})

app.post("/api/tasks", authenticateToken, (req, res) => {
  const { title, description, category, dueDate } = req.body

  if (!title || !category) {
    return res.status(400).json({ error: "Título e categoria são obrigatórios" })
  }

  db.run(
    "INSERT INTO tasks (user_id, title, description, category, due_date) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, title, description, category, dueDate],
    function (err) {
      if (err) return res.status(500).json({ error: "Erro ao criar tarefa" })

      db.get("SELECT * FROM tasks WHERE id = ?", [this.lastID], (err, task) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar tarefa criada" })
        res.status(201).json(task)
      })
    },
  )
})

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  db.get("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err, task) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados" })
    if (!task) return res.status(404).json({ error: "Tarefa não encontrada" })

    db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: "Erro ao deletar tarefa" })
      res.json({ message: "Tarefa deletada com sucesso" })
    })
  })
})

// Servir frontend (rota catch-all)
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "../frontend/index.html")

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send("Página não encontrada. Verifique a estrutura do projeto.")
  }
})

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Acesse a aplicação em http://localhost:${PORT}`)
})