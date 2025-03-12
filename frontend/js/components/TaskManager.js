import BaseComponent from "./BaseComponent.js"
import Utils from "./Utils.js"

/**
 * @class TaskManager
 * @extends BaseComponent
 * @description Gerencia as tarefas do usuário
 * Lida com criação, edição, exclusão e visualização de tarefas
 */
class TaskManager extends BaseComponent {
  /**
   * @constructor
   * @description Inicializa o gerenciador de tarefas
   * @param {ApiService} apiService - Serviço de API para requisições
   * @param {NotificationSystem} notifications - Sistema de notificações
   */
  constructor(apiService, notifications) {
    super()
    this.apiService = apiService
    this.notifications = notifications
    this.tasksData = []
    this.taskToDeleteId = null

    // Elementos do DOM
    this.taskGrid = this.select("#task-grid")
    this.taskForm = this.select("#task-form")
    this.taskFormContainer = this.select("#task-form-container")
    this.taskFormTitle = this.select("#task-form-title")
    this.addTaskBtn = this.select("#add-task-btn")
    this.cancelTaskBtn = this.select("#cancel-task")
    this.noDueDateCheckbox = this.select("#no-due-date")
    this.dueDateInput = this.select("#task-due-date")
    this.confirmModal = this.select("#confirm-modal")
    this.confirmDeleteBtn = this.select("#confirm-delete")
    this.cancelDeleteBtn = this.select("#cancel-delete")

    this.init()
  }

  /**
   * @method init
   * @description Inicializa o gerenciador de tarefas
   */
  init() {
    this.setupEventListeners()
  }

  /**
   * @method setupEventListeners
   * @description Configura os listeners de eventos
   */
  setupEventListeners() {
    // Evento para o checkbox "Sem data"
    if (this.noDueDateCheckbox && this.dueDateInput) {
      this.addEvent(this.noDueDateCheckbox, "change", () => {
        if (this.noDueDateCheckbox.checked) {
          this.dueDateInput.value = ""
          this.dueDateInput.disabled = true
        } else {
          this.dueDateInput.disabled = false
        }
      })

      // Se o campo de data for preenchido, desmarcar o checkbox
      this.addEvent(this.dueDateInput, "change", () => {
        if (this.dueDateInput.value) {
          this.noDueDateCheckbox.checked = false
        }
      })
    }

    // Evento para o botão de adicionar tarefa
    if (this.addTaskBtn) {
      this.addEvent(this.addTaskBtn, "click", this.openNewTaskForm.bind(this))
    }

    // Evento para o botão de cancelar
    if (this.cancelTaskBtn) {
      this.addEvent(this.cancelTaskBtn, "click", this.closeTaskForm.bind(this))
    }

    // Evento para o formulário de tarefa
    if (this.taskForm) {
      this.addEvent(this.taskForm, "submit", this.handleTaskFormSubmit.bind(this))
    }

    // Eventos para o modal de confirmação de exclusão
    if (this.confirmDeleteBtn) {
      this.addEvent(this.confirmDeleteBtn, "click", () => {
        if (this.taskToDeleteId) {
          this.deleteTask(this.taskToDeleteId)
          this.closeDeleteConfirmation()
        }
      })
    }

    if (this.cancelDeleteBtn) {
      this.addEvent(this.cancelDeleteBtn, "click", this.closeDeleteConfirmation.bind(this))
    }
  }

  /**
   * @method handleTaskFormSubmit
   * @description Processa o envio do formulário de tarefa
   * @param {Event} e - Evento de submit
   */
  handleTaskFormSubmit(e) {
    e.preventDefault()

    const taskData = {
      title: this.select("#task-title").value,
      description: this.select("#task-description").value,
      category: this.select("#task-category").value,
      dueDate: this.noDueDateCheckbox.checked ? null : this.dueDateInput.value,
    }

    this.saveTask(taskData)
  }

  /**
   * @method loadTasks
   * @description Carrega as tarefas do servidor
   */
  async loadTasks() {
    try {
      const data = await this.apiService.get("/tasks")
      console.log("Tasks loaded:", data)
      this.tasksData = data
      this.renderTasks()

      // Mostrar dica para novos usuários se não houver tarefas
      if (data.length === 0) {
        this.showNewUserHint()
      }
    } catch (error) {
      console.error("Error loading tasks:", error)
      this.notifications.error("Não foi possível carregar as tarefas. Tente novamente mais tarde.")
    }
  }

  /**
   * @method renderTasks
   * @description Renderiza as tarefas na interface
   */
  renderTasks() {
    // Limpar grid de tarefas
    this.taskGrid.innerHTML = ""

    if (this.tasksData.length === 0) {
      const emptyMessage = this.createElement(
        "div",
        {
          className: "empty-tasks-message",
        },
        "Você ainda não tem tarefas. Clique no botão '+' para adicionar.",
      )

      this.taskGrid.appendChild(emptyMessage)
      return
    }

    // Adicionar cada tarefa ao grid
    this.tasksData.forEach((task) => {
      const taskElement = this.createTaskElement(task)
      this.taskGrid.appendChild(taskElement)
    })
  }

