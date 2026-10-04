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
          // Depois da animação, tira as classes para não bloquear o efeito de passar o mouse
          setTimeout(() => entry.target.classList.remove("reveal", "is-visible"), 700);
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

/* ---------- Simulador de orçamento (com lista de várias cortinas) ---------- */
const sim = document.querySelector("#form-simulador");
const simErro = sim.querySelector(".form__error");
const simArea = document.querySelector("#sim-area");
const simAreaRotulo = document.querySelector("#sim-area-rotulo");
const simCalculo = document.querySelector("#sim-calculo");
const simValor = document.querySelector("#sim-valor");
const simLista = document.querySelector("#sim-lista");
const simItens = document.querySelector("#sim-itens");
const simTotal = document.querySelector("#sim-total");
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CHAVE_LISTA = "edd-lista-orcamento";

// A lista fica guardada só no navegador do cliente, para não se perder se ele recarregar a página
let lista = [];
try { lista = JSON.parse(localStorage.getItem(CHAVE_LISTA)) || []; } catch (e) { lista = []; }
const salvarLista = () => { try { localStorage.setItem(CHAVE_LISTA, JSON.stringify(lista)); } catch (e) {} };

// Aceita "2,50", "2.5" (metros), "250" (centímetros) ou "2500" (milímetros) e devolve metros
function lerMedida(texto) {
  const n = parseFloat(String(texto).replace(/\s/g, "").replace(",", "."));
  if (!n || n <= 0) return 0;
  if (n >= 1000) return n / 1000;
  return n > 20 ? n / 100 : n;
}

/* Cortinas de tecido: cobradas por metro de tecido.
   Usam sempre 3x a largura (franzido). Até a altura do rolo conta só a largura;
   acima disso o tecido é invertido e conta a altura de cada pano.
   A altura do rolo vem de data-alturamax no <option> (tecido: 2,80 m; tecido com blackout: 2,70 m). */
const AREA_MINIMA = 1.5; // por peça: 1,5 m² (ou 1,5 m de tecido nas cortinas de tecido)
const TECIDO_FRANZIDO = 3;
const TECIDO_LARGURA_ROLO = 2.8;

function calcularTecido(largura, altura, alturaRolo = TECIDO_LARGURA_ROLO) {
  const larguraTecido = largura * TECIDO_FRANZIDO;
  if (altura <= alturaRolo) {
    return { metros: larguraTecido, calculo: `3x a largura = ${numero.format(larguraTecido)} m de tecido` };
  }
  const panos = Math.ceil(larguraTecido / alturaRolo - 1e-9);
  return {
    metros: panos * altura,
    calculo: `altura acima de ${numero.format(alturaRolo)} m: tecido invertido, ${panos} pano${panos > 1 ? "s" : ""} x ${numero.format(altura)} m`,
  };
}

function calcularSimulacao() {
  const opcao = sim.modelo.selectedOptions[0];
  const preco = opcao && opcao.dataset.preco ? parseFloat(opcao.dataset.preco) : 0;
  const porTecido = !!(opcao && opcao.dataset.calculo === "tecido");
  const largura = lerMedida(sim.largura.value);
  const altura = lerMedida(sim.altura.value);
  const qtd = Math.max(1, parseInt(sim.quantidade.value, 10) || 1);
  // Medida de UMA peça: m² (largura x altura) ou metros de tecido
  let real = largura * altura;
  let calculo = "";
  if (porTecido) {
    const alturaRolo = parseFloat(opcao.dataset.alturamax) || TECIDO_LARGURA_ROLO;
    const t = largura && altura ? calcularTecido(largura, altura, alturaRolo) : { metros: 0, calculo: "" };
    real = t.metros;
    calculo = t.calculo;
  }
  // Área mínima por peça
  const minimo = !!(largura && altura) && real < AREA_MINIMA;
  const cobrada = minimo ? AREA_MINIMA : real;
  const medida = cobrada * qtd;
  return {
    modelo: sim.modelo.value, preco, largura, altura, qtd,
    area: largura && altura ? medida : 0,
    real, minimo,
    unidade: porTecido ? "m" : "m²",
    calculo,
    valor: medida * preco,
    ambiente: sim.ambiente.value.trim(),
    acionamento: sim.acionamento.value,
    comando: sim.comando.value,
    instalacao: sim.instalacao.value,
    cor: sim.cor.value.trim(),
  };
}

// Texto da medida: "6,50 m²" ou "7,50 m de tecido" (com aviso de área mínima)
const textoMedida = (s) =>
  (s.unidade === "m" ? `${numero.format(s.area)} m de tecido` : `${numero.format(s.area)} m²`) + (s.minimo ? " (área mínima)" : "");

