const navItems = document.querySelectorAll(".sidebar ul li");
const mainContent = document.getElementById("main-content");
const nightModeBtn = document.createElement('button');

let counter = 0;
let habitsArray = [];
let trashArray = [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let useRollingWeek = false;

// ====== NIGHT MODE ======
nightModeBtn.id = 'toggle-night-mode';
nightModeBtn.textContent = '🌙';
nightModeBtn.classList.add('night-mode-btn');
document.querySelector('.sidebar').appendChild(nightModeBtn);

function toggleNightMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  nightModeBtn.textContent = isDark ? '☀️' : '🌙';
}

nightModeBtn.addEventListener('click', toggleNightMode);

// Restore previous mode
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  nightModeBtn.textContent = '☀️';
}

// ====== UTILITIES ======
function getToday() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

function getWeekDates(referenceDate = new Date()) {
  if (useRollingWeek) {
    const dates = [];
    const todayISO = getToday();
    const todayDate = new Date(todayISO);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      d.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }

  const dayOfWeek = referenceDate.getDay();
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - ((dayOfWeek + 6) % 7));
  let dates = [];
  for (let i = 0; i < 7; i++) {
    let d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function getMonthDates(year, month) {
  const dates = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// ====== STORAGE ======
function saveToStorage() {
  localStorage.setItem("habits", JSON.stringify(habitsArray));
  localStorage.setItem("trash", JSON.stringify(trashArray));
  localStorage.setItem("counter", counter);
  localStorage.setItem("activeSection", document.querySelector(".sidebar ul li.active")?.dataset.section || "home");
  const inputField = document.getElementById("input-habit");
  if (inputField) localStorage.setItem("pendingInput", inputField.value);
}

function loadFromStorage() {
  habitsArray = JSON.parse(localStorage.getItem("habits")) || [];
  trashArray = JSON.parse(localStorage.getItem("trash")) || [];
  counter = Number(localStorage.getItem("counter")) || 0;
}

// ====== RENDER HOME ======
function renderHabits() {
  const habitContainer = document.querySelector("#day-habits");
  const today = getToday();
  if (!habitContainer) return;

  habitContainer.innerHTML = "";

  if (habitsArray.length === 0) {
    let p = document.createElement("p");
    p.classList.add("no-habits");
    p.textContent = "No habits yet. Click + to add.";
    habitContainer.append(p);
    return;
  }

  // Order habits: incomplete first
  let orderedHabits = [...habitsArray].sort((a, b) => {
    const aDone = a.datesCompleted.includes(today);
    const bDone = b.datesCompleted.includes(today);
    return aDone - bDone;
  });

  orderedHabits.forEach((habit) => {
    const habitDiv = document.createElement("div");
    habitDiv.classList.add("habit");
    habitDiv.draggable = true;
    habitDiv.dataset.id = habit.id;

    const isCompletedToday = habit.datesCompleted.includes(today);
    if (isCompletedToday) habitDiv.classList.add("completed");

    const checkMark = document.createElement("span");
    checkMark.innerText = isCompletedToday ? "✅" : "⬜";
    checkMark.style.cursor = "pointer";
    checkMark.addEventListener("click", () => {
      habitDiv.classList.add("habit-check-anim");
      setTimeout(() => {
        toggleHabit(habit.id, today);
        renderHabits();
      }, 250); // Wait until animation finishes
    });


    const habitName = document.createElement("span");
    habitName.textContent = habit.name;
    habitName.classList.add("habit-name");

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-habit-btn");
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Move "${habit.name}" to Trash?`)) {
        moveToTrash(habit.id);
        renderHabits();
      }
    });

    habitDiv.append(checkMark, habitName, deleteBtn);
    habitContainer.append(habitDiv);
  });

  enableDragAndDrop();
}

// ====== DRAG & DROP ======
function enableDragAndDrop() {
  const container = document.querySelector("#day-habits");
  let dragged;
  let dropLine = document.createElement("div");
  dropLine.classList.add("habit-drop-line");
  dropLine.style.display = "none";
  container.appendChild(dropLine);

  container.querySelectorAll(".habit").forEach((el) => {
    el.addEventListener("dragstart", () => {
      dragged = el;
      setTimeout(() => el.classList.add("dragging"), 0);
      dropLine.style.display = "block";
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      dropLine.style.display = "none";
      saveOrder();
    });
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
      container.appendChild(dragged);
      dropLine.style.top = container.lastElementChild.getBoundingClientRect().bottom - container.getBoundingClientRect().top + "px";
    } else {
      container.insertBefore(dragged, afterElement);
      dropLine.style.top = afterElement.getBoundingClientRect().top - container.getBoundingClientRect().top + "px";
    }
  });
}


function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".habit:not(.dragging)")];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function saveOrder() {
  const ids = [...document.querySelectorAll("#day-habits .habit")].map((el) => Number(el.dataset.id));
  habitsArray.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  saveToStorage();
}

// ====== RENDER WEEK ======
function renderWeekView() {
  const weekDates = getWeekDates(currentDate);

  mainContent.innerHTML = `
    <div class="week-header">
      <button id="prev-week">⬅️</button>
      <h2>${useRollingWeek ? "Last 7 Days" : `Week of ${weekDates[0]} - ${weekDates[6]}`}</h2>
      <button id="next-week">➡️</button>
      <button id="toggle-week-mode">${useRollingWeek ? "Switch to Week View" : "Switch to Last 7 Days"}</button>
    </div>
    <table class="week-table">
      <thead>
        <tr>
          <th>Day</th>
          ${habitsArray.map(h => `<th>${h.name}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${weekDates.map(date => {
          const dayName = new Date(date).toLocaleDateString("default", { weekday: "short" });
          return `
            <tr>
              <td class="day-label">${dayName}<br>${date.slice(8)}</td>
              ${habitsArray.map(habit => {
                const done = habit.datesCompleted.includes(date);
                return `<td class="habit-cell" data-id="${habit.id}" data-date="${date}">${done ? "✅" : "⬜"}</td>`;
              }).join("")}
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  document.querySelectorAll(".habit-cell").forEach(cell => {
    cell.addEventListener("click", () => {
      const id = Number(cell.dataset.id);
      const date = cell.dataset.date;
      toggleHabit(id, date);
      renderWeekView();
    });
  });

  document.getElementById("prev-week").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderWeekView();
  });

  document.getElementById("next-week").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderWeekView();
  });

  document.getElementById("toggle-week-mode").addEventListener("click", () => {
    useRollingWeek = !useRollingWeek;
    renderWeekView();
  });
}


// ====== RENDER MONTH ======
function renderMonthView() {
  const monthDates = getMonthDates(currentYear, currentMonth);

  mainContent.innerHTML = `
    <div class="month-header">
      <button id="prev-month">⬅️</button>
      <h2>${new Date(currentYear, currentMonth).toLocaleString("default", { month: "long", year: "numeric" })}</h2>
      <button id="next-month">➡️</button>
    </div>

    <div class="month-grid">
      <div class="day-name">Mon</div>
      <div class="day-name">Tue</div>
      <div class="day-name">Wed</div>
      <div class="day-name">Thu</div>
      <div class="day-name">Fri</div>
      <div class="day-name">Sat</div>
      <div class="day-name">Sun</div>
    </div>
  `;

  if (habitsArray.length === 0) {
    mainContent.innerHTML += `<p class="no-habits">No habits to display.</p>`;
    return;
  }

  const grid = mainContent.querySelector(".month-grid");
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const leadingEmptyCells = (firstDay + 6) % 7;
  for (let i = 0; i < leadingEmptyCells; i++) {
    const empty = document.createElement("div");
    empty.classList.add("month-cell", "empty");
    grid.append(empty);
  }

  monthDates.forEach(date => {
    const cell = document.createElement("div");
    cell.classList.add("month-cell");

    const dayNum = document.createElement("div");
    dayNum.classList.add("day-number");
    dayNum.textContent = date.slice(8);

    cell.append(dayNum);

    habitsArray.forEach(habit => {
      const habitDiv = document.createElement("div");
      habitDiv.classList.add("habit-entry");

      const done = habit.datesCompleted.includes(date);
      habitDiv.innerHTML = `${done ? "✅" : "⬜"} ${habit.name}`;

      habitDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleHabit(habit.id, date);
        renderMonthView();
      });

      cell.append(habitDiv);
    });

    grid.append(cell);
  });

  document.getElementById("prev-month").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderMonthView();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderMonthView();
  });
}

