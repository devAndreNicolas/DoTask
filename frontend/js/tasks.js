// tasks.js - Gerenciamento de tarefas

// Variáveis globais
let tasksData = []
const TASKS_API_URL = "/api/tasks"
const taskTemplate = document.getElementById("task-template")
const taskGrid = document.getElementById("task-grid")
const taskForm = document.getElementById("task-form")
const taskFormContainer = document.getElementById("task-form-container")
const taskFormTitle = document.getElementById("task-form-title")
const addTaskBtn = document.getElementById("add-task-btn")
const cancelTaskBtn = document.getElementById("cancel-task")
const noDueDateCheckbox = document.getElementById("no-due-date")
const dueDateInput = document.getElementById("task-due-date")
const loginContainer = document.getElementById("login-container")
const registerContainer = document.getElementById("register-container")
const tasksContainer = document.getElementById("tasks-container")
const confirmModal = document.getElementById("confirm-modal")
const confirmDeleteBtn = document.getElementById("confirm-delete")
const cancelDeleteBtn = document.getElementById("cancel-delete")

// Variável para armazenar o ID da tarefa a ser excluída
let taskToDeleteId = null

// Função para formatar data
function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString("pt-BR", options)
}

// Tornar a função formatDate disponível globalmente
window.formatDate = formatDate

// Carregar tarefas do servidor
function loadTasks() {
  const token = localStorage.getItem("token")
  if (!token) return

  fetch(TASKS_API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Tasks loaded:", data)
      tasksData = data
      renderTasks()

      // Mostrar dica para novos usuários se não houver tarefas
      if (data.length === 0) {
        showNewUserHint()
      }
    })
    .catch((error) => {
      console.error("Error loading tasks:", error)
      window.notifications.error("Não foi possível carregar as tarefas. Tente novamente mais tarde.")
    })
}

// Renderizar tarefas na interface
function renderTasks() {
  // Obter elementos do DOM
  const taskGrid = document.getElementById("task-grid")

  // Limpar grid de tarefas
  taskGrid.innerHTML = ""

  if (tasksData.length === 0) {
    const emptyMessage = document.createElement("div")
    emptyMessage.className = "empty-tasks-message"
    emptyMessage.textContent = "Você ainda não tem tarefas. Clique no botão '+' para adicionar."
    taskGrid.appendChild(emptyMessage)
    return
  }

  // Adicionar cada tarefa ao grid
  tasksData.forEach((task) => {
    const taskElement = createTaskElement(task)
    taskGrid.appendChild(taskElement)
  })
}

// Criar elemento de tarefa a partir do template
function createTaskElement(task) {
  // Obter template
  const taskTemplate = document.getElementById("task-template")

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
    dueDateElement.textContent = `Vence em: ${formatDate(new Date(task.due_date))}`
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
  checkbox.addEventListener("click", (e) => {
    e.stopPropagation() // Impedir que o clique propague para o elemento pai
    toggleTaskCompletion(task.id)
  })

  // Adicionar evento para expandir/recolher detalhes ao clicar no header
  const taskHeader = taskElement.querySelector(".task-header")
  taskHeader.addEventListener("click", () => {
    toggleTaskDetails(taskElement)
  })

  const toggleBtn = taskElement.querySelector(".task-toggle")
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation() // Impedir que o clique propague para o elemento pai
    toggleTaskDetails(taskElement)
  })

  const editBtn = taskElement.querySelector(".edit-task-btn")
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation() // Impedir que o clique propague para o elemento pai
    openEditTaskForm(task)
  })

  const deleteBtn = taskElement.querySelector(".delete-task-btn")
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation() // Impedir que o clique propague para o elemento pai
    showDeleteConfirmation(task.id)
  })

  return taskElement
}

// Mostrar modal de confirmação de exclusão
function showDeleteConfirmation(taskId) {
  // Armazenar o ID da tarefa a ser excluída
  taskToDeleteId = taskId

  // Mostrar o modal de confirmação
  confirmModal.classList.remove("hidden")
}