// Explicação mostrada abaixo do resultado
function textoCalculo(s) {
  const partes = [];
  if (s.calculo) partes.push(`Cálculo: ${s.calculo}.`);
  if (s.minimo) {
    const un = s.unidade === "m" ? "m de tecido" : "m²";
    partes.push(`Medida real: ${numero.format(s.real)} ${un}. Aplicada a área mínima de ${numero.format(AREA_MINIMA)} ${un} por peça.`);
  }
  if (partes.length && s.qtd > 1) partes.push(`Total para ${s.qtd} peças.`);
  if (s.largura > 10 || s.altura > 6) partes.push(`Confira as medidas: ${numero.format(s.largura)} m x ${numero.format(s.altura)} m.`);
  if (s.acionamento === "Motorizado" && s.modelo && s.modelo !== "Cortina motorizada") {
    partes.push("O motor não está incluído nesta estimativa; a motorização é confirmada no orçamento.");
  }
  return partes.join(" ");
}

function atualizarSimulacao() {
  const s = calcularSimulacao();
  simAreaRotulo.textContent = s.unidade === "m" ? "Tecido necessário" : "Área total";
  simArea.textContent = s.area ? (s.unidade === "m" ? `${numero.format(s.area)} m` : `${numero.format(s.area)} m²`) : "—";
  if (s.minimo) simArea.insertAdjacentHTML("beforeend", ' <small class="sim__min">área mínima</small>');
  simCalculo.textContent = textoCalculo(s);
  simCalculo.hidden = !simCalculo.textContent;
  if (s.modelo && !s.preco) simValor.textContent = "Sob consulta";
  else simValor.textContent = s.area && s.preco ? reais.format(s.valor) : "—";
}

function validarSimulacao(s) {
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
    return false;
  }
  simErro.hidden = true;
  return true;
}

const detalhes = (s) => [s.acionamento, s.comando && `comando ${s.comando.toLowerCase()}`, s.instalacao, s.cor].filter(Boolean);

function renderLista() {
  simLista.hidden = lista.length === 0;
  simItens.innerHTML = "";
  lista.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "sim__item";
    const info = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.textContent = `${s.qtd}x ${s.modelo}${s.ambiente ? " – " + s.ambiente : ""}`;
    const medidas = document.createElement("span");
    medidas.textContent = [`${numero.format(s.largura)} x ${numero.format(s.altura)} m`, textoMedida(s), ...detalhes(s)].join(" · ");
    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "sim__remover";
    remover.textContent = "Remover";
    remover.addEventListener("click", () => { lista.splice(i, 1); salvarLista(); renderLista(); });
    info.append(titulo, medidas, document.createElement("br"), remover);
    const valor = document.createElement("span");
    valor.className = "sim__item-valor";
    valor.textContent = s.preco ? reais.format(s.valor) : "Sob consulta";
    li.append(info, valor);
    simItens.appendChild(li);
  });
  const soma = lista.reduce((t, s) => t + (s.preco ? s.valor : 0), 0);
  const algumSemPreco = lista.some((s) => !s.preco);
  simTotal.textContent = soma ? reais.format(soma) + (algumSemPreco ? " + itens sob consulta" : "") : "Sob consulta";
}

function limparMedidas() {
  sim.largura.value = "";
  sim.altura.value = "";
  sim.quantidade.value = "1";
  sim.ambiente.value = "";
  atualizarSimulacao();
}

sim.addEventListener("input", atualizarSimulacao);
sim.addEventListener("change", atualizarSimulacao);

document.querySelector("#sim-adicionar").addEventListener("click", () => {
  const s = calcularSimulacao();
  if (!validarSimulacao(s)) return;
  lista.push(s);
  salvarLista();
  renderLista();
  limparMedidas();
  sim.largura.focus();
});

// Botões "Simular este modelo" nos produtos
document.querySelectorAll(".product__sim").forEach((botao) => {
  botao.addEventListener("click", () => {
    sim.modelo.value = botao.dataset.modelo;
    atualizarSimulacao();
    document.querySelector("#simulador").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => sim.largura.focus({ preventScroll: true }), 600);
  });
});

function linhasItem(s, n) {
  return [
    `*${n ? n + ". " : ""}${s.modelo}*${s.ambiente ? " – " + s.ambiente : ""}`,
    `Medidas: ${numero.format(s.largura)} m (largura) x ${numero.format(s.altura)} m (altura)`,
    s.unidade === "m"
      ? `Quantidade: ${s.qtd} · Tecido: ${numero.format(s.area)} m (${s.calculo})`
      : `Quantidade: ${s.qtd} · Área: ${numero.format(s.area)} m²`,
    s.minimo
      ? `Área mínima aplicada: ${numero.format(AREA_MINIMA)} ${s.unidade === "m" ? "m de tecido" : "m²"} por peça (medida real ${numero.format(s.real)})`
      : null,
    detalhes(s).length ? `Opções: ${detalhes(s).join(", ")}` : null,
    s.preco ? `Valor estimado: ${reais.format(s.valor)}` : "Valor: sob consulta",
  ].filter(Boolean);
}