// ====== RENDER TRASH ======
function renderTrash() {
  mainContent.innerHTML = `<h2>Trash</h2>`;
  if (trashArray.length === 0) {
    mainContent.innerHTML += `<p class="no-habits">Trash is empty</p>`;
    return;
  }

  trashArray.forEach((habit) => {
    const div = document.createElement("div");
    div.classList.add("habit");
    div.innerHTML = `
      <span class="habit-name">${habit.name}</span>
      <div>
        <button class="restore-btn">Restore</button>
        <button class="delete-habit-btn">Delete</button>
      </div>
    `;
    div.querySelector(".restore-btn").addEventListener("click", () => restoreHabit(habit.id));
    div.querySelector(".delete-habit-btn").addEventListener("click", () => deleteForever(habit.id));
    mainContent.append(div);
  });
}

// ====== RENDER REPORT ======
function renderReport() {
  let totalHabits = habitsArray.length;
  let totalCompletions = habitsArray.reduce((acc, h) => acc + h.datesCompleted.length, 0);
  let completionRate = totalHabits === 0 ? 0 : ((totalCompletions / totalHabits) * 100).toFixed(1);

  mainContent.innerHTML = `
    <h2>Report</h2>
    <div class="stats">
      <p><strong>Total Habits:</strong> ${totalHabits}</p>
      <p><strong>Total Completions:</strong> ${totalCompletions}</p>
      <p><strong>Completion Rate:</strong> ${completionRate}%</p>
    </div>
  `;
}

