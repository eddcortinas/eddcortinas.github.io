/* =========================================================
   EDD Cortinas — gerador de orçamento em PDF (página interna)
   Os modelos e preços são lidos do simulador do index.html,
   então basta atualizar os preços no site.
   ========================================================= */

const EMPRESA = {
  nome: "EDD Cortinas",
  linhas: [
    "Rua 906, 35 - Conjunto Ceará II",
    "Fortaleza/CE - CEP 60532-490",
    "(85) 9 8733-4369 - eddcortinas@gmail.com",
    "CNPJ 72.170.673/0001-09",
  ],
  site: "eddcortinas.github.io",
  logo: "img/logo-edd-cortinas.png",
};

const CONSIDERACOES_PADRAO = [
  "Por ser material confeccionado sob medida, não é possível cancelar ou modificar o pedido após a autorização, pois a fabricação é iniciada logo em seguida.",
  "Prazo de garantia de cortinas manuais referente a defeitos de fabricação e instalação: 12 meses.",
  "Prazo de garantia de cortinas motorizadas referente a defeitos de fabricação e instalação, desde que todas as manutenções e assistências sejam realizadas por nossa empresa: 60 meses. Regras válidas também para motores vendidos por nossas revendas autorizadas.",
  "Prazo de garantia referente aos serviços de manutenção: 90 dias.",
  "Não fazemos marcação de horário predefinido para instalação.",
  "Não nos responsabilizamos por danos causados na rede hidráulica em consequência de perfurações.",
  "No caso de cortinas motorizadas, a pré-disposição elétrica é de responsabilidade do cliente.",
].join("\n");

const AREA_MINIMA = 1.5;
const TECIDO_FRANZIDO = 3;
const CHAVE_RASCUNHO = "edd-orcamento-rascunho";
const CHAVE_ULTIMO = "edd-orcamento-ultimo-numero";

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const form = document.querySelector("#orc");
const listaItens = document.querySelector("#itens");
const tplItem = document.querySelector("#tpl-item");
const erro = document.querySelector("#erro");
let MODELOS = []; // { nome, grupo, preco, calculo, alturamax, acessorios, fixo }

