/**
 * @class AuthManager
 * @extends BaseComponent
 * @description Gerencia a autenticação de usuários
 * Lida com login, registro, validação de token e logout
 */
import BaseComponent from "./BaseComponent.js"
import Utils from "../utils/utils.js"

class AuthManager extends BaseComponent {
  /**
   * @constructor
   * @description Inicializa o gerenciador de autenticação
   * @param {ApiService} apiService - Serviço de API para requisições
   * @param {NotificationSystem} notifications - Sistema de notificações
   * @param {Function} onAuthStateChange - Callback para mudanças no estado de autenticação
   */
  constructor(apiService, notifications, onAuthStateChange) {
    super()
    this.apiService = apiService
    this.notifications = notifications
    this.onAuthStateChange = onAuthStateChange

    // Elementos do DOM
    this.loginContainer = this.select("#login-container")
    this.registerContainer = this.select("#register-container")
    this.tasksContainer = this.select("#tasks-container")
    this.loginForm = this.select("#login-form")
    this.registerForm = this.select("#register-form")
    this.showRegisterLink = this.select("#show-register")
    this.showLoginLink = this.select("#show-login")

    this.init()
  }

  /**
   * @method init
   * @description Inicializa os eventos e verifica o estado de autenticação
   */
  init() {
    this.setupEventListeners()
    this.checkAuthStatus()
  }

  /**
   * @method setupEventListeners
   * @description Configura os listeners de eventos para os formulários
   */
  setupEventListeners() {
    // Formulário de login
    if (this.loginForm) {
      this.addEvent(this.loginForm, "submit", this.handleLogin.bind(this))
    }

    // Formulário de registro
    if (this.registerForm) {
      this.addEvent(this.registerForm, "submit", this.handleRegister.bind(this))
    }

    // Links para alternar entre login e registro
    if (this.showRegisterLink) {
      this.addEvent(this.showRegisterLink, "click", (e) => {
        e.preventDefault()
        this.showRegisterView()
      })
    }

    if (this.showLoginLink) {
      this.addEvent(this.showLoginLink, "click", (e) => {
        e.preventDefault()
        this.showLoginView()
      })
    }
  }

  /**
   * @method checkAuthStatus
   * @description Verifica se o usuário está autenticado
   */
  async checkAuthStatus() {
    const token = localStorage.getItem("token")

    if (!token) {
      this.showLoginView()
      return
    }

    try {
      const data = await this.apiService.get("/auth/validate")
      console.log("Token validado:", data)
      this.showTasksView()
    } catch (error) {
      console.error("Erro ao validar token:", error)
      localStorage.removeItem("token")
      this.showLoginView()
      this.notifications.error("Sua sessão expirou. Por favor, faça login novamente.")
    }
  }

  /**
   * @method handleLogin
   * @description Processa o envio do formulário de login
   * @param {Event} e - Evento de submit
   */
  async handleLogin(e) {
    e.preventDefault()

    // Limpar erros anteriores
    this.clearFormErrors(this.loginForm)

    const emailField = this.select("#login-email")
    const passwordField = this.select("#login-password")
    const email = emailField.value
    const password = passwordField.value

    // Validação básica
    let isValid = true

    if (!email) {
      this.showFieldError(emailField, "E-mail é obrigatório")
      isValid = false
    }

    if (!password) {
      this.showFieldError(passwordField, "Senha é obrigatória")
      isValid = false
    }

    if (!isValid) return

    // Desabilitar o botão durante o login
    const submitButton = this.loginForm.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.textContent = "Entrando..."

    try {
      const data = await this.apiService.post("/auth/login", { email, password }, false)

      localStorage.setItem("token", data.token)
      this.notifications.success("Login realizado com sucesso!")
      this.showTasksView()
    } catch (error) {
      console.error("Erro no login:", error)

      if (error.message === "Invalid credentials") {
        this.showFieldError(passwordField, "Credenciais inválidas. Verifique seu e-mail e senha.")
      } else {
        this.notifications.error(error.message || "Falha no login. Verifique suas credenciais e tente novamente.")
      }
    } finally {
      // Reativar o botão
      submitButton.disabled = false
      submitButton.textContent = "Entrar"
    }
  }

