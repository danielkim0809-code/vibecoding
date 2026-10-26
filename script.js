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
const newListButton = document.getElementById("new-list-button");
const renameListButton = document.getElementById("rename-list-button");
const deleteListButton = document.getElementById("delete-list-button");
const listForm = document.getElementById("list-form");
const listNameInput = document.getElementById("list-name-input");
const listFormCancel = document.getElementById("list-form-cancel");
const levelCard = document.getElementById("level-card");
const levelIcon = document.getElementById("level-icon");
const levelStage = document.getElementById("level-stage");
const levelNumber = document.getElementById("level-number");
const levelXp = document.getElementById("level-xp");
const levelTrack = document.getElementById("level-track");
const levelFill = document.getElementById("level-fill");
const levelNext = document.getElementById("level-next");
const levelMessage = document.getElementById("level-message");
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

// Supabase: 공개(publishable) 키만 쓴다. 비밀 키는 이 파일에 넣지 않는다.
const SUPABASE_URL = "https://bhqmekifnvgusvggwgry.supabase.co";
const SUPABASE_KEY = "sb_publishable_X2FIs9KhqjO1eAYSWxQCrQ_uPD2V-O_";

// 이 브라우저에 남겨 두는 것: 화면 설정(모드, 마지막으로 본 목록)과, 예전에 이 브라우저에 저장했던 할 일(Supabase로 옮겨 갈 때만 읽는다)
const OLD_TODOS_KEY = "todos";
const OLD_LISTS_KEY = "lists";
const ACTIVE_LIST_KEY = "activeList";
const THEME_KEY = "theme";
const TRAINER_KEY = "trainerXp"; // 경험치를 이 브라우저에도 남겨 둔다 (trainer 표가 아직 없을 때를 위해)

// 할 일 모음: { id, text, done, priority, category, date, time, createdAt } (priority는 high·mid·low, category·date·time은 비어 있을 수 있다)
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

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

// Supabase 표에 요청을 보낸다 (주소 뒤에 표 이름과 조건을 붙인다)
async function api(path, method, body) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error((method || "GET") + " " + path + " → " + response.status + " " + (await response.text()));
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// 표의 한 줄 ↔ 화면에서 쓰는 할 일
function fromRow(row) {
  return {
    id: row.id,
    text: row.text,
    done: Boolean(row.done),
    priority: PRIORITY_LABELS[row.priority] ? row.priority : "mid",
    category: row.category || "",
    date: row.due_date || "",
    time: (row.due_time || "").slice(0, 5),
    createdAt: row.created_at || "",
  };
}

function toFields(todo) {
  return {
    text: todo.text,
    done: todo.done,
    priority: todo.priority,
    category: todo.category,
    due_date: todo.date || null,
    due_time: todo.time || null,
  };
}

// 이 브라우저에 있던 예전 할 일(또는 예시 목록)을 올릴 모양으로 만든다: [{ name, todos }]
function getLocalImport() {
  const saved = readStorage(OLD_LISTS_KEY);
  if (saved && Array.isArray(saved.lists) && saved.lists.length > 0) {
    return saved.lists.map(function (item) {
      return { name: item.name, todos: normalizeTodos(item.todos) };
    });
  }
  const legacy = normalizeTodos(readStorage(OLD_TODOS_KEY));
  return SEED_LISTS.map(function (seed, index) {
    return {
      name: seed.name,
      todos:
        index === 0
          ? legacy
          : seed.items.map(function (item) {
              return { text: item[0], done: false, priority: item[2], category: item[1], date: "", time: "" };
            }),
    };
  });
}

// 표가 비어 있을 때: 목록과 할 일을 한 번에 올린다 (처음 한 번만)
async function uploadInitialData() {
  for (const item of getLocalImport()) {
    const createdLists = await api("lists", "POST", [{ name: item.name }]);
    if (item.todos.length > 0) {
      await api(
        "todos",
        "POST",
        item.todos.map(function (todo) {
          return Object.assign(toFields(todo), { list_id: createdLists[0].id });
        })
      );
    }
  }
}

