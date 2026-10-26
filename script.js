const input = document.getElementById("todo-input");
const addButton = document.getElementById("add-button");
const list = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");

// 목록이 비었으면 안내 글을 보이고, 아니면 숨긴다
function updateEmptyMessage() {
  emptyMessage.hidden = list.children.length > 0;
}

// 할 일 한 줄(체크칸 + 내용 + 삭제 버튼)을 만든다
function createTodoItem(text) {
  const item = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.addEventListener("change", function () {
    item.classList.toggle("done", checkbox.checked);
  });

  const label = document.createElement("span");
  label.textContent = text;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.addEventListener("click", function () {
    item.remove();
    updateEmptyMessage();
  });

  item.append(checkbox, label, deleteButton);
  return item;
}

// [추가] 버튼: 입력칸의 글을 목록에 넣고 입력칸을 비운다
addButton.addEventListener("click", function () {
  const text = input.value.trim();
  if (text === "") {
    input.focus();
    return;
  }
  list.append(createTodoItem(text));
  input.value = "";
  input.focus();
  updateEmptyMessage();
});

updateEmptyMessage();
