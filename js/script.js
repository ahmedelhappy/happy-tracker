const navItems = document.querySelectorAll(".sidebar ul li");
const mainContent = document.getElementById("main-content");

let counter = 0;
let habitsArray = [];
let trashArray = [];
let currentMonth = new Date().getMonth(); // 0-based
let currentYear = new Date().getFullYear();

// ====== UTILITIES ======
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  let dates = [];
  for (let i = 0; i < 7; i++) {
    let d = new Date(monday);
    d.setDate(monday.getDate() + i);
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
  habitContainer.innerHTML = "";

  if (habitsArray.length === 0) {
    let p = document.createElement("p");
    p.classList.add("no-habits");
    p.textContent = "No habits yet. Click + to add.";
    habitContainer.append(p);
    return;
  }

  habitsArray.forEach((habit) => {
    const habitDiv = document.createElement("div");
    habitDiv.classList.add("habit");
    habitDiv.dataset.id = habit.id;

    const isCompletedToday = habit.datesCompleted.includes(today);
    if (isCompletedToday) habitDiv.classList.add("completed");

    const checkMark = document.createElement("span");
    checkMark.innerText = isCompletedToday ? "✅" : "⬜";
    checkMark.style.cursor = "pointer";
    checkMark.addEventListener("click", () => toggleHabit(habit.id, today));

    const habitName = document.createElement("span");
    habitName.textContent = habit.name;
    habitName.classList.add("habit-name");

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-habit-btn");
    deleteBtn.addEventListener("click", () => moveToTrash(habit.id));

    habitDiv.append(checkMark, habitName, deleteBtn);
    habitContainer.append(habitDiv);
  });
}

// ====== RENDER WEEK ======
function renderWeekView() {
  const weekDates = getWeekDates();
  mainContent.innerHTML = `<h2>Week View</h2>`;

  if (habitsArray.length === 0) {
    mainContent.innerHTML += `<p class="no-habits">No habits to display.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.classList.add("week-table");

  const thead = document.createElement("thead");

  // ---- WEEKDAY NAMES ROW ----
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const nameRow = document.createElement("tr");
  nameRow.innerHTML = `<th></th>` + weekdayNames.map(n => `<th>${n}</th>`).join("");
  thead.append(nameRow);

  // ---- DATES ROW ----
  const headRow = document.createElement("tr");
  headRow.innerHTML = `<th>Habit</th>` + weekDates.map(d => `<th>${d.slice(5)}</th>`).join("");
  thead.append(headRow);

  table.append(thead);

  const tbody = document.createElement("tbody");
  habitsArray.forEach(habit => {
    const row = document.createElement("tr");
    let cells = `<td>${habit.name}</td>`;
    weekDates.forEach(date => {
      const done = habit.datesCompleted.includes(date);
      cells += `<td class="week-cell" data-habit="${habit.id}" data-date="${date}">${done ? "✅" : "⬜"}</td>`;
    });
    row.innerHTML = cells;
    tbody.append(row);
  });

  table.append(tbody);
  mainContent.append(table);

  document.querySelectorAll(".week-cell").forEach(cell => {
    cell.addEventListener("click", () => {
      const habitId = Number(cell.dataset.habit);
      const date = cell.dataset.date;
      toggleHabit(habitId, date);
      renderWeekView();
    });
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
    <div class="month-grid"></div>
  `;

  if (habitsArray.length === 0) {
    mainContent.innerHTML += `<p class="no-habits">No habits to display.</p>`;
    return;
  }

  const grid = mainContent.querySelector(".month-grid");

  // Weekday headers (Mon - Sun)
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  weekdays.forEach(day => {
    const headerCell = document.createElement("div");
    headerCell.classList.add("month-cell", "month-header-cell");
    headerCell.textContent = day;
    grid.append(headerCell);
  });

  // Align with weekday (empty cells before 1st day)
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const leadingEmptyCells = (firstDay + 6) % 7; // Monday-based offset
  for (let i = 0; i < leadingEmptyCells; i++) {
    const empty = document.createElement("div");
    empty.classList.add("month-cell", "empty");
    grid.append(empty);
  }

  // Fill days with habits
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

  // Navigation
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
  renderHabits();
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
  renderHabits();
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
      input.focus();
    });

    document.getElementById("input-habit").addEventListener("keyup", (e) => {
      if (e.key === "Enter") addHabitBtn.click();
    });
  }

  if (section === "week") renderWeekView();
  if (section === "month") renderMonthView();
  if (section === "report") renderReport();
  if (section === "trash") renderTrash();
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    loadSection(item.dataset.section);
  });
});

// ====== INIT ======
loadFromStorage();
loadSection("home");
