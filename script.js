const input = document.getElementById("todo-input");
const priorityInput = document.getElementById("todo-priority");
const categoryInput = document.getElementById("todo-category");
const categoryOptions = document.getElementById("category-options");
const searchInput = document.getElementById("search-input");
const progressLabel = document.getElementById("progress-label");
const progressTrack = document.getElementById("progress-track");
const progressFill = document.getElementById("progress-fill");
const title = document.querySelector("h1");
const listTabs = document.getElementById("list-tabs");
const themeToggle = document.getElementById("theme-toggle");
const statusButtons = document.querySelectorAll("[data-status]");
const statusGroup = document.querySelector(".status-filters");
const categoryFilter = document.getElementById("category-filter");
const dateInput = document.getElementById("todo-date");
const timeInput = document.getElementById("todo-time");
const addButton = document.getElementById("add-button");
const list = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const remainingCount = document.getElementById("remaining-count");

const STORAGE_KEY = "todos"; // 목록이 하나였을 때 쓰던 저장 키 (예전 할 일을 옮겨 올 때만 읽는다)
const LISTS_KEY = "lists";
const THEME_KEY = "theme";

// 할 일 모음: { id, text, done, priority, category, date, time } (priority는 high·mid·low, category·date·time은 비어 있을 수 있다)
const PRIORITY_LABELS = { high: "높음", mid: "중간", low: "낮음" };

// 처음 열었을 때 들어 있는 예시 목록: [내용, 카테고리, 우선순위]
const SEED_LISTS = [
  { name: "오늘 할 일", items: [] },
  {
    name: "여행용",
    items: [
      ["여권", "서류", "high"],
      ["항공권·숙소 예약 확인", "서류", "high"],
      ["환전·카드 챙기기", "서류", "high"],
      ["충전기", "전자기기", "mid"],
      ["보조배터리", "전자기기", "mid"],
      ["멀티 어댑터", "전자기기", "low"],
      ["칫솔·치약", "세면", "mid"],
      ["세안용품", "세면", "mid"],
      ["상비약", "세면", "mid"],
      ["속옷·양말", "옷", "mid"],
      ["갈아입을 옷", "옷", "mid"],
      ["우산", "기타", "low"],
    ],
  },
  {
    name: "시험기간용",
    items: [
      ["시험 범위 정리", "공부", "high"],
      ["기출문제 풀기", "공부", "high"],
      ["오답노트 만들기", "공부", "mid"],
      ["요약 노트 한 번 더 읽기", "공부", "mid"],
      ["신분증·수험표 챙기기", "준비", "high"],
      ["필기구·계산기", "준비", "mid"],
      ["일찍 자기", "건강", "mid"],
      ["아침 먹기", "건강", "low"],
    ],
  },
  {
    name: "외출용",
    items: [
      ["지갑", "필수", "high"],
      ["휴대폰·충전기", "필수", "high"],
      ["열쇠", "필수", "high"],
      ["마스크", "건강", "mid"],
      ["우산", "날씨", "low"],
      ["이어폰", "기타", "low"],
      ["가스·전등 끄기", "집", "mid"],
    ],
  },
  {
    name: "장보기용",
    items: [
      ["우유", "식료품", "mid"],
      ["달걀", "식료품", "mid"],
      ["채소", "식료품", "mid"],
      ["과일", "식료품", "low"],
      ["빵", "식료품", "low"],
      ["휴지", "생필품", "mid"],
      ["세제", "생필품", "low"],
    ],
  },
];