// ====== ACTIONS ======
function toggleHabit(id, date) {
  const habit = habitsArray.find(h => h.id === id);
  if (!habit) return;

  if (habit.datesCompleted.includes(date)) {
    habit.datesCompleted = habit.datesCompleted.filter(d => d !== date);
  } else {
    habit.datesCompleted.push(date);
  }
  saveToStorage();
}

function addHabit(name) {
  habitsArray.push({ id: ++counter, name, datesCompleted: [] });
  saveToStorage();
  renderHabits();
}

function moveToTrash(id) {
  const habit = habitsArray.find(h => h.id === id);
  if (!habit) return;
  habitsArray = habitsArray.filter(h => h.id !== id);
  trashArray.push(habit);
  saveToStorage();
}

function restoreHabit(id) {
  const habit = trashArray.find(h => h.id === id);
  if (!habit) return;
  trashArray = trashArray.filter(h => h.id !== id);
  habitsArray.push(habit);
  saveToStorage();
  renderTrash();
}

function deleteForever(id) {
  trashArray = trashArray.filter(h => h.id !== id);
  saveToStorage();
  renderTrash();
}

// ====== NAVIGATION ======
function loadSection(section) {
  mainContent.innerHTML = `<h2>${section.toUpperCase()} View</h2>`;

  if (section === "home") {
    mainContent.innerHTML = `
      <h2>Today</h2>
      <div class="day-habits" id="day-habits"></div>
      <input id="input-habit" placeholder="Enter a habit">
      <button id="add-habit-btn">+ Add Habit</button>
    `;

    const savedInput = localStorage.getItem("pendingInput");
    if (savedInput) document.getElementById("input-habit").value = savedInput;

    renderHabits();

    const addHabitBtn = document.getElementById("add-habit-btn");
    addHabitBtn.addEventListener("click", () => {
      const input = document.getElementById("input-habit");
      const value = input.value.trim();
      if (value === "") return alert("Enter a habit!");
      if (habitsArray.some(h => h.name.toLowerCase() === value.toLowerCase()))
        return alert("This habit already exists!");
      addHabit(value);
      input.value = "";
      localStorage.removeItem("pendingInput");
      input.focus();
    });

    document.getElementById("input-habit").addEventListener("input", () => saveToStorage());
    document.getElementById("input-habit").addEventListener("keyup", (e) => {
      if (e.key === "Enter") addHabitBtn.click();
    });
  }

  if (section === "week") renderWeekView();
  if (section === "month") renderMonthView();
  if (section === "report") renderReport();
  if (section === "trash") renderTrash();

  localStorage.setItem("activeSection", section);
}

// ====== INIT ======
loadFromStorage();
const lastSection = localStorage.getItem("activeSection") || "home";

// Fix double-active issue
navItems.forEach(i => i.classList.remove("active"));
const activeNav = document.querySelector(`.sidebar ul li[data-section="${lastSection}"]`);
if (activeNav) activeNav.classList.add("active");

loadSection(lastSection);

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    loadSection(item.dataset.section);
  });
});
