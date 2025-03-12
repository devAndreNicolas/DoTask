/**
 * @class Utils
 * @description Classe utilitária com funções auxiliares para a aplicação
 */
class Utils {
  /**
   * @method formatDate
   * @description Formata uma data para exibição
   * @param {Date} date - Data a ser formatada
   * @param {Object} options - Opções de formatação (opcional)
   * @returns {string} - Data formatada
   */
  static formatDate(date) {
    if (!date) return ""

    const options = { year: "numeric", month: "long", day: "numeric" }
    return date instanceof Date
      ? date.toLocaleDateString("pt-BR", options)
      : new Date(date).toLocaleDateString("pt-BR", options)
  }

  /**
   * @method debounce
   * @description Limita a frequência de execução de uma função
   * @param {Function} func - Função a ser executada
   * @param {number} wait - Tempo de espera em ms
   * @returns {Function} - Função com debounce aplicado
   */
  static debounce(func, wait = 300) {
    let timeout

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }

      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * @method validateEmail
   * @description Valida se uma string é um email válido
   * @param {string} email - Email a ser validado
   * @returns {boolean} - Se o email é válido
   */
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase())
  }

  /**
   * @method getInitials
   * @description Obtém as iniciais de um nome
   * @param {string} name - Nome completo
   * @returns {string} - Iniciais do nome
   */
  static getInitials(name) {
    if (!name) return ""

    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  /**
   * @method toggleClass
   * @description Adiciona ou remove uma classe de um elemento
   * @param {HTMLElement} element - Elemento a ser modificado
   * @param {string} className - Nome da classe
   * @param {boolean} force - Se deve forçar adição ou remoção
   */
  static toggleClass(element, className, force) {
    if (element) {
      if (force === undefined) {
        element.classList.toggle(className)
      } else {
        if (force) {
          element.classList.add(className)
        } else {
          element.classList.remove(className)
        }
      }
    }
  }
}

// Exporta a classe para uso global
window.Utils = Utils