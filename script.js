const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const timeInput = document.getElementById("todo-time");
const addButton = document.getElementById("add-button");
const list = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const remainingCount = document.getElementById("remaining-count");

const STORAGE_KEY = "todos";

// 할 일 모음: { id, text, done, important, date, time } (date·time은 비어 있을 수 있다)
let todos = loadTodos();

// 저장해 둔 할 일을 꺼낸다 (없거나 망가졌으면 빈 목록)
function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    // 저장이 막혀 있어도 화면은 계속 쓸 수 있다
  }
}

// 날짜 → 시간 순서로 비교한다 (날짜 없음은 맨 아래, 같은 날짜에서 시간 없음은 그날 맨 아래)
function compareTodos(a, b) {
  const dateA = a.date || "9999-99-99";
  const dateB = b.date || "9999-99-99";
  if (dateA !== dateB) return dateA < dateB ? -1 : 1;
  const timeA = a.time || "99:99";
  const timeB = b.time || "99:99";
  if (timeA !== timeB) return timeA < timeB ? -1 : 1;
  return a.id - b.id;
}

// "2026-10-26" + "14:00" → "10/26 14:00"
function formatWhen(todo) {
  const parts = [];
  if (todo.date) parts.push(todo.date.slice(5).replace("-", "/"));
  if (todo.time) parts.push(todo.time);
  return parts.join(" ");
}

// 할 일 한 줄(체크칸 + 내용 + 삭제 버튼)을 만든다
function createTodoItem(todo) {
  const item = document.createElement("li");
  item.classList.toggle("done", todo.done);
  item.classList.toggle("important", Boolean(todo.important));

  const starButton = document.createElement("button");
  starButton.type = "button";
  starButton.className = "star";
  starButton.textContent = todo.important ? "★" : "☆";
  starButton.setAttribute("aria-label", "중요한 일 표시");
  starButton.setAttribute("aria-pressed", String(Boolean(todo.important)));
  starButton.addEventListener("click", function () {
    todo.important = !todo.important;
    saveTodos();
    render();
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.addEventListener("change", function () {
    todo.done = checkbox.checked;
    saveTodos();
    render();
  });

  const label = document.createElement("span");
  label.textContent = todo.text;

  const when = document.createElement("small");
  when.className = "when-text";
  when.textContent = formatWhen(todo);
  when.hidden = when.textContent === "";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.addEventListener("click", function () {
    todos = todos.filter(function (other) {
      return other.id !== todo.id;
    });
    saveTodos();
    render();
  });

  item.append(starButton, checkbox, label, when, deleteButton);
  return item;
}

// 화면을 할 일 모음에 맞게 다시 그린다
function render() {
  list.replaceChildren(...todos.slice().sort(compareTodos).map(createTodoItem));
  emptyMessage.hidden = todos.length > 0;
  const remaining = todos.filter(function (todo) {
    return !todo.done;
  }).length;
  remainingCount.textContent = "남은 할 일 " + remaining + "개";
}

// [추가] 버튼: 입력칸의 글을 목록에 넣고 입력칸을 비운다
addButton.addEventListener("click", function () {
  const text = input.value.trim();
  if (text === "") {
    input.focus();
    return;
  }
  todos.push({
    id: Date.now() + Math.random(),
    text: text,
    done: false,
    important: false,
    date: dateInput.value,
    time: timeInput.value,
  });
  saveTodos();
  input.value = "";
  dateInput.value = "";
  timeInput.value = "";
  input.focus();
  render();
});

render();