// Fechar modal de confirmação
function closeDeleteConfirmation() {
  confirmModal.classList.add("hidden")
  taskToDeleteId = null
}

// Alternar detalhes da tarefa (expandir/recolher)
function toggleTaskDetails(taskElement) {
  const detailsElement = taskElement.querySelector(".task-details")
  detailsElement.classList.toggle("hidden")
  taskElement.classList.toggle("expanded")
}

// Alternar status de conclusão da tarefa
function toggleTaskCompletion(taskId) {
  console.log("Toggling completion for task:", taskId)
  const token = localStorage.getItem("token")
  const task = tasksData.find((t) => t.id === taskId)

  if (!task) return

  // Apenas inverter o status de conclusão, mantendo todos os outros dados
  const updatedTask = {
    title: task.title,
    description: task.description,
    category: task.category,
    dueDate: task.due_date,
    completed: !task.completed,
  }

  fetch(`${TASKS_API_URL}/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedTask),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to update task")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Task updated:", data)
      // Atualizar dados locais - apenas mudar o status completed
      tasksData = tasksData.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      renderTasks()

      const statusText = task.completed ? "desmarcada" : "marcada como concluída"
      window.notifications.success(`Tarefa ${statusText} com sucesso!`)
    })
    .catch((error) => {
      console.error("Error updating task:", error)
      window.notifications.error("Não foi possível atualizar a tarefa. Tente novamente.")
    })
}

// Abrir formulário para adicionar nova tarefa
function openNewTaskForm() {
  const taskFormTitle = document.getElementById("task-form-title")
  const taskForm = document.getElementById("task-form")
  const taskFormContainer = document.getElementById("task-form-container")
  const noDueDateCheckbox = document.getElementById("no-due-date")
  const dueDateInput = document.getElementById("task-due-date")

  taskFormTitle.textContent = "Nova Tarefa"
  taskForm.reset()
  document.getElementById("task-id").value = ""
  taskFormContainer.classList.remove("hidden")

  // Resetar o checkbox de "sem data"
  noDueDateCheckbox.checked = false
  dueDateInput.disabled = false
}

// Abrir formulário para editar tarefa existente
function openEditTaskForm(task) {
  const taskFormTitle = document.getElementById("task-form-title")
  const taskFormContainer = document.getElementById("task-form-container")
  const noDueDateCheckbox = document.getElementById("no-due-date")
  const dueDateInput = document.getElementById("task-due-date")

  taskFormTitle.textContent = "Editar Tarefa"
  document.getElementById("task-id").value = task.id
  document.getElementById("task-title").value = task.title
  document.getElementById("task-description").value = task.description || ""
  document.getElementById("task-category").value = task.category

  // Configurar data de vencimento
  if (task.due_date) {
    // Formatar a data para o formato YYYY-MM-DD para o input date
    const dueDate = new Date(task.due_date)
    const formattedDate = dueDate.toISOString().split("T")[0]
    document.getElementById("task-due-date").value = formattedDate
    noDueDateCheckbox.checked = false
    dueDateInput.disabled = false
  } else {
    document.getElementById("task-due-date").value = ""
    noDueDateCheckbox.checked = true
    dueDateInput.disabled = true
  }

  taskFormContainer.classList.remove("hidden")
}

// Fechar formulário de tarefa
function closeTaskForm() {
  const taskFormContainer = document.getElementById("task-form-container")
  taskFormContainer.classList.add("hidden")
}

// Salvar tarefa (nova ou editada)
function saveTask(taskData) {
  const token = localStorage.getItem("token")
  const taskId = document.getElementById("task-id").value
  const isEditing = taskId !== ""

  const url = isEditing ? `${TASKS_API_URL}/${taskId}` : TASKS_API_URL
  const method = isEditing ? "PUT" : "POST"

  fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} task`)
      }
      return response.json()
    })
    .then((data) => {
      console.log(`Task ${isEditing ? "updated" : "created"}:`, data)

      if (isEditing) {
        // Atualizar tarefa existente nos dados locais
        tasksData = tasksData.map((t) => (t.id === Number.parseInt(taskId) ? data : t))
        window.notifications.success("Tarefa atualizada com sucesso!")
      } else {
        // Adicionar nova tarefa aos dados locais
        tasksData.push(data)
        window.notifications.success("Tarefa criada com sucesso!")
      }

      renderTasks()
      closeTaskForm()
    })
    .catch((error) => {
      console.error(`Error ${isEditing ? "updating" : "creating"} task:`, error)
      window.notifications.error(`Não foi possível ${isEditing ? "atualizar" : "criar"} a tarefa. Tente novamente.`)
    })
}