/* ---------- Utilidades ---------- */
function lerNumero(texto) {
  const n = parseFloat(String(texto || "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function lerMedida(texto) {
  const n = parseFloat(String(texto || "").replace(/\s/g, "").replace(",", "."));
  if (!n || n <= 0) return 0;
  if (n >= 1000) return n / 1000;
  return n > 20 ? n / 100 : n;
}
function soNumerosDecimal(campo) {
  let v = campo.value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [a, ...b] = v.split(",");
  v = b.length ? `${a},${b.join("").slice(0, 2)}` : a;
  if (v !== campo.value) campo.value = v;
}
function soInteiros(campo) {
  const v = campo.value.replace(/\D/g, "");
  if (v !== campo.value) campo.value = v;
}
// Data de hoje no fuso do aparelho (não em UTC)
const hoje = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const dataBR = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

/* ---------- Modelos (lidos do site) ---------- */
async function carregarModelos() {
  try {
    const html = await (await fetch("index.html", { cache: "no-store" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("#sim-modelo option[data-preco]").forEach((op) => {
      MODELOS.push({
        nome: op.textContent.trim(),
        grupo: op.parentElement.tagName === "OPTGROUP" ? op.parentElement.label : "Modelos",
        preco: parseFloat(op.dataset.preco) || 0,
        calculo: op.dataset.calculo || "",
        alturamax: parseFloat(op.dataset.alturamax) || 2.8,
        acessorios: parseFloat(op.dataset.acessorios) || 0,
      });
    });
  } catch (e) {
    console.warn("Não foi possível ler os modelos do site", e);
  }
  // Toldo: só no cálculo interno (não aparece no site). Tecido por m² + acessórios por peça
  MODELOS.push({ nome: "Toldo vertical (tela screen 5%)", grupo: "Toldos", preco: 500, calculo: "", alturamax: 2.8, acessorios: 600 });
  MODELOS.push({ nome: "Kit instalação", grupo: "Outros (valor fixo)", preco: 0, fixo: true });
  MODELOS.push({ nome: "Serviço / outro item", grupo: "Outros (valor fixo)", preco: 0, fixo: true });
}

function opcoesModelo() {
  const grupos = {};
  MODELOS.forEach((m, i) => { (grupos[m.grupo] = grupos[m.grupo] || []).push(`<option value="${i}">${m.nome}</option>`); });
  return '<option value="">Selecione</option>' +
    Object.entries(grupos).map(([g, ops]) => `<optgroup label="${g}">${ops.join("")}</optgroup>`).join("");
}

/* ---------- Cálculo de um item ---------- */
function calcularItem(dados) {
  const m = MODELOS[dados.modelo];
  const qtd = Math.max(1, parseInt(dados.qtd, 10) || 1);
  if (!m) return { total: 0, calc: "", medida: "" };
  const manual = lerNumero(dados.unitario);
  const preco = manual || m.preco;

  if (m.fixo) {
    return { total: preco * qtd, calc: preco ? `${qtd} x ${reais.format(preco)}` : "Informe o valor unitário.", medida: "", preco, qtd };
  }

  const largura = lerMedida(dados.largura);
  const altura = lerMedida(dados.altura);
  if (!largura || !altura) return { total: 0, calc: "Informe largura e altura.", medida: "", preco, qtd };

  let real = largura * altura;
  let un = "m²";
  let extra = "";
  if (m.calculo === "tecido") {
    un = "m";
    const larguraTecido = largura * TECIDO_FRANZIDO;
    if (altura <= m.alturamax) {
      real = larguraTecido;
      extra = "3x a largura";
    } else {
      const panos = Math.ceil(larguraTecido / m.alturamax - 1e-9);
      real = panos * altura;
      extra = `tecido invertido, ${panos} pano(s) x ${numero.format(altura)} m`;
    }
  }
  const minimo = real < AREA_MINIMA;
  const cobrada = minimo ? AREA_MINIMA : real;
  const total = cobrada * preco * qtd + (m.acessorios || 0) * qtd;

  const partes = [`${numero.format(cobrada)} ${un} x ${reais.format(preco)}`];
  if (m.acessorios) partes.push(`+ acessórios ${reais.format(m.acessorios)}`);
  if (qtd > 1) partes.push(`x ${qtd} peças`);
  if (extra) partes.push(`(${extra})`);
  if (minimo) partes.push(`- área mínima (real ${numero.format(real)} ${un})`);

  return {
    total,
    calc: partes.join(" "),
    medida: `${numero.format(largura)} x ${numero.format(altura)} m - ${numero.format(cobrada * qtd)} ${un}${minimo ? " (mín.)" : ""}`,
    preco, qtd,
  };
}

/* ---------- Itens na tela ---------- */
function adicionarItem(dados = {}) {
  const el = tplItem.content.firstElementChild.cloneNode(true);
  const sel = el.querySelector('[data-campo="modelo"]');
  sel.innerHTML = opcoesModelo();
  Object.entries(dados).forEach(([k, v]) => {
    const campo = el.querySelector(`[data-campo="${k}"]`);
    if (campo && "value" in campo && campo.tagName !== "OUTPUT") campo.value = v;
  });
  ["largura", "altura", "unitario"].forEach((k) => {
    const c = el.querySelector(`[data-campo="${k}"]`);
    c.addEventListener("input", () => soNumerosDecimal(c));
  });
  const q = el.querySelector('[data-campo="qtd"]');
  q.addEventListener("input", () => soInteiros(q));
  el.querySelector(".item__remover").addEventListener("click", () => { el.remove(); atualizar(); });
  listaItens.appendChild(el);
  atualizar();
}

function lerItens() {
  return [...listaItens.querySelectorAll(".item")].map((el) => {
    const d = {};
    el.querySelectorAll("[data-campo]").forEach((c) => { if (c.tagName !== "OUTPUT" && c.tagName !== "P") d[c.dataset.campo] = c.value; });
    return d;
  });
}

function totais() {
  const itens = lerItens().map((d) => ({ dados: d, r: calcularItem(d) }));
  const subtotal = itens.reduce((t, i) => t + i.r.total, 0);
  const frete = lerNumero(form.frete.value);
  const pct = lerNumero(form.descontoPct.value);
  const desconto = lerNumero(form.desconto.value) || (pct ? subtotal * pct / 100 : 0);
  return { itens, subtotal, frete, desconto, total: Math.max(0, subtotal + frete - desconto) };
}

function atualizar() {
  const t = totais();
  [...listaItens.querySelectorAll(".item")].forEach((el, i) => {
    const r = t.itens[i].r;
    el.querySelector('[data-campo="total"]').textContent = reais.format(r.total);
    el.querySelector('[data-campo="calc"]').textContent = r.calc;
    const m = MODELOS[t.itens[i].dados.modelo];
    el.querySelector('[data-campo="unitario"]').placeholder = m && !m.fixo ? `${reais.format(m.preco)} (auto)` : "valor";
  });
  document.querySelector("#r-subtotal").textContent = reais.format(t.subtotal);
  document.querySelector("#r-frete").textContent = reais.format(t.frete);
  document.querySelector("#r-desconto").textContent = reais.format(t.desconto);
  document.querySelector("#r-total").textContent = reais.format(t.total);
  salvarRascunho();
}

/* ---------- Rascunho (só neste aparelho) ---------- */
function salvarRascunho() {
  try {
    const campos = {};
    [...form.elements].forEach((c) => { if (c.name && c.type !== "file") campos[c.name] = c.value; });
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ campos, itens: lerItens() }));
  } catch (e) {}
}
function carregarRascunho() {
  try { return JSON.parse(localStorage.getItem(CHAVE_RASCUNHO)); } catch (e) { return null; }
}
function proximoNumero() {
  try { const n = parseInt(localStorage.getItem(CHAVE_ULTIMO), 10); return n ? String(n + 1) : ""; } catch (e) { return ""; }
}
function novoOrcamento() {
  form.reset();
  listaItens.innerHTML = "";
  form.numero.value = proximoNumero();
  form.data.value = hoje();
  form.consideracoes.value = CONSIDERACOES_PADRAO;
  adicionarItem();
}

/* ---------- Máscaras simples ---------- */
form.telefone.addEventListener("input", () => {
  const d = form.telefone.value.replace(/\D/g, "").slice(0, 11);
  let v = d;
  if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length === 11) v = `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  else if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  form.telefone.value = v;
});
form.cep.addEventListener("input", () => {
  const d = form.cep.value.replace(/\D/g, "").slice(0, 8);
  form.cep.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
});
["frete", "desconto", "descontoPct"].forEach((n) => form[n].addEventListener("input", () => soNumerosDecimal(form[n])));

form.addEventListener("input", atualizar);
form.addEventListener("change", atualizar);
document.querySelector("#add-item").addEventListener("click", () => adicionarItem());
document.querySelector("#novo").addEventListener("click", () => {
  if (confirm("Começar um orçamento novo? O atual será apagado da tela.")) novoOrcamento();
});

/* ---------- PDF ---------- */
// O PDF usa a fonte padrão (Latin-1): troca caracteres que ela não tem
const txt = (s) => String(s || "")
  .replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/→/g, "->").replace(/[^\x00-\xFF]/g, "");

function imagemParaDataURL(src, max = 1400, tipo = "image/jpeg") {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * r);
      c.height = Math.round(img.naturalHeight * r);
      const g = c.getContext("2d");
      if (tipo === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); }
      g.drawImage(img, 0, 0, c.width, c.height);
      ok({ data: c.toDataURL(tipo, 0.85), w: c.width, h: c.height });
    };
    img.onerror = falha;
    img.src = src;
  });
}
const arquivoParaURL = (f) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });

async function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 14, AZUL = [11, 29, 84], LARANJA = [247, 137, 58], CINZA = [90, 96, 94];
  const t = totais();
  const f = form;

  // Cabeçalho
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...AZUL);
  doc.text("ORÇAMENTO", M, 13);
  doc.setDrawColor(...AZUL); doc.setLineWidth(0.4); doc.line(M + 24, 12, W - M, 12);

  try {
    const logo = await imagemParaDataURL(EMPRESA.logo, 480, "image/png");
    const lw = 46; doc.addImage(logo.data, "PNG", M, 18, lw, lw * logo.h / logo.w);
  } catch (e) {
    doc.setFontSize(18); doc.text(EMPRESA.nome, M, 30);
  }

  doc.setTextColor(30, 37, 35); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  doc.text(EMPRESA.nome, M, 46);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  let y = 50.5;
  EMPRESA.linhas.forEach((l) => { doc.text(txt(l), M, y); y += 4.2; });
  if (f.vendedor.value) { doc.text(txt(`Vendedor: ${f.vendedor.value}`), M, y); y += 4.2; }

  // Cliente (à direita)
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...AZUL);
  doc.text("CLIENTE", W - M, 22, { align: "right" });
  doc.setTextColor(30, 37, 35); doc.setFontSize(9.5);
  doc.text(txt(f.cliente.value), W - M, 28, { align: "right", maxWidth: 85 });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  let yc = 33;
  [f.documento.value && `CPF/CNPJ: ${f.documento.value}`, f.endereco.value, [f.bairro.value, f.cidade.value].filter(Boolean).join(" - "),
    f.cep.value && `CEP ${f.cep.value}`, f.telefone.value && `Tel.: ${f.telefone.value}`]
    .filter(Boolean).forEach((l) => { doc.text(txt(l), W - M, yc, { align: "right", maxWidth: 85 }); yc += 4.2; });

  // Faixa de informações
  const yi = Math.max(y, yc) + 6;
  doc.setDrawColor(...AZUL); doc.setLineWidth(0.6); doc.line(M, yi, W - M, yi);
  const colW = (W - 2 * M) / 4;
  const info = [
    ["Nº do Orçamento", f.numero.value || "-"],
    ["Data", dataBR(f.data.value)],
    ["Previsão de Entrega", dataBR(f.previsao.value) || "A combinar"],
    ["Valor Total", numero.format(t.total)],
  ];
  info.forEach(([rotulo, valor], i) => {
    const x = M + colW * i;
    if (i === 3) { doc.setFillColor(228, 232, 243); doc.rect(x, yi + 1.5, colW, 17, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...CINZA);
    doc.text(rotulo, x + colW / 2, yi + 7, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(i === 3 ? 13 : 12); doc.setTextColor(i === 3 ? AZUL[0] : 30, i === 3 ? AZUL[1] : 37, i === 3 ? AZUL[2] : 35);
    doc.text(txt(valor), x + colW / 2, yi + 14.5, { align: "center" });
  });
  doc.setLineWidth(0.6); doc.line(M, yi + 20, W - M, yi + 20);

  // Tabela de itens
  const linhas = t.itens.filter((i) => MODELOS[i.dados.modelo]).map(({ dados, r }) => {
    const m = MODELOS[dados.modelo];
    const desc = [m.nome.toUpperCase(), dados.descricao, r.medida].filter(Boolean).join("\n");
    return [txt(dados.ambiente || "-"), txt(desc), String(r.qtd || 1), txt(reais.format(r.total))];
  });
  doc.autoTable({
    startY: yi + 25,
    head: [["AMBIENTE", "DESCRIÇÃO", "QTD", "PREÇO"]],
    body: linhas,
    theme: "plain",
    margin: { left: M, right: M },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 }, textColor: [30, 37, 35], valign: "top" },
    headStyles: { fontStyle: "bold", textColor: AZUL, fontSize: 8 },
    columnStyles: { 0: { cellWidth: 32 }, 2: { cellWidth: 14, halign: "center" }, 3: { cellWidth: 32, halign: "right" } },
    didDrawCell: (d) => {
      doc.setDrawColor(d.section === "head" ? AZUL[0] : 200, d.section === "head" ? AZUL[1] : 205, d.section === "head" ? AZUL[2] : 215);
      doc.setLineWidth(d.section === "head" ? 0.5 : 0.2);
      doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height);
    },
  });

  // Observações e totais
  let yt = doc.lastAutoTable.finalY + 8;
  if (yt > 240) { doc.addPage(); yt = 20; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(30, 37, 35);
  doc.text("OBS:", M, yt);
  doc.setFont("helvetica", "normal");
  const obs = doc.splitTextToSize(txt(f.obs.value || "-"), 105);
  doc.text(obs, M, yt + 5);

  const xr = W - M;
  const linhasTotais = [["SUBTOTAL", t.subtotal], ["FRETE", t.frete], ["DESCONTO", t.desconto]];
  linhasTotais.forEach(([r, v], i) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    doc.text(`${r}  ${txt(reais.format(v))}`, xr, yt + i * 5.5, { align: "right" });
  });
  const yTot = yt + linhasTotais.length * 5.5 + 3;
  doc.setDrawColor(...AZUL); doc.setLineWidth(0.4); doc.line(xr - 62, yTot - 4, xr, yTot - 4);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...AZUL);
  doc.text(`TOTAL  ${txt(reais.format(t.total))}`, xr, yTot + 1.5, { align: "right" });

  // Considerações gerais
  let yg = Math.max(yt + 5 + obs.length * 4, yTot + 6) + 6;
  const cons = f.consideracoes.value.split("\n").map((s) => s.trim()).filter(Boolean);
  if (cons.length) {
    if (yg > 250) { doc.addPage(); yg = 20; }
    doc.setDrawColor(...AZUL); doc.setLineWidth(0.4); doc.line(M, yg - 4, W - M, yg - 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(30, 37, 35);
    doc.text("CONSIDERAÇÕES GERAIS:", M, yg);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.8);
    yg += 4.5;
    cons.forEach((c, i) => {
      const ls = doc.splitTextToSize(txt(`${i + 1}- ${c}`), W - 2 * M);
      if (yg + ls.length * 3.6 > 282) { doc.addPage(); yg = 20; }
      doc.text(ls, M, yg); yg += ls.length * 3.6 + 1;
    });
  }

  // Fotos (opcional)
  const fotos = [...(f.fotos.files || [])].slice(0, 2);
  if (fotos.length) {
    const imgs = [];
    for (const arq of fotos) { try { imgs.push(await imagemParaDataURL(await arquivoParaURL(arq), 1400)); } catch (e) {} }
    if (imgs.length) {
      const h = 62;
      if (yg + h + 6 > 282) { doc.addPage(); yg = 20; } else { yg += 4; }
      let x = M;
      imgs.forEach((im) => {
        const prop = im.w / im.h;
        const w = Math.min(88, h * prop);
        doc.addImage(im.data, "JPEG", x, yg, w, w / prop);
        x += w + 6;
      });
    }
  }

  // Rodapé em todas as páginas
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LARANJA); doc.setLineWidth(0.8); doc.line(M, 287, W - M, 287);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...CINZA);
    doc.text(txt(`${EMPRESA.nome} - ${EMPRESA.site} - (85) 9 8733-4369`), M, 291.5);
    doc.text(`Orçamento Nº ${txt(f.numero.value)} - Pág. ${p}/${paginas}`, W - M, 291.5, { align: "right" });
  }

  const nomeArquivo = `Orcamento ${f.numero.value || ""} - ${f.cliente.value || "cliente"}`.replace(/[\\/:*?"<>|]/g, "").trim();
  doc.save(`${nomeArquivo}.pdf`);
  try { localStorage.setItem(CHAVE_ULTIMO, String(parseInt(f.numero.value, 10) || "")); } catch (e) {}
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  erro.hidden = true;
  erro.style.color = "";
  form.querySelectorAll(".invalido").forEach((c) => c.classList.remove("invalido"));
  const faltando = [form.numero, form.data, form.cliente].filter((c) => !c.value.trim());
  const t = totais();
  if (!t.itens.some((i) => i.r.total > 0)) faltando.push(listaItens.querySelector('[data-campo="modelo"]'));
  if (faltando.length) {
    faltando.forEach((c) => c && c.classList.add("invalido"));
    erro.textContent = "Preencha número, data, cliente e pelo menos um item com valor.";
    erro.hidden = false;
    return;
  }
  if (!window.jspdf) { erro.textContent = "Não foi possível carregar o gerador de PDF. Verifique a internet e tente de novo."; erro.hidden = false; return; }
  await gerarPDF();
});

/* ---------- Pedido vindo do simulador do site (link #i=...) ---------- */
function lerPedidoDoLink() {
  const m = location.hash.match(/^#i=([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dados = JSON.parse(new TextDecoder().decode(bytes));
    return Array.isArray(dados) ? dados : null;
  } catch (e) {
    return null;
  }
}

function carregarPedido(pedido) {
  novoOrcamento();
  listaItens.innerHTML = "";
  pedido.forEach((p) => {
    const indice = MODELOS.findIndex((m) => m.nome === p.m);
    adicionarItem({
      ambiente: p.a || "",
      modelo: indice >= 0 ? String(indice) : "",
      largura: p.l ? numero.format(p.l) : "",
      altura: p.h ? numero.format(p.h) : "",
      qtd: String(p.q || 1),
      descricao: p.d || (indice < 0 && p.m ? p.m : ""),
    });
  });
  if (!pedido.length) adicionarItem();
}

/* ---------- Início ---------- */
(async () => {
  await carregarModelos();
  const pedido = lerPedidoDoLink();
  if (pedido) history.replaceState(null, "", location.pathname);
  const r = carregarRascunho();
  const temRascunho = r && r.itens && r.itens.some((i) => i.modelo);
  if (pedido && (!temRascunho || confirm("Abrir o pedido do cliente? O orçamento que está na tela será substituído."))) {
    carregarPedido(pedido);
    erro.textContent = "Pedido do cliente carregado. Confira as medidas da visita e preencha os dados do cliente.";
    erro.style.color = "#0B1D54";
    erro.hidden = false;
  } else if (r && r.campos) {
    Object.entries(r.campos).forEach(([k, v]) => { if (form[k] && form[k].type !== "file") form[k].value = v; });
    (r.itens && r.itens.length ? r.itens : [{}]).forEach((d) => adicionarItem(d));
  } else {
    novoOrcamento();
  }
  if (!form.consideracoes.value) form.consideracoes.value = CONSIDERACOES_PADRAO;
  if (!form.data.value) form.data.value = hoje();
  atualizar();
})();