sim.addEventListener("submit", (e) => {
  e.preventDefault();
  const atual = calcularSimulacao();
  const temAtual = atual.modelo && atual.largura && atual.altura;
  const itens = temAtual ? [...lista, atual] : [...lista];

  if (!itens.length) { validarSimulacao(atual); return; }
  simErro.hidden = true;

  const blocos = itens.map((s, i) => linhasItem(s, itens.length > 1 ? i + 1 : 0).join("\n"));
  const soma = itens.reduce((t, s) => t + (s.preco ? s.valor : 0), 0);
  const texto = [
    "Olá, EDD Cortinas! Fiz uma simulação no site:",
    "",
    blocos.join("\n\n"),
    itens.length > 1 && soma ? `\n*Total estimado:* ${reais.format(soma)}${itens.some((s) => !s.preco) ? " + itens sob consulta" : ""}` : null,
    "",
    "Gostaria de confirmar o orçamento e agendar uma visita técnica.",
  ]
    .filter((linha) => linha !== null)
    .join("\n");

  window.open(whatsappUrl(texto), "_blank", "noopener");
});

renderLista();

/* ---------- Galeria: ampliar a foto ao clicar ---------- */
const fotosGaleria = [...document.querySelectorAll(".gallery__item img")];
if (fotosGaleria.length) {
  const caixa = document.createElement("div");
  caixa.className = "lightbox";
  caixa.hidden = true;
  caixa.setAttribute("role", "dialog");
  caixa.setAttribute("aria-modal", "true");
  caixa.setAttribute("aria-label", "Foto ampliada");
  caixa.innerHTML = `
    <button type="button" class="lightbox__btn lightbox__fechar" aria-label="Fechar">✕</button>
    <button type="button" class="lightbox__btn lightbox__ant" aria-label="Foto anterior">‹</button>
    <figure class="lightbox__fig"><img alt=""><figcaption></figcaption></figure>
    <button type="button" class="lightbox__btn lightbox__prox" aria-label="Próxima foto">›</button>`;
  document.body.appendChild(caixa);
  const imgGrande = caixa.querySelector("img");
  const legenda = caixa.querySelector("figcaption");
  let atual = 0;
  let ultimoFoco = null;

  const mostrar = (i) => {
    atual = (i + fotosGaleria.length) % fotosGaleria.length;
    const foto = fotosGaleria[atual];
    imgGrande.src = foto.currentSrc || foto.src;
    imgGrande.alt = foto.alt;
    legenda.textContent = `${foto.alt.replace(/, projeto da EDD Cortinas em Fortaleza$/, "")} · ${atual + 1} de ${fotosGaleria.length}`;
  };
  const abrir = (i) => {
    ultimoFoco = document.activeElement;
    mostrar(i);
    caixa.hidden = false;
    document.body.classList.add("menu-aberto");
    caixa.querySelector(".lightbox__fechar").focus();
  };
  const fechar = () => {
    caixa.hidden = true;
    document.body.classList.remove("menu-aberto");
    if (ultimoFoco) ultimoFoco.focus();
  };

  fotosGaleria.forEach((foto, i) => {
    const item = foto.closest(".gallery__item");
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `Ampliar foto: ${foto.alt}`);
    item.addEventListener("click", () => { if (!item.classList.contains("is-placeholder")) abrir(i); });
    item.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !item.classList.contains("is-placeholder")) { e.preventDefault(); abrir(i); }
    });
  });

  caixa.querySelector(".lightbox__fechar").addEventListener("click", fechar);
  caixa.querySelector(".lightbox__ant").addEventListener("click", () => mostrar(atual - 1));
  caixa.querySelector(".lightbox__prox").addEventListener("click", () => mostrar(atual + 1));
  caixa.addEventListener("click", (e) => { if (e.target === caixa || e.target.classList.contains("lightbox__fig")) fechar(); });
  document.addEventListener("keydown", (e) => {
    if (caixa.hidden) return;
    if (e.key === "Escape") fechar();
    if (e.key === "ArrowLeft") mostrar(atual - 1);
    if (e.key === "ArrowRight") mostrar(atual + 1);
  });
  // Arrastar para os lados no celular
  let toqueX = null;
  caixa.addEventListener("touchstart", (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
  caixa.addEventListener("touchend", (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
    toqueX = null;
  });
}

/* ---------- Ano atual no rodapé ---------- */
document.querySelector("#ano").textContent = new Date().getFullYear();