  /**
   * @method createTaskElement
   * @description Cria um elemento de tarefa a partir do template
   * @param {Object} task - Dados da tarefa
   * @returns {HTMLElement} - Elemento da tarefa
   */
  createTaskElement(task) {
    // Obter template
    const taskTemplate = this.select("#task-template")

    // Clonar o template
    const taskElement = document.importNode(taskTemplate.content, true).firstElementChild

    // Definir ID e classe
    taskElement.dataset.id = task.id
    if (task.completed) {
      taskElement.classList.add("task-completed")
    }

    // Preencher conteúdo
    const titleElement = taskElement.querySelector(".task-title-text")
    titleElement.textContent = task.title

    const descriptionElement = taskElement.querySelector(".task-description")
    descriptionElement.textContent = task.description || "Sem descrição"

    const categoryElement = taskElement.querySelector(".task-category")
    categoryElement.textContent = task.category

    const dueDateElement = taskElement.querySelector(".task-due-date")
    if (task.due_date) {
      dueDateElement.textContent = `Vence em: ${Utils.formatDate(new Date(task.due_date))}`
    } else {
      dueDateElement.textContent = "Sem data de vencimento"
    }

    // Adicionar o ícone de checkbox correto
    const checkboxElement = taskElement.querySelector(".task-checkbox")
    if (task.completed) {
      checkboxElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `
    } else {
      checkboxElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      `
    }

    // Adicionar event listeners
    const checkbox = taskElement.querySelector(".task-checkbox")
    this.addEvent(checkbox, "click", (e) => {
      e.stopPropagation() // Impedir que o clique propague para o elemento pai
      this.toggleTaskCompletion(task.id)
    })

    // Adicionar evento para expandir/recolher detalhes ao clicar no header
    const taskHeader = taskElement.querySelector(".task-header")
    this.addEvent(taskHeader, "click", () => {
      this.toggleTaskDetails(taskElement)
    })

    const toggleBtn = taskElement.querySelector(".task-toggle")
    this.addEvent(toggleBtn, "click", (e) => {
      e.stopPropagation() // Impedir que o clique propague para o elemento pai
      this.toggleTaskDetails(taskElement)
    })

    const editBtn = taskElement.querySelector(".edit-task-btn")
    this.addEvent(editBtn, "click", (e) => {
      e.stopPropagation() // Impedir que o clique propague para o elemento pai
      this.openEditTaskForm(task)
    })

    const deleteBtn = taskElement.querySelector(".delete-task-btn")
    this.addEvent(deleteBtn, "click", (e) => {
      e.stopPropagation() // Impedir que o clique propague para o elemento pai
      this.showDeleteConfirmation(task.id)
    })

    return taskElement
  }

  /**
   * @method showDeleteConfirmation
   * @description Mostra o modal de confirmação de exclusão
   * @param {number} taskId - ID da tarefa a ser excluída
   */
  showDeleteConfirmation(taskId) {
    // Armazenar o ID da tarefa a ser excluída
    this.taskToDeleteId = taskId

    // Mostrar o modal de confirmação
    this.confirmModal.classList.remove("hidden")
  }

  /**
   * @method closeDeleteConfirmation
   * @description Fecha o modal de confirmação de exclusão
   */
  closeDeleteConfirmation() {
    this.confirmModal.classList.add("hidden")
    this.taskToDeleteId = null
  }

  /**
   * @method toggleTaskDetails
   * @description Alterna a exibição dos detalhes da tarefa
   * @param {HTMLElement} taskElement - Elemento da tarefa
   */
  toggleTaskDetails(taskElement) {
    const detailsElement = taskElement.querySelector(".task-details")
    detailsElement.classList.toggle("hidden")
    taskElement.classList.toggle("expanded")
  }

  /**
   * @method toggleTaskCompletion
   * @description Alterna o status de conclusão da tarefa
   * @param {number} taskId - ID da tarefa
   */
  async toggleTaskCompletion(taskId) {
    console.log("Toggling completion for task:", taskId)
    const task = this.tasksData.find((t) => t.id === taskId)

    if (!task) return

    // Apenas inverter o status de conclusão, mantendo todos os outros dados
    const updatedTask = {
      title: task.title,
      description: task.description,
      category: task.category,
      dueDate: task.due_date,
      completed: !task.completed,
    }

    try {
      const data = await this.apiService.put(`/tasks/${taskId}`, updatedTask)

      console.log("Task updated:", data)
      // Atualizar dados locais - apenas mudar o status completed
      this.tasksData = this.tasksData.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      this.renderTasks()

      const statusText = task.completed ? "desmarcada" : "marcada como concluída"
      this.notifications.success(`Tarefa ${statusText} com sucesso!`)
    } catch (error) {
      console.error("Error updating task:", error)
      this.notifications.error("Não foi possível atualizar a tarefa. Tente novamente.")
    }
  }

