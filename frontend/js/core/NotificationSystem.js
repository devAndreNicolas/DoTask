/**
 * @class NotificationSystem
 * @extends BaseComponent
 * @description Sistema de notificações para exibir mensagens ao usuário
 * Suporta diferentes tipos de notificações: sucesso, erro, aviso e informação
 */
import BaseComponent from "./BaseComponent"

class NotificationSystem extends BaseComponent {
  /**
   * @constructor
   * @description Inicializa o sistema de notificações
   */
  constructor() {
    super()
    this.container = null
    this.init()
  }

  /**
   * @method init
   * @description Inicializa o container de notificações
   */
  init() {
    if (this.container) return

    this.container = this.select("#notification-container")
    if (!this.container) {
      this.container = this.createElement("div", {
        id: "notification-container",
        className: "notification-container",
      })
      document.body.appendChild(this.container)
    }
  }

  /**
   * @method show
   * @description Exibe uma notificação
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de notificação (info, success, error, warning)
   * @param {string} title - Título da notificação (opcional)
   * @param {number} duration - Duração em ms antes de fechar automaticamente (0 para não fechar)
   * @returns {HTMLElement} - O elemento de notificação criado
   */
  show(message, type = "info", title = "", duration = 5000) {
    this.init()

    // Criar elemento de notificação
    const notification = this.createElement("div", {
      className: `notification notification-${type}`,
    })

    // Conteúdo da notificação
    const content = this.createElement("div", {
      className: "notification-content",
    })

    // Adicionar título se fornecido
    if (title) {
      const titleElement = this.createElement(
        "div",
        {
          className: "notification-title",
        },
        title,
      )
      content.appendChild(titleElement)
    }

    // Adicionar mensagem
    const messageElement = this.createElement(
      "div",
      {
        className: "notification-message",
      },
      message,
    )
    content.appendChild(messageElement)

    // Botão de fechar
    const closeButton = this.createElement(
      "button",
      {
        className: "notification-close",
      },
      "×",
    )

    // Adicionar evento ao botão de fechar
    this.addEvent(closeButton, "click", () => this.remove(notification))

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
  }

  /**
   * @method remove
   * @description Remove uma notificação com animação
   * @param {HTMLElement} notification - Elemento de notificação a ser removido
   */
  remove(notification) {
    if (!notification || !notification.parentNode) return

    notification.style.animation = "fadeOut 0.3s forwards"

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }

  /**
   * @method success
   * @description Exibe uma notificação de sucesso
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação (opcional)
   * @param {number} duration - Duração em ms antes de fechar automaticamente
   * @returns {HTMLElement} - O elemento de notificação criado
   */
  success(message, title = "Sucesso", duration = 5000) {
    return this.show(message, "success", title, duration)
  }

  /**
   * @method error
   * @description Exibe uma notificação de erro
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação (opcional)
   * @param {number} duration - Duração em ms antes de fechar automaticamente
   * @returns {HTMLElement} - O elemento de notificação criado
   */
  error(message, title = "Erro", duration = 5000) {
    return this.show(message, "error", title, duration)
  }

  /**
   * @method warning
   * @description Exibe uma notificação de aviso
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação (opcional)
   * @param {number} duration - Duração em ms antes de fechar automaticamente
   * @returns {HTMLElement} - O elemento de notificação criado
   */
  warning(message, title = "Atenção", duration = 5000) {
    return this.show(message, "warning", title, duration)
  }

  /**
   * @method info
   * @description Exibe uma notificação informativa
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação (opcional)
   * @param {number} duration - Duração em ms antes de fechar automaticamente
   * @returns {HTMLElement} - O elemento de notificação criado
   */
  info(message, title = "Informação", duration = 5000) {
    return this.show(message, "info", title, duration)
  }
}

// Exporta a classe para uso global
window.NotificationSystem = NotificationSystem