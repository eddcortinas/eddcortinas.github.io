// Gera catalogo-edd-cortinas.pdf a partir de catalogo.html.
// Uso: sirva o site em http://localhost:8765 (ex.: python3 -m http.server 8765) e rode: node _ferramentas/pdf-catalogo.js
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("http://localhost:8765/catalogo.html", { waitUntil: "networkidle" });
  await p.evaluate(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await p.emulateMedia({ media: "print" });
  await p.pdf({ path: "catalogo-edd-cortinas.pdf", format: "A4", printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