  /**
   * @method openNewTaskForm
   * @description Abre o formulário para adicionar nova tarefa
   */
  openNewTaskForm() {
    this.taskFormTitle.textContent = "Nova Tarefa"
    this.taskForm.reset()
    this.select("#task-id").value = ""
    this.taskFormContainer.classList.remove("hidden")

    // Resetar o checkbox de "sem data"
    this.noDueDateCheckbox.checked = false
    this.dueDateInput.disabled = false
  }

  /**
   * @method openEditTaskForm
   * @description Abre o formulário para editar tarefa existente
   * @param {Object} task - Dados da tarefa a ser editada
   */
  openEditTaskForm(task) {
    this.taskFormTitle.textContent = "Editar Tarefa"
    this.select("#task-id").value = task.id
    this.select("#task-title").value = task.title
    this.select("#task-description").value = task.description || ""
    this.select("#task-category").value = task.category

    // Configurar data de vencimento
    if (task.due_date) {
      // Formatar a data para o formato YYYY-MM-DD para o input date
      const dueDate = new Date(task.due_date)
      const formattedDate = dueDate.toISOString().split("T")[0]
      this.dueDateInput.value = formattedDate
      this.noDueDateCheckbox.checked = false
      this.dueDateInput.disabled = false
    } else {
      this.dueDateInput.value = ""
      this.noDueDateCheckbox.checked = true
      this.dueDateInput.disabled = true
    }

    this.taskFormContainer.classList.remove("hidden")
  }

  /**
   * @method closeTaskForm
   * @description Fecha o formulário de tarefa
   */
  closeTaskForm() {
    this.taskFormContainer.classList.add("hidden")
  }

  /**
   * @method saveTask
   * @description Salva uma tarefa (nova ou editada)
   * @param {Object} taskData - Dados da tarefa
   */
  async saveTask(taskData) {
    const taskId = this.select("#task-id").value
    const isEditing = taskId !== ""

    try {
      let data

      if (isEditing) {
        data = await this.apiService.put(`/tasks/${taskId}`, taskData)
        // Atualizar tarefa existente nos dados locais
        this.tasksData = this.tasksData.map((t) => (t.id === Number.parseInt(taskId) ? data : t))
        this.notifications.success("Tarefa atualizada com sucesso!")
      } else {
        data = await this.apiService.post("/tasks", taskData)
        // Adicionar nova tarefa aos dados locais
        this.tasksData.push(data)
        this.notifications.success("Tarefa criada com sucesso!")
      }

      this.renderTasks()
      this.closeTaskForm()
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} task:`, error)
      this.notifications.error(`Não foi possível ${isEditing ? "atualizar" : "criar"} a tarefa. Tente novamente.`)
    }
  }

  /**
   * @method deleteTask
   * @description Deleta uma tarefa
   * @param {number} taskId - ID da tarefa a ser excluída
   */
  async deleteTask(taskId) {
    try {
      await this.apiService.delete(`/tasks/${taskId}`)

      // Remover tarefa dos dados locais
      this.tasksData = this.tasksData.filter((t) => t.id !== taskId)
      this.renderTasks()
      this.notifications.success("Tarefa excluída com sucesso!")
    } catch (error) {
      console.error("Error deleting task:", error)
      this.notifications.error("Não foi possível excluir a tarefa. Tente novamente.")
    }
  }

  /**
   * @method showNewUserHint
   * @description Mostra dica para novos usuários
   */
  showNewUserHint() {
    // Verificar se o usuário já viu a dica
    if (localStorage.getItem("hintShown")) {
      return
    }

    // Criar elemento de dica
    const hintElement = this.createElement("div", {
      className: "new-user-hint",
    })

    hintElement.innerHTML = `
      <button class="new-user-hint-close">&times;</button>
      <p><strong>Dica:</strong> Clique no botão "+ Nova Tarefa" abaixo para começar a adicionar suas tarefas!</p>
      <div class="new-user-hint-arrow">↓</div>
    `

    this.select("#tasks-container").appendChild(hintElement)

    // Adicionar evento para fechar a dica
    const closeBtn = hintElement.querySelector(".new-user-hint-close")
    this.addEvent(closeBtn, "click", () => {
      hintElement.remove()
      localStorage.setItem("hintShown", "true")
    })

    // Remover automaticamente após 10 segundos
    setTimeout(() => {
      if (hintElement.parentNode) {
        hintElement.remove()
        localStorage.setItem("hintShown", "true")
      }
    }, 10000)
  }
}

// Exporta a classe para uso global
window.TaskManager = TaskManager