/* EDD Cortinas — catálogo digital */
const CONFIG = { WHATSAPP: "5585987334369", INSTAGRAM: "eddcortinas" };
const whatsappUrl = (msg) => `https://wa.me/${CONFIG.WHATSAPP}` + (msg ? `?text=${encodeURIComponent(msg)}` : "");

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  if (link.dataset.msg) link.href = whatsappUrl(link.dataset.msg);
});

/* Fotos ausentes viram espaço reservado cinza */
document.querySelectorAll(".media img").forEach((img) => {
  const marcar = () => img.closest(".media").classList.add("is-placeholder");
  if (img.complete && img.naturalWidth === 0) marcar();
  img.addEventListener("error", marcar);
});

/* Compartilhar: no celular abre o menu de compartilhar (WhatsApp etc.); no computador copia o link */
const botao = document.querySelector("#compartilhar");
botao.addEventListener("click", async () => {
  const url = "https://eddcortinas.com.br/catalogo";
  const dados = { title: "Catálogo EDD Cortinas", text: "Catálogo de cortinas e persianas sob medida da EDD Cortinas:", url };
  if (navigator.share) {
    try { await navigator.share(dados); } catch (e) {}
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    botao.textContent = "Link copiado!";
  } catch (e) {
    botao.textContent = url;
  }
  setTimeout(() => (botao.textContent = "Compartilhar catálogo"), 2500);
});

/* Na hora de imprimir / salvar em PDF, carrega todas as fotos (senão as de baixo saem em branco) */
window.addEventListener("beforeprint", () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = "eager"));
});