// Deletar tarefa
function deleteTask(taskId) {
  const token = localStorage.getItem("token")

  fetch(`${TASKS_API_URL}/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to delete task")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Task deleted:", data)
      // Remover tarefa dos dados locais
      tasksData = tasksData.filter((t) => t.id !== taskId)
      renderTasks()
      window.notifications.success("Tarefa excluída com sucesso!")
    })
    .catch((error) => {
      console.error("Error deleting task:", error)
      window.notifications.error("Não foi possível excluir a tarefa. Tente novamente.")
    })
}

// Adicionar dica para novos usuários
function showNewUserHint() {
  // Verificar se o usuário já viu a dica
  if (localStorage.getItem("hintShown")) {
    return
  }

  // Criar elemento de dica
  const hintElement = document.createElement("div")
  hintElement.className = "new-user-hint"
  hintElement.innerHTML = `
    <button class="new-user-hint-close">&times;</button>
    <p><strong>Dica:</strong> Clique no botão "+ Nova Tarefa" abaixo para começar a adicionar suas tarefas!</p>
    <div class="new-user-hint-arrow">↓</div>
  `

  document.getElementById("tasks-container").appendChild(hintElement)

  // Adicionar evento para fechar a dica
  const closeBtn = hintElement.querySelector(".new-user-hint-close")
  closeBtn.addEventListener("click", () => {
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

// Modificar a função showTasksView para mostrar a dica
function showTasksView() {
  loginContainer.classList.add("hidden")
  registerContainer.classList.add("hidden")
  tasksContainer.classList.remove("hidden")

  // Carregar tarefas
  loadTasks()
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const noDueDateCheckbox = document.getElementById("no-due-date")
  const dueDateInput = document.getElementById("task-due-date")
  const addTaskBtn = document.getElementById("add-task-btn")
  const cancelTaskBtn = document.getElementById("cancel-task")
  const taskForm = document.getElementById("task-form")
  const confirmDeleteBtn = document.getElementById("confirm-delete")
  const cancelDeleteBtn = document.getElementById("cancel-delete")

  // Evento para o checkbox "Sem data"
  if (noDueDateCheckbox && dueDateInput) {
    noDueDateCheckbox.addEventListener("change", function () {
      if (this.checked) {
        dueDateInput.value = ""
        dueDateInput.disabled = true
      } else {
        dueDateInput.disabled = false
      }
    })

    // Se o campo de data for preenchido, desmarcar o checkbox
    dueDateInput.addEventListener("change", function () {
      if (this.value) {
        noDueDateCheckbox.checked = false
      }
    })
  }

  // Evento para o botão de adicionar tarefa
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", openNewTaskForm)
  }

  // Evento para o botão de cancelar
  if (cancelTaskBtn) {
    cancelTaskBtn.addEventListener("click", closeTaskForm)
  }

  // Evento para o formulário de tarefa
  if (taskForm) {
    taskForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const taskData = {
        title: document.getElementById("task-title").value,
        description: document.getElementById("task-description").value,
        category: document.getElementById("task-category").value,
        dueDate: document.getElementById("no-due-date").checked ? null : document.getElementById("task-due-date").value,
      }

      saveTask(taskData)
    })
  }

  // Eventos para o modal de confirmação de exclusão
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      if (taskToDeleteId) {
        deleteTask(taskToDeleteId)
        closeDeleteConfirmation()
      }
    })
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeDeleteConfirmation)
  }
})

// Exportar funções para uso em outros arquivos
window.loadTasks = loadTasks