// 저장된 할 일을 쓸 수 있는 모양으로 다듬는다
function normalizeTodos(saved) {
  if (!Array.isArray(saved)) return [];
  // 예전에 별(important)로 저장한 것은 우선순위로 바꿔 이어 쓴다
  return saved.map(function (todo) {
    if (!PRIORITY_LABELS[todo.priority]) {
      todo.priority = todo.important ? "high" : "mid";
    }
    delete todo.important;
    todo.category = todo.category || "";
    todo.date = todo.date || "";
    todo.time = todo.time || "";
    return todo;
  });
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

// 예시 목록을 만든다. 예전에 쓰던 할 일이 있으면 "오늘 할 일" 목록으로 옮겨 온다
function createSeedLists() {
  const legacy = normalizeTodos(readStorage(STORAGE_KEY));
  let nextId = Date.now();
  return SEED_LISTS.map(function (seed, index) {
    const seedTodos = seed.items.map(function (item) {
      nextId += 1;
      return {
        id: nextId,
        text: item[0],
        done: false,
        priority: item[2],
        category: item[1],
        date: "",
        time: "",
      };
    });
    return {
      id: "list-" + (nextId + index),
      name: seed.name,
      todos: index === 0 ? legacy : seedTodos,
    };
  });
}

// 저장해 둔 목록들을 꺼낸다 (없거나 망가졌으면 예시 목록으로 시작)
function loadLists() {
  const saved = readStorage(LISTS_KEY);
  if (saved && Array.isArray(saved.lists) && saved.lists.length > 0) {
    saved.lists.forEach(function (savedList) {
      savedList.todos = normalizeTodos(savedList.todos);
    });
    return saved;
  }
  const seeded = createSeedLists();
  return { lists: seeded, activeId: seeded[0].id };
}

const state = loadLists();
let lists = state.lists;
let activeListId = lists.some(function (item) {
  return item.id === state.activeId;
})
  ? state.activeId
  : lists[0].id;

function getActiveList() {
  return lists.find(function (item) {
    return item.id === activeListId;
  });
}

let todos = getActiveList().todos;
let editingId = null; // 고치는 중인 할 일의 id (없으면 null)
let justCheckedId = null; // 방금 체크한 할 일 (애니메이션용)
let statusFilter = "all"; // all · active · done
let selectedCategory = ""; // 빈 글자면 전체 카테고리

// 지금 목록의 할 일을 목록에 반영하고, 모든 목록을 저장한다
function saveTodos() {
  getActiveList().todos = todos;
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify({ lists: lists, activeId: activeListId }));
  } catch (error) {
    // 저장이 막혀 있어도 화면은 계속 쓸 수 있다
  }
}

// 다른 목록으로 바꾼다 (필터와 검색은 처음 상태로)
function switchList(id) {
  activeListId = id;
  todos = getActiveList().todos;
  editingId = null;
  statusFilter = "all";
  selectedCategory = "";
  searchInput.value = "";
  saveTodos();
  render();
}

// 맨 위 제목과 목록 탭을 지금 상태에 맞게 다시 그린다
function renderTabs() {
  title.textContent = getActiveList().name;
  listTabs.replaceChildren(
    ...lists.map(function (item) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "list-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(item.id === activeListId));
      tab.textContent = item.name;
      tab.addEventListener("click", function () {
        switchList(item.id);
      });
      return tab;
    })
  );
}

