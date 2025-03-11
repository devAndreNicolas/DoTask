// app.js - Main application logic

// DOM Elements
const currentDateElement = document.getElementById("current-date")
const defaultViewBtn = document.getElementById("default-view")
const listViewBtn = document.getElementById("list-view")
const lightThemeBtn = document.getElementById("light-theme")
const darkThemeBtn = document.getElementById("dark-theme")

// Sistema de notificações
const notifications = {
  container: null,

  // Inicializar o container de notificações
  init() {
    if (this.container) return

    this.container = document.getElementById("notification-container")
    if (!this.container) {
      this.container = document.createElement("div")
      this.container.id = "notification-container"
      this.container.className = "notification-container"
      document.body.appendChild(this.container)
    }
  },

  // Mostrar uma notificação
  show(message, type = "info", title = "", duration = 5000) {
    this.init()

    // Criar elemento de notificação
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`

    // Conteúdo da notificação
    const content = document.createElement("div")
    content.className = "notification-content"

    // Adicionar título se fornecido
    if (title) {
      const titleElement = document.createElement("div")
      titleElement.className = "notification-title"
      titleElement.textContent = title
      content.appendChild(titleElement)
    }

    // Adicionar mensagem
    const messageElement = document.createElement("div")
    messageElement.className = "notification-message"
    messageElement.textContent = message
    content.appendChild(messageElement)

    // Botão de fechar
    const closeButton = document.createElement("button")
    closeButton.className = "notification-close"
    closeButton.innerHTML = "&times;"
    closeButton.addEventListener("click", () => this.remove(notification))

    // Montar notificação
    notification.appendChild(content)
    notification.appendChild(closeButton)

    // Adicionar ao container
    this.container.appendChild(notification)

    // Remover após o tempo especificado
    if (duration > 0) {
      setTimeout(() => this.remove(notification), duration)
    }

    return notification
  },

  // Remover uma notificação
  remove(notification) {
    if (!notification.parentNode) return

    notification.style.animation = "fadeOut 0.3s forwards"

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  },

  // Métodos de conveniência para diferentes tipos de notificações
  error(message, title = "Erro", duration = 5000) {
    return this.show(message, "error", title, duration)
  },

  success(message, title = "Sucesso", duration = 5000) {
    return this.show(message, "success", title, duration)
  },

  warning(message, title = "Atenção", duration = 5000) {
    return this.show(message, "warning", title, duration)
  },

  info(message, title = "Informação", duration = 5000) {
    return this.show(message, "info", title, duration)
  },
}

// Set current date
function setCurrentDate() {
  const today = new Date()
  currentDateElement.textContent = window.formatDate(today)
}

// Toggle view mode
function setViewMode(mode) {
  const taskGrid = document.getElementById("task-grid")

  if (mode === "default") {
    taskGrid.classList.remove("list-view")
    defaultViewBtn.classList.add("active")
    listViewBtn.classList.remove("active")
    localStorage.setItem("viewMode", "default")
  } else {
    taskGrid.classList.add("list-view")
    defaultViewBtn.classList.remove("active")
    listViewBtn.classList.add("active")
    localStorage.setItem("viewMode", "list")
  }
}

// Toggle theme
function setTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark")
    lightThemeBtn.classList.remove("active")
    darkThemeBtn.classList.add("active")
    localStorage.setItem("theme", "dark")
  } else {
    document.body.classList.remove("dark")
    lightThemeBtn.classList.add("active")
    darkThemeBtn.classList.remove("active")
    localStorage.setItem("theme", "light")
  }
}

// Load saved preferences
function loadPreferences() {
  // Load view mode
  const savedViewMode = localStorage.getItem("viewMode") || "default"
  setViewMode(savedViewMode)

  // Load theme
  const savedTheme = localStorage.getItem("theme") || "light"
  setTheme(savedTheme)
}

// Add logout button to header
function addLogoutButton() {
  const headerControls = document.querySelector(".header-controls")

  // Check if logout button already exists
  if (!document.getElementById("logout-btn")) {
    const logoutBtn = document.createElement("button")
    logoutBtn.id = "logout-btn"
    logoutBtn.className = "btn btn-secondary"
    logoutBtn.textContent = "Sair"
    logoutBtn.addEventListener("click", () => {
      if (typeof window.logout === "function") {
        window.logout()
      }
    })

    headerControls.appendChild(logoutBtn)
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded")

  if (defaultViewBtn && listViewBtn) {
    defaultViewBtn.addEventListener("click", () => setViewMode("default"))
    listViewBtn.addEventListener("click", () => setViewMode("list"))
  }

  if (lightThemeBtn && darkThemeBtn) {
    lightThemeBtn.addEventListener("click", () => setTheme("light"))
    darkThemeBtn.addEventListener("click", () => setTheme("dark"))
  }

  // Inicializar sistema de notificações
  window.notifications = notifications
  notifications.init()

  setCurrentDate()
  loadPreferences()
  addLogoutButton()

  // Initialize auth after everything is loaded
  if (typeof window.checkAuthStatus === "function") {
    window.checkAuthStatus()
  } else {
    console.error("checkAuthStatus function not found")
    // Tentar novamente após um pequeno atraso
    setTimeout(() => {
      if (typeof window.checkAuthStatus === "function") {
        window.checkAuthStatus()
      } else {
        console.error("checkAuthStatus function still not found after delay")
      }
    }, 500)
  }
})