// auth.js - Handles user authentication

// API URL - Ensure this points to your backend server
const API_URL = "/api"

// Check if user is already logged in
function checkAuthStatus() {
  const token = localStorage.getItem("token")
  if (token) {
    // Validate token
    fetch(`${API_URL}/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json()
        } else {
          throw new Error("Invalid token")
        }
      })
      .then((data) => {
        console.log("Token validated:", data)
        showTasksView()
      })
      .catch((error) => {
        console.error("Error validating token:", error)
        localStorage.removeItem("token") // Clear invalid token
        showLoginView()
        window.notifications.error("Sua sessão expirou. Por favor, faça login novamente.")
      })
  } else {
    showLoginView()
  }
}

// Show login view
function showLoginView() {
  document.getElementById("login-container").classList.remove("hidden")
  document.getElementById("register-container").classList.add("hidden")
  document.getElementById("tasks-container").classList.add("hidden")
}

// Show register view
function showRegisterView() {
  document.getElementById("login-container").classList.add("hidden")
  document.getElementById("register-container").classList.remove("hidden")
  document.getElementById("tasks-container").classList.add("hidden")
}

// Show tasks view
function showTasksView() {
  document.getElementById("login-container").classList.add("hidden")
  document.getElementById("register-container").classList.add("hidden")
  document.getElementById("tasks-container").classList.remove("hidden")

  // Carregar tarefas
  if (typeof window.loadTasks === "function") {
    window.loadTasks()
  } else {
    console.error("loadTasks function not found")
  }
}

// Limpar mensagens de erro nos formulários
function clearFormErrors(form) {
  const errorElements = form.querySelectorAll(".form-error")
  errorElements.forEach((el) => el.remove())
}

// Mostrar erro em um campo específico do formulário
function showFieldError(field, message) {
  // Remover erro existente
  const existingError = field.parentNode.querySelector(".form-error")
  if (existingError) {
    existingError.remove()
  }

  // Criar elemento de erro
  const errorElement = document.createElement("div")
  errorElement.className = "form-error"
  errorElement.textContent = message

  // Inserir após o campo
  field.parentNode.appendChild(errorElement)
}

// Inicializar event listeners quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form")
  const registerForm = document.getElementById("register-form")
  const showRegisterLink = document.getElementById("show-register")
  const showLoginLink = document.getElementById("show-login")

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Limpar erros anteriores
      clearFormErrors(loginForm)

      const emailField = document.getElementById("login-email")
      const passwordField = document.getElementById("login-password")
      const email = emailField.value
      const password = passwordField.value

      // Validação básica
      let isValid = true

      if (!email) {
        showFieldError(emailField, "E-mail é obrigatório")
        isValid = false
      }

      if (!password) {
        showFieldError(passwordField, "Senha é obrigatória")
        isValid = false
      }

      if (!isValid) return

      console.log("Tentando login com:", email)

      // Desabilitar o botão durante o login
      const submitButton = loginForm.querySelector('button[type="submit"]')
      submitButton.disabled = true
      submitButton.textContent = "Entrando..."

      fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => {
          console.log("Status da resposta:", response.status)

          // Sempre converter para JSON para ver a mensagem de erro
          return response.json().then((data) => {
            if (!response.ok) {
              throw new Error(data.error || "Falha no login")
            }
            return data
          })
        })
        .then((data) => {
          console.log("Login bem-sucedido:", data)
          localStorage.setItem("token", data.token)
          window.notifications.success("Login realizado com sucesso!")
          showTasksView()
        })
        .catch((error) => {
          console.error("Erro no login:", error)

          if (error.message === "Invalid credentials") {
            showFieldError(passwordField, "Credenciais inválidas. Verifique seu e-mail e senha.")
          } else {
            window.notifications.error(error.message || "Falha no login. Verifique suas credenciais e tente novamente.")
          }
        })
        .finally(() => {
          // Reativar o botão
          submitButton.disabled = false
          submitButton.textContent = "Entrar"
        })
    })
  }

  // Handle register form submission
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Limpar erros anteriores
      clearFormErrors(registerForm)

      const nameField = document.getElementById("register-name")
      const emailField = document.getElementById("register-email")
      const passwordField = document.getElementById("register-password")

      const name = nameField.value
      const email = emailField.value
      const password = passwordField.value

      // Validação básica
      let isValid = true

      if (!name) {
        showFieldError(nameField, "Nome é obrigatório")
        isValid = false
      }

      if (!email) {
        showFieldError(emailField, "E-mail é obrigatório")
        isValid = false
      }

      if (!password) {
        showFieldError(passwordField, "Senha é obrigatória")
        isValid = false
      } else if (password.length < 6) {
        showFieldError(passwordField, "A senha deve ter pelo menos 6 caracteres")
        isValid = false
      }

      if (!isValid) return

      console.log("Tentando registrar com:", email)

      // Desabilitar o botão durante o registro
      const submitButton = registerForm.querySelector('button[type="submit"]')
      submitButton.disabled = true
      submitButton.textContent = "Registrando..."

      fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })
        .then((response) => {
          console.log("Status da resposta:", response.status)

          // Sempre converter para JSON para ver a mensagem de erro
          return response.json().then((data) => {
            if (!response.ok) {
              throw new Error(data.error || "Falha no registro")
            }
            return data
          })
        })
        .then((data) => {
          console.log("Registro bem-sucedido:", data)
          window.notifications.success("Registro realizado com sucesso! Por favor, faça login.")
          showLoginView()
        })
        .catch((error) => {
          console.error("Erro no registro:", error)

          if (error.message === "Email already in use") {
            showFieldError(emailField, "Este e-mail já está em uso.")
          } else {
            window.notifications.error(error.message || "Falha no registro. Por favor, tente novamente.")
          }
        })
        .finally(() => {
          // Reativar o botão
          submitButton.disabled = false
          submitButton.textContent = "Cadastrar"
        })
    })
  }

  // Toggle between login and register views
  if (showRegisterLink) {
    showRegisterLink.addEventListener("click", (e) => {
      e.preventDefault()
      showRegisterView()
    })
  }

  if (showLoginLink) {
    showLoginLink.addEventListener("click", (e) => {
      e.preventDefault()
      showLoginView()
    })
  }
})

// Logout function - make it globally available
window.logout = () => {
  localStorage.removeItem("token")
  window.notifications.info("Você saiu do sistema.")
  showLoginView()
}

// Make functions globally available
window.showLoginView = showLoginView
window.showRegisterView = showRegisterView
window.showTasksView = showTasksView
window.checkAuthStatus = checkAuthStatus