// 표에서 목록과 할 일을 모두 가져와 화면용 모양으로 만든다
async function fetchLists() {
  let listRows = await api("lists?select=*&order=created_at.asc,id.asc");
  if (listRows.length === 0) {
    await uploadInitialData();
    listRows = await api("lists?select=*&order=created_at.asc,id.asc");
  }
  // 목록이 정해지지 않은 예전 할 일은 맨 앞 목록으로 옮긴다
  await api("todos?list_id=is.null", "PATCH", { list_id: listRows[0].id });
  const todoRows = await api("todos?select=*&order=created_at.asc,id.asc");
  return listRows.map(function (listRow) {
    return {
      id: listRow.id,
      name: listRow.name,
      todos: todoRows
        .filter(function (row) {
          return row.list_id === listRow.id;
        })
        .map(fromRow),
    };
  });
}

// 피카츄 진화: 할 일을 체크하면 경험치가 오르고, 60 XP마다 레벨이 오른다
const XP_PER_LEVEL = 60;
const XP_BY_PRIORITY = { high: 30, mid: 20, low: 10 };
const STAGES = [
  { minLevel: 1, name: "피츄", image: "images/pichu.webp" },
  { minLevel: 5, name: "피카츄", image: "images/pikachu.webp" },
  { minLevel: 10, name: "라이츄", image: "images/raichu.webp" },
];

let xp = 0;
let trainerId = null; // Supabase trainer 표의 줄 번호 (표가 없으면 null)
let messageTimer = null;
let effectTimer = null;

function levelOf(points) {
  return Math.floor(points / XP_PER_LEVEL) + 1;
}

function stageOf(level) {
  return STAGES.filter(function (stage) {
    return level >= stage.minLevel;
  }).pop();
}

// 경험치를 불러온다: trainer 표가 있으면 거기서, 없으면 이 브라우저에 남겨 둔 값으로
async function loadTrainer() {
  const localXp = Number(readStorage(TRAINER_KEY)) || 0;
  try {
    let rows = await api("trainer?select=*&order=id.asc&limit=1");
    if (rows.length === 0) {
      rows = await api("trainer", "POST", [{ xp: localXp }]);
    }
    trainerId = rows[0].id;
    xp = Number(rows[0].xp) || 0;
  } catch (error) {
    console.warn("trainer 표를 쓸 수 없어 경험치를 이 브라우저에만 저장해요.", error);
    trainerId = null;
    xp = localXp;
  }
}

function saveXp() {
  try {
    localStorage.setItem(TRAINER_KEY, JSON.stringify(xp));
  } catch (error) {
    // 저장이 막혀 있어도 이번 화면에서는 그대로 쓴다
  }
  if (trainerId !== null) {
    api("trainer?id=eq." + encodeURIComponent(trainerId), "PATCH", { xp: xp }).catch(function (error) {
      console.warn("경험치를 표에 저장하지 못했어요.", error);
    });
  }
}

// 카드의 단계 이름, 레벨, 경험치 막대를 지금 경험치에 맞게 그린다
function updateLevelCard() {
  const level = levelOf(xp);
  const stage = stageOf(level);
  const inLevel = xp % XP_PER_LEVEL;
  if (levelIcon.getAttribute("src") !== stage.image) levelIcon.src = stage.image;
  levelIcon.alt = stage.name;
  levelStage.textContent = stage.name;
  levelNumber.textContent = "Lv." + level;
  levelXp.textContent = inLevel + "/" + XP_PER_LEVEL + " XP";
  levelFill.style.width = Math.round((inLevel / XP_PER_LEVEL) * 100) + "%";
  levelTrack.setAttribute("aria-valuenow", String(inLevel));
  const next = STAGES.find(function (candidate) {
    return candidate.minLevel > level;
  });
  levelNext.textContent = next
    ? "Lv." + next.minLevel + "에 " + next.name + "로 진화!"
    : "최종 진화! 라이츄";
}

function showLevelMessage(text, milliseconds, kind) {
  levelMessage.textContent = text;
  levelMessage.dataset.kind = kind || "xp";
  levelMessage.hidden = false;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () {
    levelMessage.hidden = true;
  }, milliseconds);
}

