const input = document.getElementById("todo-input");
const addButton = document.getElementById("add-button");
const list = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const remainingCount = document.getElementById("remaining-count");

const STORAGE_KEY = "todos";

// 할 일 모음: { id, text, done }
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

// 할 일 한 줄(체크칸 + 내용 + 삭제 버튼)을 만든다
function createTodoItem(todo) {
  const item = document.createElement("li");
  item.classList.toggle("done", todo.done);

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

  item.append(checkbox, label, deleteButton);
  return item;
}

// 화면을 할 일 모음에 맞게 다시 그린다
function render() {
  list.replaceChildren(...todos.map(createTodoItem));
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
  todos.push({ id: Date.now() + Math.random(), text: text, done: false });
  saveTodos();
  input.value = "";
  input.focus();
  render();
});

render();
