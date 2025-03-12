/**
 * @file app.js
 * @description Arquivo principal da aplicação
 * Inicializa e coordena todos os componentes
 */

// Import necessary classes
import { ApiService } from "./api-service.js"
import { NotificationSystem } from "./notification-system.js"
import { UIManager } from "./ui-manager.js"
import { AuthManager } from "./auth-manager.js"
import { TaskManager } from "./task-manager.js"
import { Utils } from "./utils.js"

/**
 * @class App
 * @description Classe principal da aplicação
 * Gerencia a inicialização e coordenação de todos os componentes
 */
class App {
  /**
   * @constructor
   * @description Inicializa a aplicação
   */
  constructor() {
    // Inicializar serviços e componentes
    this.apiService = new ApiService("/api")
    this.notifications = new NotificationSystem()
    this.uiManager = new UIManager()

    // Inicializar gerenciadores com dependências
    this.authManager = new AuthManager(this.apiService, this.notifications, this.handleAuthStateChange.bind(this))

    this.taskManager = new TaskManager(this.apiService, this.notifications)

    // Definir estado inicial
    this.isAuthenticated = false

    // Expor funções globalmente para compatibilidade com código existente
    this.exposeGlobalFunctions()
  }

  /**
   * @method handleAuthStateChange
   * @description Manipula mudanças no estado de autenticação
   * @param {Object} state - Estado de autenticação
   */
  handleAuthStateChange(state) {
    this.isAuthenticated = state.isAuthenticated

    if (state.isAuthenticated) {
      // Usuário autenticado
      this.uiManager.addLogoutButton(this.authManager.logout.bind(this.authManager))
      this.taskManager.loadTasks()

      // Obter dados do usuário para atualizar o avatar
      this.apiService
        .get("/auth/validate")
        .then((data) => {
          if (data.user && data.user.name) {
            this.uiManager.updateUserAvatar(data.user.name)
          }
        })
        .catch((error) => console.error("Erro ao obter dados do usuário:", error))
    } else {
      // Usuário não autenticado
      this.uiManager.removeLogoutButton()
    }
  }

  /**
   * @method exposeGlobalFunctions
   * @description Expõe funções globalmente para compatibilidade com código existente
   */
  exposeGlobalFunctions() {
    // Funções de autenticação
    window.checkAuthStatus = this.authManager.checkAuthStatus.bind(this.authManager)
    window.showLoginView = this.authManager.showLoginView.bind(this.authManager)
    window.showRegisterView = this.authManager.showRegisterView.bind(this.authManager)
    window.showTasksView = this.authManager.showTasksView.bind(this.authManager)
    window.logout = this.authManager.logout.bind(this.authManager)

    // Funções de tarefas
    window.loadTasks = this.taskManager.loadTasks.bind(this.taskManager)

    // Funções utilitárias
    window.formatDate = Utils.formatDate
    window.notifications = this.notifications
  }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded")
  window.app = new App()
})