const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcrypt")

// Conectar ao banco de dados
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Erro ao abrir o banco de dados", err)
    process.exit(1)
  }
  console.log("Conectado ao banco de dados SQLite")
})

// Dados do usuário
const name = "Admin"
const email = "admin@exemplo.com"
const password = "admin123" // Senha em texto puro

// Criar tabela de usuários se não existir
db.run(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`,
  async (err) => {
    if (err) {
      console.error("Erro ao criar tabela:", err)
      db.close()
      process.exit(1)
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Verificar se o usuário já existe
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) {
        console.error("Erro ao verificar usuário:", err)
        db.close()
        process.exit(1)
      }

      if (user) {
        console.log("Usuário já existe!")
        db.close()
        process.exit(0)
      }

      // Inserir novo usuário
      db.run(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        function (err) {
          if (err) {
            console.error("Erro ao criar usuário:", err)
          } else {
            console.log("Usuário criado com sucesso!")
            console.log("ID:", this.lastID)
            console.log("Email:", email)
            console.log("Senha (texto puro):", password)
          }

          db.close()
        },
      )
    })
  },
)