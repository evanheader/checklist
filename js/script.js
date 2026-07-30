const STORAGE_KEY = "personal-checklist-items";
const RESET_KEY = "personal-checklist-last-reset";

const input = document.getElementById("newItem");
const addButton = document.getElementById("addButton");
const checklist = document.getElementById("checklist");
const progressText = document.getElementById("progressText");
const todayLabel = document.getElementById("todayLabel");

let items = [];
let editingItemId = null;

function getPstDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function formatPstDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function loadItems() {
  const lastReset = localStorage.getItem(RESET_KEY);
  const today = getPstDateKey();
  const savedItems = localStorage.getItem(STORAGE_KEY);

  if (lastReset !== today) {
    items = savedItems ? JSON.parse(savedItems) : [];
    items = items.map((item) => ({ ...item, completed: false }));
    localStorage.setItem(RESET_KEY, today);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return;
  }

  items = savedItems ? JSON.parse(savedItems) : [];
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(RESET_KEY, getPstDateKey());
}

function updateProgress() {
  const completedCount = items.filter((item) => item.completed).length;
  progressText.textContent = `${completedCount} of ${items.length} completed`;
}

function render() {
  checklist.innerHTML = "";
  todayLabel.textContent = formatPstDate();

  if (items.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "Nothing yet. Add your first task.";
    checklist.appendChild(emptyState);
  } else {
    items.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.className = `item${item.completed ? " completed" : ""}`;

      if (item.id === editingItemId) {
        const editor = document.createElement("div");
        editor.className = "edit-row";

        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.className = "edit-input";
        editInput.value = item.text;
        editInput.maxLength = 80;
        editInput.setAttribute("aria-label", "Edit task");

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = "save-btn";
        saveButton.dataset.action = "save-edit";
        saveButton.dataset.id = item.id;
        saveButton.textContent = "Save";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "cancel-btn";
        cancelButton.dataset.action = "cancel-edit";
        cancelButton.dataset.id = item.id;
        cancelButton.textContent = "Cancel";

        editor.appendChild(editInput);
        editor.appendChild(saveButton);
        editor.appendChild(cancelButton);
        listItem.appendChild(editor);
      } else {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "checkbox";
        checkbox.checked = item.completed;
        checkbox.dataset.id = item.id;

        const span = document.createElement("span");
        span.className = "task-text";
        span.textContent = item.text;

        label.appendChild(checkbox);
        label.appendChild(span);

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.dataset.action = "edit";
        editButton.dataset.id = item.id;
        editButton.setAttribute("aria-label", "Edit task");
        editButton.textContent = "✎";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-btn";
        removeButton.dataset.action = "remove";
        removeButton.dataset.id = item.id;
        removeButton.setAttribute("aria-label", "Remove task");
        removeButton.textContent = "✕";

        actions.appendChild(editButton);
        actions.appendChild(removeButton);
        listItem.appendChild(label);
        listItem.appendChild(actions);
      }

      checklist.appendChild(listItem);
    });
  }

  updateProgress();
}

function addItem() {
  const value = input.value.trim();

  if (!value) {
    input.focus();
    return;
  }

  items.unshift({ id: Date.now().toString(), text: value, completed: false });
  input.value = "";
  editingItemId = null;
  saveItems();
  render();
  input.focus();
}

function saveEditing(itemId) {
  const editInput = checklist.querySelector(".edit-input");
  const newText = editInput?.value.trim();

  if (!newText) {
    editingItemId = null;
    render();
    return;
  }

  items = items.map((item) =>
    item.id === itemId ? { ...item, text: newText } : item,
  );

  saveItems();
  editingItemId = null;
  render();
}

addButton.addEventListener("click", addItem);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addItem();
  }
});

checklist.addEventListener("change", (event) => {
  const checkbox = event.target;

  if (
    !(checkbox instanceof HTMLInputElement) ||
    !checkbox.classList.contains("checkbox")
  ) {
    return;
  }

  const itemId = checkbox.dataset.id;
  items = items.map((item) =>
    item.id === itemId ? { ...item, completed: checkbox.checked } : item,
  );

  saveItems();
  render();
});

checklist.addEventListener("click", (event) => {
  const editButton = event.target.closest("button[data-action='edit']");

  if (editButton) {
    editingItemId = editButton.dataset.id;
    render();
    requestAnimationFrame(() => {
      const activeInput = checklist.querySelector(".edit-input");
      activeInput?.focus();
      activeInput?.select();
    });
    return;
  }

  const saveButton = event.target.closest("button[data-action='save-edit']");

  if (saveButton) {
    saveEditing(saveButton.dataset.id);
    return;
  }

  const cancelButton = event.target.closest(
    "button[data-action='cancel-edit']",
  );

  if (cancelButton) {
    editingItemId = null;
    render();
    return;
  }

  const removeButton = event.target.closest("button[data-action='remove']");

  if (!removeButton) {
    return;
  }

  const itemId = removeButton.dataset.id;
  items = items.filter((item) => item.id !== itemId);
  saveItems();
  render();
});

checklist.addEventListener("keydown", (event) => {
  const editInput = event.target.closest(".edit-input");

  if (!editInput) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const itemId = editInput
      .closest(".edit-row")
      ?.querySelector("button[data-action='save-edit']")?.dataset.id;
    saveEditing(itemId);
  } else if (event.key === "Escape") {
    editingItemId = null;
    render();
  }
});

function checkForReset() {
  const today = getPstDateKey();
  const lastReset = localStorage.getItem(RESET_KEY);

  if (lastReset !== today) {
    items = items.map((item) => ({ ...item, completed: false }));
    saveItems();
    render();
  }
}

loadItems();
render();
setInterval(checkForReset, 60000);
