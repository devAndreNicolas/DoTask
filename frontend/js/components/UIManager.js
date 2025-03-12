import BaseComponent from "./BaseComponent.js"
import Utils from "../utils/Utils.js"

/**
 * @class UIManager
 * @extends BaseComponent
 * @description Gerencia a interface do usuário
 * Lida com temas, visualizações e elementos da UI
 */
class UIManager extends BaseComponent {
  /**
   * @constructor
   * @description Inicializa o gerenciador de UI
   */
  constructor() {
    super()

    // Elementos do DOM
    this.currentDateElement = this.select("#current-date")
    this.defaultViewBtn = this.select("#default-view")
    this.listViewBtn = this.select("#list-view")
    this.lightThemeBtn = this.select("#light-theme")
    this.darkThemeBtn = this.select("#dark-theme")
    this.headerControls = this.select(".header-controls")

    this.init()
  }

  /**
   * @method init
   * @description Inicializa o gerenciador de UI
   */
  init() {
    this.setupEventListeners()
    this.setCurrentDate()
    this.loadPreferences()
  }

  /**
   * @method setupEventListeners
   * @description Configura os listeners de eventos
   */
  setupEventListeners() {
    // Botões de visualização
    if (this.defaultViewBtn && this.listViewBtn) {
      this.addEvent(this.defaultViewBtn, "click", () => this.setViewMode("default"))
      this.addEvent(this.listViewBtn, "click", () => this.setViewMode("list"))
    }

    // Botões de tema
    if (this.lightThemeBtn && this.darkThemeBtn) {
      this.addEvent(this.lightThemeBtn, "click", () => this.setTheme("light"))
      this.addEvent(this.darkThemeBtn, "click", () => this.setTheme("dark"))
    }
  }

  /**
   * @method setCurrentDate
   * @description Define a data atual no elemento correspondente
   */
  setCurrentDate() {
    if (this.currentDateElement) {
      const today = new Date()
      this.currentDateElement.textContent = Utils.formatDate(today)
    }
  }

  /**
   * @method setViewMode
   * @description Define o modo de visualização das tarefas
   * @param {string} mode - Modo de visualização (default ou list)
   */
  setViewMode(mode) {
    const taskGrid = this.select("#task-grid")

    if (!taskGrid) return

    if (mode === "default") {
      taskGrid.classList.remove("list-view")
      this.defaultViewBtn.classList.add("active")
      this.listViewBtn.classList.remove("active")
      localStorage.setItem("viewMode", "default")
    } else {
      taskGrid.classList.add("list-view")
      this.defaultViewBtn.classList.remove("active")
      this.listViewBtn.classList.add("active")
      localStorage.setItem("viewMode", "list")
    }
  }

  /**
   * @method setTheme
   * @description Define o tema da aplicação
   * @param {string} theme - Tema (light ou dark)
   */
  setTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark")
      this.lightThemeBtn.classList.remove("active")
      this.darkThemeBtn.classList.add("active")
      localStorage.setItem("theme", "dark")
    } else {
      document.body.classList.remove("dark")
      this.lightThemeBtn.classList.add("active")
      this.darkThemeBtn.classList.remove("active")
      localStorage.setItem("theme", "light")
    }
  }

  /**
   * @method loadPreferences
   * @description Carrega as preferências salvas do usuário
   */
  loadPreferences() {
    // Carregar modo de visualização
    const savedViewMode = localStorage.getItem("viewMode") || "default"
    this.setViewMode(savedViewMode)

    // Carregar tema
    const savedTheme = localStorage.getItem("theme") || "light"
    this.setTheme(savedTheme)
  }

  /**
   * @method addLogoutButton
   * @description Adiciona o botão de logout ao cabeçalho
   * @param {Function} logoutCallback - Função a ser chamada ao clicar no botão
   */
  addLogoutButton(logoutCallback) {
    // Verificar se o botão já existe
    if (this.select("#logout-btn")) return

    const logoutBtn = this.createElement(
      "button",
      {
        id: "logout-btn",
        className: "btn btn-secondary",
      },
      "Sair",
    )

    this.addEvent(logoutBtn, "click", logoutCallback)

    if (this.headerControls) {
      this.headerControls.appendChild(logoutBtn)
    }
  }

  /**
   * @method removeLogoutButton
   * @description Remove o botão de logout do cabeçalho
   */
  removeLogoutButton() {
    const logoutBtn = this.select("#logout-btn")
    if (logoutBtn && logoutBtn.parentNode) {
      logoutBtn.parentNode.removeChild(logoutBtn)
    }
  }

  /**
   * @method updateUserAvatar
   * @description Atualiza o avatar do usuário com suas iniciais
   * @param {string} name - Nome do usuário
   */
  updateUserAvatar(name) {
    const avatar = this.select(".avatar span")
    if (avatar) {
      avatar.textContent = Utils.getInitials(name)
    }
  }
}

// Exporta a classe para uso global
window.UIManager = UIManager