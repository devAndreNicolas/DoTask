/**
 * @class BaseComponent
 * @description Classe base para todos os componentes da aplicação
 * Fornece funcionalidades comuns como seleção de elementos DOM e gerenciamento de eventos
 */
class BaseComponent {
  /**
   * @constructor
   * @description Inicializa o componente base
   */
  constructor() {
    // Inicializa a lista de manipuladores de eventos para limpeza posterior
    this._eventHandlers = []
  }

  /**
   * @method select
   * @description Seleciona um elemento do DOM usando um seletor CSS
   * @param {string} selector - Seletor CSS para encontrar o elemento
   * @returns {HTMLElement|null} - O elemento encontrado ou null
   */
  select(selector) {
    return document.querySelector(selector)
  }

  /**
   * @method selectAll
   * @description Seleciona múltiplos elementos do DOM usando um seletor CSS
   * @param {string} selector - Seletor CSS para encontrar os elementos
   * @returns {NodeList} - Lista de elementos encontrados
   */
  selectAll(selector) {
    return document.querySelectorAll(selector)
  }

  /**
   * @method addEvent
   * @description Adiciona um evento a um elemento e armazena para limpeza posterior
   * @param {HTMLElement} element - Elemento ao qual adicionar o evento
   * @param {string} eventType - Tipo de evento (ex: 'click', 'submit')
   * @param {Function} handler - Função manipuladora do evento
   */
  addEvent(element, eventType, handler) {
    if (!element) return

    element.addEventListener(eventType, handler)

    // Armazena para limpeza posterior
    this._eventHandlers.push({
      element,
      eventType,
      handler,
    })
  }

  /**
   * @method removeAllEvents
   * @description Remove todos os eventos registrados por este componente
   */
  removeAllEvents() {
    this._eventHandlers.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler)
    })
    this._eventHandlers = []
  }

  /**
   * @method createElement
   * @description Cria um elemento HTML com atributos e conteúdo especificados
   * @param {string} tag - Tag HTML do elemento a ser criado
   * @param {Object} attributes - Atributos a serem definidos no elemento
   * @param {string|HTMLElement|Array} content - Conteúdo a ser adicionado ao elemento
   * @returns {HTMLElement} - O elemento criado
   */
  createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag)

    // Define atributos
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value
      } else {
        element.setAttribute(key, value)
      }
    })

    // Adiciona conteúdo
    if (content) {
      if (typeof content === "string") {
        element.textContent = content
      } else if (content instanceof HTMLElement) {
        element.appendChild(content)
      } else if (Array.isArray(content)) {
        content.forEach((item) => {
          if (typeof item === "string") {
            element.appendChild(document.createTextNode(item))
          } else if (item instanceof HTMLElement) {
            element.appendChild(item)
          }
        })
      }
    }

    return element
  }

  /**
   * @method init
   * @description Método de inicialização a ser sobrescrito pelas subclasses
   */
  init() {
    // Método a ser implementado pelas subclasses
  }

  /**
   * @method destroy
   * @description Limpa recursos quando o componente não é mais necessário
   */
  destroy() {
    this.removeAllEvents()
  }
}

// Exporta a classe para uso global
window.BaseComponent = BaseComponent