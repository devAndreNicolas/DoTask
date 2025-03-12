/**
 * @class ApiService
 * @description Serviço para realizar requisições à API
 * Encapsula a lógica de comunicação com o backend
 */
class ApiService {
  /**
   * @constructor
   * @description Inicializa o serviço de API
   * @param {string} baseUrl - URL base para as requisições
   */
  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  /**
   * @method getAuthHeader
   * @description Obtém o cabeçalho de autorização com o token JWT
   * @returns {Object} - Objeto com o cabeçalho de autorização
   */
  getAuthHeader() {
    const token = localStorage.getItem("token")
    return {
      Authorization: token ? `Bearer ${token}` : "",
    }
  }

  /**
   * @method get
   * @description Realiza uma requisição GET
   * @param {string} endpoint - Endpoint da API
   * @param {boolean} requiresAuth - Se a requisição requer autenticação
   * @returns {Promise} - Promise com a resposta da requisição
   */
  async get(endpoint, requiresAuth = true) {
    const headers = requiresAuth ? this.getAuthHeader() : {}

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        ...headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Erro na requisição: ${response.status}`)
    }

    return response.json()
  }

  /**
   * @method post
   * @description Realiza uma requisição POST
   * @param {string} endpoint - Endpoint da API
   * @param {Object} data - Dados a serem enviados
   * @param {boolean} requiresAuth - Se a requisição requer autenticação
   * @returns {Promise} - Promise com a resposta da requisição
   */
  async post(endpoint, data, requiresAuth = true) {
    const headers = requiresAuth ? this.getAuthHeader() : {}

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.error || `Erro na requisição: ${response.status}`)
    }

    return responseData
  }

  /**
   * @method put
   * @description Realiza uma requisição PUT
   * @param {string} endpoint - Endpoint da API
   * @param {Object} data - Dados a serem enviados
   * @param {boolean} requiresAuth - Se a requisição requer autenticação
   * @returns {Promise} - Promise com a resposta da requisição
   */
  async put(endpoint, data, requiresAuth = true) {
    const headers = requiresAuth ? this.getAuthHeader() : {}

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.error || `Erro na requisição: ${response.status}`)
    }

    return responseData
  }

  /**
   * @method delete
   * @description Realiza uma requisição DELETE
   * @param {string} endpoint - Endpoint da API
   * @param {boolean} requiresAuth - Se a requisição requer autenticação
   * @returns {Promise} - Promise com a resposta da requisição
   */
  async delete(endpoint, requiresAuth = true) {
    const headers = requiresAuth ? this.getAuthHeader() : {}

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: {
        ...headers,
      },
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.error || `Erro na requisição: ${response.status}`)
    }

    return responseData
  }
}

// Exporta a classe para uso global
window.ApiService = ApiService