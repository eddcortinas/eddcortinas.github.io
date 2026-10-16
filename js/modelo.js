/* =========================================================
   EDD Cortinas — scripts das páginas de cada modelo
   (versão enxuta do main.js: sem simulador nem formulário)
   ========================================================= */

const CONFIG = {
  WHATSAPP: "5585987334369",
  INSTAGRAM: "eddcortinas",
};

const whatsappUrl = (mensagem) =>
  `https://wa.me/${CONFIG.WHATSAPP}` + (mensagem ? `?text=${encodeURIComponent(mensagem)}` : "");

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = whatsappUrl(link.dataset.msg);
});
document.querySelectorAll("[data-instagram]").forEach((link) => {
  link.href = `https://www.instagram.com/${CONFIG.INSTAGRAM}/`;
});

/* ---------- Fotos ausentes viram espaço reservado cinza ---------- */
document.querySelectorAll(".media img").forEach((img) => {
  const marcar = () => img.closest(".media").classList.add("is-placeholder");
  if (img.complete && img.naturalWidth === 0) marcar();
  img.addEventListener("error", marcar);
});

/* ---------- Menu mobile ---------- */
const header = document.querySelector(".header");
const nav = document.querySelector("#menu");
const hamburger = document.querySelector(".hamburger");

function toggleMenu(abrir) {
  nav.classList.toggle("is-open", abrir);
  hamburger.setAttribute("aria-expanded", String(abrir));
  hamburger.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  document.body.classList.toggle("menu-aberto", abrir);
}

hamburger.addEventListener("click", () => toggleMenu(!nav.classList.contains("is-open")));
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => toggleMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) {
    toggleMenu(false);
    hamburger.focus();
  }
});
window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => {
  if (e.matches) toggleMenu(false);
});

/* ---------- Sombra no cabeçalho ao rolar ---------- */
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

document.querySelector("#ano").textContent = new Date().getFullYear();