// 카드를 번쩍이게 한다 (같은 효과를 연달아 보여 줄 수 있게 다시 시작한다)
function flashCard(effect) {
  levelCard.classList.remove("level-up", "evolve");
  void levelCard.offsetWidth;
  levelCard.classList.add(effect);
  clearTimeout(effectTimer);
  effectTimer = setTimeout(function () {
    levelCard.classList.remove("level-up", "evolve");
  }, 1300);
}

// 경험치를 더하거나 뺀다 (0 아래로는 내려가지 않는다)
function changeXp(delta) {
  const before = xp;
  const oldLevel = levelOf(before);
  const oldStage = stageOf(oldLevel);
  xp = Math.max(0, xp + delta);
  const change = xp - before;
  if (change === 0) return;
  saveXp();
  updateLevelCard();
  const newLevel = levelOf(xp);
  const newStage = stageOf(newLevel);
  if (change < 0) {
    showLevelMessage(change + " XP", 1500, "xp");
  } else if (newStage !== oldStage) {
    flashCard("evolve");
    showLevelMessage("진화했다! " + oldStage.name + " → " + newStage.name + " ⚡", 4500, "evolve");
  } else if (newLevel > oldLevel) {
    flashCard("level-up");
    showLevelMessage("레벨 업! Lv." + newLevel + " ⚡", 3500, "level-up");
  } else {
    showLevelMessage("+" + change + " XP ⚡", 1500, "xp");
  }
}

let lists = [];
let activeListId = null;
let todos = [];
let loadState = "loading"; // loading · ready · error
let loadErrorDetail = ""; // 불러오지 못했을 때의 이유 (화면에 짧게 보여 준다)
let listFormMode = null; // 이름 입력칸이 열려 있으면 "new" 또는 "rename"
let editingId = null; // 고치는 중인 할 일의 id (없으면 null)
let justCheckedId = null; // 방금 체크한 할 일 (애니메이션용)
let statusFilter = "all"; // all · active · done
let selectedCategory = ""; // 빈 글자면 전체 카테고리

function getActiveList() {
  return lists.find(function (item) {
    return String(item.id) === String(activeListId);
  });
}

// 지금 목록의 할 일을 새 모음으로 바꾼다
function setTodos(next) {
  getActiveList().todos = next;
  todos = next;
}

// 가져온 목록들로 화면 상태를 맞춘다 (마지막으로 본 목록을 다시 연다)
function applyLists(fetched) {
  lists = fetched;
  const remembered = readStorage(ACTIVE_LIST_KEY);
  const keep = lists.some(function (item) {
    return String(item.id) === String(activeListId || remembered);
  });
  activeListId = keep ? activeListId || remembered : lists[0].id;
  todos = getActiveList().todos;
}

function rememberActiveList() {
  try {
    localStorage.setItem(ACTIVE_LIST_KEY, JSON.stringify(activeListId));
  } catch (error) {
    // 저장이 막혀 있어도 이번 화면에서는 그대로 쓴다
  }
}

// 저장에 실패했을 때: 알려 주고, 표의 실제 내용으로 화면을 다시 맞춘다
async function recover(message, error) {
  console.error(error);
  window.alert(message + " 인터넷 연결을 확인해 주세요.");
  try {
    applyLists(await fetchLists());
  } catch (fetchError) {
    console.error(fetchError);
  }
  render();
}

// 다른 목록으로 바꾼다 (필터와 검색은 처음 상태로)
function switchList(id) {
  activeListId = id;
  todos = getActiveList().todos;
  editingId = null;
  statusFilter = "all";
  selectedCategory = "";
  searchInput.value = "";
  closeListForm();
  rememberActiveList();
  render();
}

// 목록 이름 입력칸을 열고 닫는다
function openListForm(mode) {
  listFormMode = mode;
  listNameInput.value = mode === "rename" ? getActiveList().name : "";
  listForm.hidden = false;
  listNameInput.focus();
  listNameInput.select();
}

function closeListForm() {
  listFormMode = null;
  listForm.hidden = true;
}

