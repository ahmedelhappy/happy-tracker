document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".sidebar ul li");
  const mainContent = document.getElementById("main-content");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      // Remove active class from others
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Load section
      loadSection(item.dataset.section);
    });
  });

  function loadSection(section) {
    mainContent.innerHTML = `<h2>${section.toUpperCase()} View</h2>`;
    // Later: render habits based on section
  }

  // Load default view
  loadSection("day");
});
