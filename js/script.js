const STORAGE_KEY = "personal-checklist-items";
const RESET_KEY = "personal-checklist-last-reset";

const input = document.getElementById("newItem");
const addButton = document.getElementById("addButton");
const checklist = document.getElementById("checklist");
const progressText = document.getElementById("progressText");
const todayLabel = document.getElementById("todayLabel");

let items = [];

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

  if (lastReset !== today) {
    items = [];
    localStorage.setItem(RESET_KEY, today);
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const savedItems = localStorage.getItem(STORAGE_KEY);
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

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-btn";
      removeButton.dataset.action = "remove";
      removeButton.dataset.id = item.id;
      removeButton.setAttribute("aria-label", "Remove task");
      removeButton.textContent = "✕";

      listItem.appendChild(label);
      listItem.appendChild(removeButton);
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
  saveItems();
  render();
  input.focus();
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
  const button = event.target.closest("button[data-action='remove']");

  if (!button) {
    return;
  }

  const itemId = button.dataset.id;
  items = items.filter((item) => item.id !== itemId);
  saveItems();
  render();
});

function checkForReset() {
  const today = getPstDateKey();
  const lastReset = localStorage.getItem(RESET_KEY);

  if (lastReset !== today) {
    items = [];
    saveItems();
    render();
  }
}

loadItems();
render();
setInterval(checkForReset, 60000);