newListButton.addEventListener("click", function () {
  openListForm("new");
});

renameListButton.addEventListener("click", function () {
  openListForm("rename");
});

listFormCancel.addEventListener("click", closeListForm);

// [확인]: 새 목록을 만들거나 지금 목록의 이름을 바꾼다 (이름이 비었으면 아무것도 안 한다)
listForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const name = listNameInput.value.trim();
  if (name === "" || loadState !== "ready") {
    listNameInput.focus();
    return;
  }
  if (listFormMode === "rename") {
    const target = getActiveList();
    target.name = name;
    closeListForm();
    render();
    try {
      await api("lists?id=eq." + encodeURIComponent(target.id), "PATCH", { name: name });
    } catch (error) {
      await recover("이름을 저장하지 못했어요.", error);
    }
    return;
  }
  try {
    const rows = await api("lists", "POST", [{ name: name }]);
    const created = { id: rows[0].id, name: rows[0].name, todos: [] };
    lists.push(created);
    switchList(created.id);
  } catch (error) {
    await recover("새 목록을 만들지 못했어요.", error);
  }
});

// [목록 삭제]: 확인을 받고 지운다 (하나만 남으면 지울 수 없다)
deleteListButton.addEventListener("click", async function () {
  if (loadState !== "ready" || lists.length <= 1) return;
  const target = getActiveList();
  if (!window.confirm("'" + target.name + "' 목록과 안의 할 일이 모두 지워져요. 지울까요?")) {
    return;
  }
  try {
    await api("todos?list_id=eq." + encodeURIComponent(target.id), "DELETE");
    await api("lists?id=eq." + encodeURIComponent(target.id), "DELETE");
  } catch (error) {
    await recover("목록을 지우지 못했어요.", error);
    return;
  }
  const index = lists.indexOf(target);
  lists.splice(index, 1);
  closeListForm();
  switchList(lists[Math.min(index, lists.length - 1)].id);
});