  /**
   * @method handleRegister
   * @description Processa o envio do formulário de registro
   * @param {Event} e - Evento de submit
   */
  async handleRegister(e) {
    e.preventDefault()

    // Limpar erros anteriores
    this.clearFormErrors(this.registerForm)

    const nameField = this.select("#register-name")
    const emailField = this.select("#register-email")
    const passwordField = this.select("#register-password")

    const name = nameField.value
    const email = emailField.value
    const password = passwordField.value

    // Validação básica
    let isValid = true

    if (!name) {
      this.showFieldError(nameField, "Nome é obrigatório")
      isValid = false
    }

    if (!email) {
      this.showFieldError(emailField, "E-mail é obrigatório")
      isValid = false
    } else if (!Utils.validateEmail(email)) {
      this.showFieldError(emailField, "E-mail inválido")
      isValid = false
    }

    if (!password) {
      this.showFieldError(passwordField, "Senha é obrigatória")
      isValid = false
    } else if (password.length < 6) {
      this.showFieldError(passwordField, "A senha deve ter pelo menos 6 caracteres")
      isValid = false
    }

    if (!isValid) return

    // Desabilitar o botão durante o registro
    const submitButton = this.registerForm.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.textContent = "Registrando..."

    try {
      await this.apiService.post("/auth/register", { name, email, password }, false)

      this.notifications.success("Registro realizado com sucesso! Por favor, faça login.")
      this.showLoginView()
    } catch (error) {
      console.error("Erro no registro:", error)

      if (error.message === "Email already in use") {
        this.showFieldError(emailField, "Este e-mail já está em uso.")
      } else {
        this.notifications.error(error.message || "Falha no registro. Por favor, tente novamente.")
      }
    } finally {
      // Reativar o botão
      submitButton.disabled = false
      submitButton.textContent = "Cadastrar"
    }
  }

  /**
   * @method logout
   * @description Realiza o logout do usuário
   */
  logout() {
    localStorage.removeItem("token")
    this.notifications.info("Você saiu do sistema.")
    this.showLoginView()
  }

  /**
   * @method showLoginView
   * @description Exibe a tela de login
   */
  showLoginView() {
    if (this.loginContainer) this.loginContainer.classList.remove("hidden")
    if (this.registerContainer) this.registerContainer.classList.add("hidden")
    if (this.tasksContainer) this.tasksContainer.classList.add("hidden")

    if (this.onAuthStateChange) {
      this.onAuthStateChange({ isAuthenticated: false, view: "login" })
    }
  }

  /**
   * @method showRegisterView
   * @description Exibe a tela de registro
   */
  showRegisterView() {
    if (this.loginContainer) this.loginContainer.classList.add("hidden")
    if (this.registerContainer) this.registerContainer.classList.remove("hidden")
    if (this.tasksContainer) this.tasksContainer.classList.add("hidden")

    if (this.onAuthStateChange) {
      this.onAuthStateChange({ isAuthenticated: false, view: "register" })
    }
  }

  /**
   * @method showTasksView
   * @description Exibe a tela de tarefas
   */
  showTasksView() {
    if (this.loginContainer) this.loginContainer.classList.add("hidden")
    if (this.registerContainer) this.registerContainer.classList.add("hidden")
    if (this.tasksContainer) this.tasksContainer.classList.remove("hidden")

    if (this.onAuthStateChange) {
      this.onAuthStateChange({ isAuthenticated: true, view: "tasks" })
    }
  }

  /**
   * @method clearFormErrors
   * @description Limpa mensagens de erro em um formulário
   * @param {HTMLFormElement} form - Formulário a ser limpo
   */
  clearFormErrors(form) {
    const errorElements = form.querySelectorAll(".form-error")
    errorElements.forEach((el) => el.remove())
  }

  /**
   * @method showFieldError
   * @description Exibe uma mensagem de erro para um campo específico
   * @param {HTMLElement} field - Campo com erro
   * @param {string} message - Mensagem de erro
   */
  showFieldError(field, message) {
    // Remover erro existente
    const existingError = field.parentNode.querySelector(".form-error")
    if (existingError) {
      existingError.remove()
    }

    // Criar elemento de erro
    const errorElement = this.createElement(
      "div",
      {
        className: "form-error",
      },
      message,
    )

    // Inserir após o campo
    field.parentNode.appendChild(errorElement)
  }
}

// Exporta a classe para uso global
window.AuthManager = AuthManager