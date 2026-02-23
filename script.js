// Mobile nav + dropdown toggles (tiny, no libraries)

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

const menuBtn = qs("#menuBtn");
const nav = qs("#nav");

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
  });
}

qsa("[data-drop]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const parent = btn.closest(".drop");
    if (!parent) return;
    const isOpen = parent.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
});

// close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  const insideDrop = e.target.closest(".drop");
  if (!insideDrop) qsa(".drop.open").forEach(d => d.classList.remove("open"));
});
