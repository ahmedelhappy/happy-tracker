const navItems = document.querySelectorAll(".sidebar ul li");
const mainContent = document.getElementById("main-content");

let counter = 0;

let habitsArray = [
  { id: ++counter, name: "Workout", datesCompleted: [] },
  { id: ++counter, name: "Read Quran", datesCompleted: [] },
];


// Creates Div For each habit and appends it to habitContainer
function renderHabits() {
  const habitContainer = document.querySelector("#day-habits");
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  habitContainer.innerHTML = "";

  if (habitsArray.length === 0) {
    let p = document.createElement("p");
    p.textContent = "No Habit, Click + to add a new habit";
    habitContainer.append(p);
    return;
  }

  habitsArray.forEach((habit) => {
    let habitDiv = document.createElement("div");
    habitDiv.classList.add("habit");
    habitDiv.dataset.id = habit.id;

    // Check if completed today
    const isCompletedToday = habit.datesCompleted.includes(today);
    if (isCompletedToday) habitDiv.classList.add("completed");

    // [1] Check Mark
    const checkMark = document.createElement("span");
    checkMark.innerText = "✅ ";
    checkMark.addEventListener("click", () => {
      if (isCompletedToday) {
        // Uncheck: remove today's date
        habit.datesCompleted = habit.datesCompleted.filter(
          (d) => d !== today
        );
      } else {
        // Check: add today's date
        habit.datesCompleted.push(today);
      }
      renderHabits(); // re-render UI
    });

    // [2] Habit Name
    const habitName = document.createElement("span");
    habitName.textContent = habit.name;

    // [3] Delete Button
    const deleteHabitBtn = document.createElement("button");
    deleteHabitBtn.textContent = "Delete";
    deleteHabitBtn.classList.add("delete-habit-btn");
    deleteHabitBtn.addEventListener("click", () => {
      habitsArray = habitsArray.filter((h) => h.id !== habit.id);
      renderHabits();
    });

    habitDiv.append(checkMark, habitName, deleteHabitBtn);
    habitContainer.append(habitDiv);
  });
}



// Load Tab When Clicking Li, and adds .active
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    loadSection(item.dataset.section);
  });
});


// Load & render Section when clicking a tab
function loadSection(section) {
  
  mainContent.innerHTML = `<h2>${section.toUpperCase()} View</h2>`;

  // HOME TAB
  if (section === "home") {
    // Basic Home Structure
    mainContent.innerHTML = `
    <h2>HOME VIEW</h2>
    <div class="day-habits" id="day-habits"></div>
    <input id="input-habit">
    <button id="add-habit-btn">+ Add Habit</button>
    `;
    
    const inputHabit = document.querySelector("#input-habit");
    habitContainer = document.querySelector("#day-habits");
    const addHabitBtn = document.getElementById("add-habit-btn");
    
    renderHabits();
    
    // Add-Habit-btn Set up
    addHabitBtn.addEventListener("click", () => {    
      const inputHabitName = inputHabit.value.trim();
      if(inputHabitName !== "") {
        let newHabitObj = {id: ++counter, name: inputHabitName, datesCompleted: [], };
        habitsArray.push(newHabitObj);
        renderHabits();
        inputHabit.value = "";
      }
      else     
        alert("Please enter a habit.");
    })

    inputHabit.addEventListener("keyup", (e) => {
      if (e.key === "Enter") addHabitBtn.click();
    });
  }
}


loadSection("home");

/*

*/