// 중요(높음) 먼저, 그다음 날짜 → 시간 순서로 비교한다 (날짜 없음은 맨 아래, 같은 날짜에서 시간 없음은 그날 맨 아래)
function compareTodos(a, b) {
  const importantA = a.priority === "high" ? 0 : 1;
  const importantB = b.priority === "high" ? 0 : 1;
  if (importantA !== importantB) return importantA - importantB;
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
  item.classList.add("priority-" + todo.priority);
  if (todo.id === justCheckedId) {
    item.classList.add("just-checked");
    justCheckedId = null;
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.addEventListener("change", function () {
    todo.done = checkbox.checked;
    justCheckedId = todo.done ? todo.id : null;
    saveTodos();
    render();
  });

  const label = document.createElement("span");
  label.textContent = todo.text;

  const badge = document.createElement("small");
  badge.className = "priority-badge";
  badge.textContent = PRIORITY_LABELS[todo.priority];

  const tag = document.createElement("small");
  tag.className = "category-tag";
  tag.textContent = "#" + todo.category;
  tag.hidden = todo.category === "";

  const when = document.createElement("small");
  when.className = "when-text";
  when.textContent = formatWhen(todo);
  when.hidden = when.textContent === "";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "수정";
  editButton.addEventListener("click", function () {
    editingId = todo.id;
    render();
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.addEventListener("click", function () {
    todos = todos.filter(function (other) {
      return other.id !== todo.id;
    });
    if (editingId === todo.id) editingId = null;
    saveTodos();
    render();
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(editButton, deleteButton);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.append(badge, tag, when);

  item.append(checkbox, label, actions, meta);
  return item;
}

// 고치는 중인 줄: 입력칸들 + [저장] [취소]
function createEditItem(todo) {
  const item = document.createElement("li");
  item.classList.add("editing");

  const form = document.createElement("form");
  form.className = "edit-form";

  const textField = document.createElement("input");
  textField.type = "text";
  textField.value = todo.text;
  textField.setAttribute("aria-label", "할 일 내용");

  const prioritySelect = document.createElement("select");
  prioritySelect.setAttribute("aria-label", "우선순위");
  Object.keys(PRIORITY_LABELS).forEach(function (key) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = PRIORITY_LABELS[key];
    prioritySelect.append(option);
  });
  prioritySelect.value = todo.priority;

  const categoryField = document.createElement("input");
  categoryField.type = "text";
  categoryField.value = todo.category;
  categoryField.setAttribute("list", "category-options");
  categoryField.setAttribute("placeholder", "카테고리");
  categoryField.setAttribute("aria-label", "카테고리");

  const dateField = document.createElement("input");
  dateField.type = "date";
  dateField.value = todo.date;
  dateField.setAttribute("aria-label", "마감 날짜");

  const timeField = document.createElement("input");
  timeField.type = "time";
  timeField.value = todo.time;
  timeField.setAttribute("aria-label", "마감 시간");

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "저장";
  saveButton.addEventListener("click", function () {
    const text = textField.value.trim();
    if (text === "") {
      textField.focus();
      return;
    }
    todo.text = text;
    todo.priority = prioritySelect.value;
    todo.category = categoryField.value.trim().replace(/^#/, "");
    todo.date = dateField.value;
    todo.time = timeField.value;
    editingId = null;
    saveTodos();
    render();
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "취소";
  cancelButton.addEventListener("click", function () {
    editingId = null;
    render();
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(saveButton, cancelButton);

  form.append(textField, prioritySelect, categoryField, dateField, timeField, actions);
  item.append(form);
  return item;
}

// 쓰고 있는 카테고리 이름들 (가나다 순)
function getCategories() {
  const names = todos
    .map(function (todo) {
      return todo.category;
    })
    .filter(function (name) {
      return name !== "";
    });
  return Array.from(new Set(names)).sort();
}

// 오늘 날짜를 "2026-10-26" 모양으로 (이 기기의 시간 기준)
function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// 달성률: 오늘 마감인 할 일 기준, 오늘 마감이 없으면 전체 기준
function updateProgress() {
  const today = getTodayString();
  let target = todos.filter(function (todo) {
    return todo.date === today;
  });
  let title = "오늘 달성률";
  if (target.length === 0) {
    target = todos;
    title = "전체 달성률";
  }
  const done = target.filter(function (todo) {
    return todo.done;
  }).length;
  const percent = target.length === 0 ? 0 : Math.round((done / target.length) * 100);
  progressLabel.textContent = title + " " + done + "/" + target.length + " · " + percent + "%";
  progressFill.style.width = percent + "%";
  progressTrack.setAttribute("aria-valuenow", String(percent));
}

// 지금 필터에 맞는 할 일만 골라낸다
function getVisibleTodos() {
  const query = searchInput.value.trim().toLowerCase();
  return todos.filter(function (todo) {
    if (statusFilter === "active" && todo.done) return false;
    if (statusFilter === "done" && !todo.done) return false;
    if (selectedCategory !== "" && todo.category !== selectedCategory) return false;
    if (query !== "" && !todo.text.toLowerCase().includes(query)) return false;
    return true;
  });
}

// 화면을 할 일 모음에 맞게 다시 그린다
function render() {
  renderTabs();
  const categories = getCategories();
  if (selectedCategory !== "" && !categories.includes(selectedCategory)) {
    selectedCategory = "";
  }

  const visible = getVisibleTodos().sort(compareTodos);
  list.replaceChildren(
    ...visible.map(function (todo) {
      return todo.id === editingId ? createEditItem(todo) : createTodoItem(todo);
    })
  );

  emptyMessage.hidden = visible.length > 0;
  emptyMessage.textContent =
    todos.length === 0 ? "아직 할 일이 없어요" : "조건에 맞는 할 일이 없어요";

  statusGroup.style.setProperty("--i", String(["all", "active", "done"].indexOf(statusFilter)));
  statusButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.status === statusFilter));
  });

  const allOption = new Option("전체 카테고리", "");
  categoryFilter.replaceChildren(
    allOption,
    ...categories.map(function (name) {
      return new Option("#" + name, name);
    })
  );
  categoryFilter.value = selectedCategory;

  categoryOptions.replaceChildren(
    ...categories.map(function (name) {
      const option = document.createElement("option");
      option.value = name;
      return option;
    })
  );

  const remaining = todos.filter(function (todo) {
    return !todo.done;
  }).length;
  remainingCount.textContent = "남은 할 일 " + remaining + "개";
  updateProgress();
}

statusButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    statusFilter = button.dataset.status;
    render();
  });
});

searchInput.addEventListener("input", render);

categoryFilter.addEventListener("change", function () {
  selectedCategory = categoryFilter.value;
  render();
});

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
    priority: priorityInput.value,
    category: categoryInput.value.trim().replace(/^#/, ""),
    date: dateInput.value,
    time: timeInput.value,
  });
  saveTodos();
  input.value = "";
  priorityInput.value = "mid";
  categoryInput.value = "";
  dateInput.value = "";
  timeInput.value = "";
  input.focus();
  render();
});

render();

// 다크/라이트 모드: 저장해 둔 선택이 있으면 그것을, 없으면 기기 설정을 따른다
function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "라이트 모드로 바꾸기" : "다크 모드로 바꾸기"
  );
}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(getSavedTheme() || (prefersDark ? "dark" : "light"));

themeToggle.addEventListener("click", function () {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (error) {
    // 저장이 막혀 있어도 이번 화면에서는 바뀐다
  }
});
