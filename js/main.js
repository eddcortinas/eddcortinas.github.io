/* =========================================================
   EDD Cortinas — scripts
   ========================================================= */

/* ---------- CONFIGURAÇÃO: edite aqui ----------
   WHATSAPP: só números, com 55 (Brasil) + DDD + número.
   Exemplo: (85) 9 1234-5678  ->  "5585912345678"
   INSTAGRAM: só o nome do perfil, sem o @. */
const CONFIG = {
  WHATSAPP: "5585987334369",
  INSTAGRAM: "eddcortinas",
};

const whatsappUrl = (mensagem) =>
  `https://wa.me/${CONFIG.WHATSAPP}` + (mensagem ? `?text=${encodeURIComponent(mensagem)}` : "");

/* ---------- Links de WhatsApp e Instagram ---------- */
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

/* ---------- Destaca o item do menu da seção visível ---------- */
const navLinks = document.querySelectorAll(".nav__link");
const secoes = [...navLinks].map((link) => document.querySelector(link.getAttribute("href")));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) =>
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  secoes.forEach((secao) => secao && observer.observe(secao));

  /* Animação suave de entrada */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document
    .querySelectorAll(".section__head, .product, .step, .gallery__item, .testimonial, .contact__info, .form")
    .forEach((el) => {
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
}

/* ---------- Máscara simples para o campo de WhatsApp ---------- */
const campoWhats = document.querySelector("#whatsapp");
campoWhats.addEventListener("input", () => {
  const d = campoWhats.value.replace(/\D/g, "").slice(0, 11);
  let v = d;
  if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 3 && d.length === 11) v = `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  else if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  campoWhats.value = v;
});

/* ---------- Formulário -> abre o WhatsApp com a mensagem pronta ---------- */
const form = document.querySelector("#form-orcamento");
const erro = form.querySelector(".form__error");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = form.nome.value.trim();
  const whats = form.whatsapp.value.trim();
  const produto = form.produto.value;
  const mensagem = form.mensagem.value.trim();

  const faltando = [];
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("is-invalid"));
  if (!nome) faltando.push(form.nome);
  if (whats.replace(/\D/g, "").length < 10) faltando.push(form.whatsapp);
  if (!produto) faltando.push(form.produto);

  if (faltando.length) {
    faltando.forEach((campo) => campo.closest(".field").classList.add("is-invalid"));
    erro.textContent = "Preencha nome, WhatsApp (com DDD) e tipo de produto.";
    erro.hidden = false;
    faltando[0].focus();
    return;
  }
  erro.hidden = true;

  const texto = [
    "Olá, EDD Cortinas! Vim pelo site e gostaria de um orçamento.",
    "",
    `*Nome:* ${nome}`,
    `*WhatsApp:* ${whats}`,
    `*Produto:* ${produto}`,
    mensagem ? `*Mensagem:* ${mensagem}` : null,
  ]
    .filter((linha) => linha !== null)
    .join("\n");

  window.open(whatsappUrl(texto), "_blank", "noopener");
});

/* ---------- Simulador de orçamento ---------- */
const sim = document.querySelector("#form-simulador");
const simErro = sim.querySelector(".form__error");
const simArea = document.querySelector("#sim-area");
const simValor = document.querySelector("#sim-valor");
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Aceita "2,50", "2.5" ou "250" (centímetros) e devolve metros
function lerMedida(texto) {
  const n = parseFloat(String(texto).replace(/\s/g, "").replace(",", "."));
  if (!n || n <= 0) return 0;
  return n > 20 ? n / 100 : n;
}

function calcularSimulacao() {
  const opcao = sim.modelo.selectedOptions[0];
  const preco = opcao && opcao.dataset.preco ? parseFloat(opcao.dataset.preco) : 0;
  const largura = lerMedida(sim.largura.value);
  const altura = lerMedida(sim.altura.value);
  const qtd = Math.max(1, parseInt(sim.quantidade.value, 10) || 1);
  const area = largura * altura * qtd;
  return { modelo: sim.modelo.value, preco, largura, altura, qtd, area, valor: area * preco };
}

function atualizarSimulacao() {
  const s = calcularSimulacao();
  simArea.textContent = s.area ? `${numero.format(s.area)} m²` : "—";
  if (s.modelo && !s.preco) simValor.textContent = "Sob consulta";
  else simValor.textContent = s.area && s.preco ? reais.format(s.valor) : "—";
}

sim.addEventListener("input", atualizarSimulacao);
sim.addEventListener("change", atualizarSimulacao);

// Botões "Simular este modelo" nos produtos
document.querySelectorAll(".product__sim").forEach((botao) => {
  botao.addEventListener("click", () => {
    sim.modelo.value = botao.dataset.modelo;
    atualizarSimulacao();
    document.querySelector("#simulador").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => sim.largura.focus({ preventScroll: true }), 600);
  });
});

sim.addEventListener("submit", (e) => {
  e.preventDefault();
  const s = calcularSimulacao();

  const faltando = [];
  sim.querySelectorAll(".field").forEach((f) => f.classList.remove("is-invalid"));
  if (!s.modelo) faltando.push(sim.modelo);
  if (!s.largura) faltando.push(sim.largura);
  if (!s.altura) faltando.push(sim.altura);

  if (faltando.length) {
    faltando.forEach((campo) => campo.closest(".field").classList.add("is-invalid"));
    simErro.textContent = "Escolha o modelo e informe a largura e a altura.";
    simErro.hidden = false;
    faltando[0].focus();
    return;
  }
  simErro.hidden = true;

  const ambiente = sim.ambiente.value.trim();
  const texto = [
    "Olá, EDD Cortinas! Fiz uma simulação no site:",
    "",
    `*Modelo:* ${s.modelo}`,
    `*Medidas:* ${numero.format(s.largura)} m (largura) x ${numero.format(s.altura)} m (altura)`,
    `*Quantidade:* ${s.qtd}`,
    `*Área total:* ${numero.format(s.area)} m²`,
    s.preco ? `*Valor estimado:* ${reais.format(s.valor)}` : "*Valor:* sob consulta",
    ambiente ? `*Ambiente:* ${ambiente}` : null,
    "",
    "Gostaria de confirmar o orçamento e agendar uma visita técnica.",
  ]
    .filter((linha) => linha !== null)
    .join("\n");

  window.open(whatsappUrl(texto), "_blank", "noopener");
});

/* ---------- Ano atual no rodapé ---------- */
document.querySelector("#ano").textContent = new Date().getFullYear();
