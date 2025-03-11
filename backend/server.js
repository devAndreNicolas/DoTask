const express = require("express")
const cors = require("cors")
const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Initialize SQLite database
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error opening database", err)
  } else {
    console.log("Connected to SQLite database")
    createTables()
  }
})

// Create database tables if they don't exist
function createTables() {
  db.serialize(() => {
    // Users table
    db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

    // Tasks table
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

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden" })
    }

    req.user = user
    next()
  })
}

// Modifique a linha que serve arquivos estáticos para usar o caminho correto
// Verifique se o caminho está correto para a sua estrutura de pastas
app.use(express.static(path.join(__dirname, "../frontend")))

// Routes

// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // Check if email already exists
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" })
      }

      if (user) {
        return res.status(400).json({ error: "Email already in use" })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Insert new user
      db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to create user" })
        }

        res.status(201).json({ message: "User created successfully" })
      })
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user by email
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" })
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "24h" })

      res.json({ token })
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/api/auth/validate", authenticateToken, (req, res) => {
  res.json({ valid: true, user: { id: req.user.id, name: req.user.name, email: req.user.email } })
})

// Task routes
app.get("/api/tasks", authenticateToken, (req, res) => {
  db.all("SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC", [req.user.id], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch tasks" })
    }

    res.json(tasks)
  })
})

app.post("/api/tasks", authenticateToken, (req, res) => {
  try {
    const { title, description, category, dueDate } = req.body

    // Validate input
    if (!title || !category) {
      return res.status(400).json({ error: "Title and category are required" })
    }

    // Insert new task
    db.run(
      "INSERT INTO tasks (user_id, title, description, category, due_date) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, title, description, category, dueDate],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Failed to create task" })
        }

        // Get the created task
        db.get("SELECT * FROM tasks WHERE id = ?", [this.lastID], (err, task) => {
          if (err) {
            return res.status(500).json({ error: "Failed to fetch created task" })
          }

          res.status(201).json(task)
        })
      },
    )
  } catch (error) {
    console.error("Create task error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/api/tasks/:id", authenticateToken, (req, res) => {
  db.get("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch task" })
    }

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json(task)
  })
})

app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  try {
    const { title, description, category, dueDate, completed } = req.body

    // Validate input
    if (!title || !category) {
      return res.status(400).json({ error: "Title and category are required" })
    }

    // Check if task exists and belongs to user
    db.get("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err, task) => {
      if (err) {
        return res.status(500).json({ error: "Database error" })
      }

      if (!task) {
        return res.status(404).json({ error: "Task not found" })
      }

      // Update task
      db.run(
        "UPDATE tasks SET title = ?, description = ?, category = ?, due_date = ?, completed = ? WHERE id = ?",
        [title, description, category, dueDate, completed !== undefined ? completed : task.completed, req.params.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to update task" })
          }

          // Get the updated task
          db.get("SELECT * FROM tasks WHERE id = ?", [req.params.id], (err, updatedTask) => {
            if (err) {
              return res.status(500).json({ error: "Failed to fetch updated task" })
            }

            res.json(updatedTask)
          })
        },
      )
    })
  } catch (error) {
    console.error("Update task error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  // Check if task exists and belongs to user
  db.get("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    // Delete task
    db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to delete task" })
      }

      res.json({ message: "Task deleted successfully" })
    })
  })
})

// Modifique também a rota catch-all
app.get("*", (req, res) => {
  // Verifique se o arquivo existe antes de tentar servi-lo
  const indexPath = path.join(__dirname, "../frontend/index.html")

  // Verificar se o arquivo existe
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    // Mostrar um erro mais descritivo
    res.status(404).send(`Arquivo não encontrado: ${indexPath}. 
    Verifique se a estrutura de pastas está correta.`)
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Access the application at http://localhost:${PORT}`)
})