// 맨 위 제목과 목록 탭을 지금 상태에 맞게 다시 그린다
function renderTabs() {
  const active = getActiveList();
  if (active) title.textContent = active.name;
  deleteListButton.disabled = loadState !== "ready" || lists.length <= 1;
  listTabs.replaceChildren(
    ...lists.map(function (item) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "list-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(String(item.id) === String(activeListId)));
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
  const createdA = a.createdAt || "";
  const createdB = b.createdAt || "";
  if (createdA !== createdB) return createdA < createdB ? -1 : 1;
  return String(a.id) < String(b.id) ? -1 : 1;
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
    changeXp((todo.done ? 1 : -1) * XP_BY_PRIORITY[todo.priority]);
    render();
    api("todos?id=eq." + encodeURIComponent(todo.id), "PATCH", { done: todo.done }).catch(function (error) {
      recover("체크 상태를 저장하지 못했어요.", error);
    });
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
    setTodos(
      todos.filter(function (other) {
        return other.id !== todo.id;
      })
    );
    if (editingId === todo.id) editingId = null;
    render();
    api("todos?id=eq." + encodeURIComponent(todo.id), "DELETE").catch(function (error) {
      recover("할 일을 지우지 못했어요.", error);
    });
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
    render();
    api("todos?id=eq." + encodeURIComponent(todo.id), "PATCH", toFields(todo)).catch(function (error) {
      recover("수정한 내용을 저장하지 못했어요.", error);
    });
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
  updateLevelCard();
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
  if (loadState === "loading") {
    emptyMessage.textContent = "불러오는 중이에요...";
  } else if (loadState === "error") {
    emptyMessage.textContent =
      "불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요. (이유: " + loadErrorDetail + ")";
  } else {
    emptyMessage.textContent =
      todos.length === 0 ? "아직 할 일이 없어요" : "조건에 맞는 할 일이 없어요";
  }

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

// [추가] 버튼: 입력칸의 글을 표에 넣고, 들어간 뒤에 목록에 보여 준다
addButton.addEventListener("click", async function () {
  const text = input.value.trim();
  if (text === "") {
    input.focus();
    return;
  }
  if (loadState !== "ready") return;
  const target = getActiveList();
  const newTodo = {
    text: text,
    done: false,
    priority: priorityInput.value,
    category: categoryInput.value.trim().replace(/^#/, ""),
    date: dateInput.value,
    time: timeInput.value,
  };
  addButton.disabled = true;
  try {
    const rows = await api("todos", "POST", [Object.assign(toFields(newTodo), { list_id: target.id })]);
    target.todos.push(fromRow(rows[0]));
    input.value = "";
    priorityInput.value = "mid";
    categoryInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    input.focus();
  } catch (error) {
    await recover("할 일을 저장하지 못했어요.", error);
  } finally {
    addButton.disabled = false;
  }
  render();
});

// 처음 화면: 표에서 불러오는 동안은 안내 글만 보여 준다
async function start() {
  await loadTrainer();
  try {
    applyLists(await fetchLists());
    loadState = "ready";
  } catch (error) {
    console.error(error);
    loadState = "error";
    loadErrorDetail = String(error.message || error).slice(0, 200);
  }
  render();
}

render();
start();

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

// 대표 사진: 바깥쪽 흰 배경만 투명하게 지운다 (사진의 색은 건드리지 않는다)
function removeWhiteBackground(photo) {
  const source = new Image();
  source.crossOrigin = "anonymous";
  source.onload = function () {
    try {
      const scale = Math.min(1, 640 / source.naturalWidth);
      const width = Math.round(source.naturalWidth * scale);
      const height = Math.round(source.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(source, 0, 0, width, height);
      const image = context.getImageData(0, 0, width, height); // 사진을 읽을 수 없으면 여기서 멈춘다
      const data = image.data;

      const isWhite = function (pixel) {
        const at = pixel * 4;
        return data[at + 3] > 0 && data[at] >= 235 && data[at + 1] >= 235 && data[at + 2] >= 235;
      };

      // 사진 가장자리에서 시작해, 이어져 있는 흰색만 배경으로 본다
      const isBackground = new Uint8Array(width * height);
      const queue = [];
      const push = function (pixel) {
        if (!isBackground[pixel] && isWhite(pixel)) {
          isBackground[pixel] = 1;
          queue.push(pixel);
        }
      };
      for (let x = 0; x < width; x += 1) {
        push(x);
        push((height - 1) * width + x);
      }
      for (let y = 0; y < height; y += 1) {
        push(y * width);
        push(y * width + width - 1);
      }
      for (let head = 0; head < queue.length; head += 1) {
        const pixel = queue[head];
        const x = pixel % width;
        if (x > 0) push(pixel - 1);
        if (x < width - 1) push(pixel + 1);
        if (pixel >= width) push(pixel - width);
        if (pixel < width * (height - 1)) push(pixel + width);
      }

      // 배경은 투명하게, 배경과 맞닿은 밝은 가장자리는 반쯤 투명하게 (색은 그대로, 투명도만 바꾼다)
      const hasBackgroundNeighbor = function (pixel) {
        const x = pixel % width;
        return (
          (x > 0 && isBackground[pixel - 1]) ||
          (x < width - 1 && isBackground[pixel + 1]) ||
          (pixel >= width && isBackground[pixel - width]) ||
          (pixel < width * (height - 1) && isBackground[pixel + width])
        );
      };
      for (let pixel = 0; pixel < width * height; pixel += 1) {
        const at = pixel * 4;
        if (isBackground[pixel]) {
          data[at + 3] = 0;
        } else if (hasBackgroundNeighbor(pixel)) {
          const lightest = Math.min(data[at], data[at + 1], data[at + 2]);
          if (lightest > 200) {
            data[at + 3] = Math.round((255 * (255 - lightest)) / 55);
          }
        }
      }
      context.putImageData(image, 0, 0);
      photo.src = canvas.toDataURL("image/png");
      photo.classList.add("cutout");
    } catch (error) {
      console.warn("대표 사진의 배경을 지우지 못해 원래 사진을 보여 줘요.", error);
    }
  };
  source.src = photo.src;
}

removeWhiteBackground(document.querySelector(".hero-photo"));
