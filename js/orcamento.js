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
  site: "eddcortinas.com.br",
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
// Cada link de pedido tem o próprio rascunho; sem link, usa o rascunho geral
let chaveRascunho = CHAVE_RASCUNHO;
const CHAVE_ULTIMO = "edd-orcamento-ultimo-numero";

/* Condições comerciais
   - Validade do orçamento: dias corridos a partir da data
   - Previsão: maior prazo de produção entre os itens (dias úteis) + instalação
   - Pagamento: à vista com desconto, ou cartão em parcelas sem juros sobre o total cheio */
const VALIDADE_DIAS = 15;
const DIAS_INSTALACAO = 2;
const PAGAMENTO = { descontoAvista: 6, parcelas: 8 };

// Datas no formato do campo (AAAA-MM-DD), sem passar por UTC
const paraData = (iso) => { const [a, m, d] = iso.split("-").map(Number); return new Date(a, m - 1, d); };
const paraIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function somarDias(iso, dias) {
  const d = paraData(iso);
  d.setDate(d.getDate() + dias);
  return paraIso(d);
}
// Dias úteis: pula sábado e domingo (feriados não entram)
function somarDiasUteis(iso, dias) {
  const d = paraData(iso);
  while (dias > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) dias--;
  }
  return paraIso(d);
}
const condicoesPagamento = (total) => ({
  avista: total * (1 - PAGAMENTO.descontoAvista / 100),
  parcela: total / PAGAMENTO.parcelas,
});

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
        acessoriosNome: op.dataset.acessoriosNome || "acessórios",
        guia: parseFloat(op.dataset.guia) || 0,
        prazo: parseInt(op.dataset.prazo, 10) || 0,
      });
    });
  } catch (e) {
    console.warn("Não foi possível ler os modelos do site", e);
  }
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
  // Guia opcional (rolô): (altura x 2 + largura) x valor do metro da guia, por peça
  const valorGuia = m.guia && dados.guia ? (altura * 2 + largura) * m.guia : 0;
  const total = cobrada * preco * qtd + (m.acessorios || 0) * qtd + valorGuia * qtd;

  const partes = [`${numero.format(cobrada)} ${un} x ${reais.format(preco)}`];
  if (m.acessorios) partes.push(`+ ${m.acessoriosNome || "acessórios"} ${reais.format(m.acessorios)}`);
  if (valorGuia) partes.push(`+ guia ${reais.format(valorGuia)}`);
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
    if (campo && campo.type === "checkbox") campo.checked = !!v;
    else if (campo && "value" in campo && campo.tagName !== "OUTPUT") campo.value = v;
  });
  // A opção de guia só aparece nos modelos que têm guia
  const caixaGuia = el.querySelector(".item__guia");
  const mostrarGuia = () => {
    const m = MODELOS[sel.value];
    caixaGuia.hidden = !(m && m.guia);
    if (caixaGuia.hidden) caixaGuia.querySelector("input").checked = false;
  };
  sel.addEventListener("change", mostrarGuia);
  mostrarGuia();
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
    el.querySelectorAll("[data-campo]").forEach((c) => {
      if (c.type === "checkbox") d[c.dataset.campo] = c.checked ? "1" : "";
      else if (c.tagName !== "OUTPUT" && c.tagName !== "P") d[c.dataset.campo] = c.value;
    });
    return d;
  });
}

function totais() {
  const itens = lerItens().map((d) => ({ dados: d, r: calcularItem(d) }));
  const subtotal = itens.reduce((t, i) => t + i.r.total, 0);
  const frete = lerNumero(form.frete.value);
  // Ajuste em % sobre o valor total: "+10" aumenta 10%, "-10" (ou só "10") dá 10% de desconto
  const ajuste = String(form.descontoPct.value).trim();
  const pct = lerNumero(ajuste.replace(/^[+-]/, ""));
  const base = subtotal + frete;
  const acrescimo = pct && ajuste.startsWith("+") ? base * pct / 100 : 0;
  const desconto = lerNumero(form.desconto.value) + (pct && !ajuste.startsWith("+") ? base * pct / 100 : 0);
  return { itens, subtotal, frete, desconto, acrescimo, total: Math.max(0, base - desconto + acrescimo) };
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
  // Caixa do resumo: mostra desconto, acréscimo, ou o saldo quando houver os dois
  let rotulo = "Desconto", valor = reais.format(t.desconto);
  if (t.acrescimo && !t.desconto) { rotulo = "Acréscimo"; valor = `+ ${reais.format(t.acrescimo)}`; }
  else if (t.acrescimo && t.desconto) {
    const saldo = t.acrescimo - t.desconto;
    rotulo = "Ajuste";
    valor = `${saldo < 0 ? "- " : "+ "}${reais.format(Math.abs(saldo))}`;
  }
  document.querySelector("#r-ajuste-rotulo").textContent = rotulo;
  document.querySelector("#r-desconto").textContent = valor;
  document.querySelector("#r-total").textContent = reais.format(t.total);
  atualizarDatas(t);
  const p = condicoesPagamento(t.total);
  document.querySelector("#r-pagamento").textContent = t.total
    ? `À vista: ${reais.format(p.avista)} (${PAGAMENTO.descontoAvista}% de desconto) · Cartão: ${PAGAMENTO.parcelas}x de ${reais.format(p.parcela)} sem juros`
    : "";
  salvarRascunho();
}

// Validade (só orçamento) e previsão de entrega calculada pelos prazos dos itens
function atualizarDatas(t) {
  const ehPedido = form.tipo.value === "Pedido";
  document.querySelector("#campo-validade").hidden = ehPedido;
  if (form.data.value && !form.validade.value) form.validade.value = somarDias(form.data.value, VALIDADE_DIAS);

  const maiorPrazo = Math.max(0, ...t.itens.map((i) => (MODELOS[i.dados.modelo] || {}).prazo || 0));
  const dica = document.querySelector("#dica-prazo");
  if (!maiorPrazo || !form.data.value) { dica.textContent = ""; return; }
  if (form.previsaoAuto.value === "1") form.previsao.value = somarDiasUteis(form.data.value, maiorPrazo + DIAS_INSTALACAO);
  dica.textContent = form.previsaoAuto.value === "1"
    ? `Previsão calculada: ${maiorPrazo} dias úteis de produção (maior prazo entre os itens) + ${DIAS_INSTALACAO} de instalação.`
    : "Previsão definida à mão. Apague a data para voltar ao cálculo automático.";
}

/* ---------- Rascunho (só neste aparelho) ---------- */
function salvarRascunho() {
  try {
    const campos = {};
    [...form.elements].forEach((c) => {
      if (c.name && c.type !== "file") campos[c.name] = c.type === "checkbox" ? c.checked : c.value;
    });
    // Guarda também o nome do modelo, para o rascunho não trocar de modelo se a lista mudar
    const itens = lerItens().map((d) => ({ ...d, nome: MODELOS[d.modelo] ? MODELOS[d.modelo].nome : "" }));
    localStorage.setItem(chaveRascunho, JSON.stringify({ campos, itens }));
  } catch (e) {}
}
function carregarRascunho() {
  try { return JSON.parse(localStorage.getItem(chaveRascunho)); } catch (e) { return null; }
}
function proximoNumero() {
  try { const n = parseInt(localStorage.getItem(CHAVE_ULTIMO), 10); return n ? String(n + 1) : ""; } catch (e) { return ""; }
}
function novoOrcamento() {
  form.reset();
  listaItens.innerHTML = "";
  form.numero.value = proximoNumero();
  form.data.value = hoje();
  form.validade.value = somarDias(form.data.value, VALIDADE_DIAS);
  form.consideracoes.value = CONSIDERACOES_PADRAO;
  adicionarItem();
}

// Mudou a previsão na mão: para de calcular sozinho. Apagou: volta ao automático
form.previsao.addEventListener("input", () => { form.previsaoAuto.value = form.previsao.value ? "" : "1"; });
// Mudou a data do orçamento: a validade acompanha
form.data.addEventListener("change", () => { if (form.data.value) form.validade.value = somarDias(form.data.value, VALIDADE_DIAS); });

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
["frete", "desconto"].forEach((n) => form[n].addEventListener("input", () => soNumerosDecimal(form[n])));
// Ajuste (%): aceita um sinal + ou - no começo e depois só números
form.descontoPct.addEventListener("input", () => {
  const c = form.descontoPct;
  const sinal = (c.value.trim().match(/^[+-]/) || [""])[0];
  const resto = { value: c.value.replace(/^\s*[+-]/, "") };
  soNumerosDecimal(resto);
  const v = sinal + resto.value;
  if (v !== c.value) c.value = v;
});

form.addEventListener("input", atualizar);
form.addEventListener("change", atualizar);
document.querySelector("#add-item").addEventListener("click", () => adicionarItem());
document.querySelector("#novo").addEventListener("click", () => {
  if (!confirm("Começar um orçamento novo? O atual sai da tela.")) return;
  // Se veio de um link, o pedido dele continua guardado; o novo usa o rascunho geral
  if (chaveRascunho !== CHAVE_RASCUNHO) {
    chaveRascunho = CHAVE_RASCUNHO;
    history.replaceState(null, "", location.pathname);
    erro.hidden = true;
  }
  novoOrcamento();
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
  const tipo = f.tipo.value || "Orçamento"; // "Orçamento" ou "Pedido"
  const ocultarMedidas = f.ocultarMedidas.checked;

  // Cabeçalho
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...AZUL);
  doc.text(tipo.toUpperCase(), M, 13);
  doc.setDrawColor(...AZUL); doc.setLineWidth(0.4); doc.line(M + doc.getTextWidth(tipo.toUpperCase()) + 4, 12, W - M, 12);

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
  const info = [
    [`Nº do ${tipo}`, f.numero.value || "-"],
    ["Data", dataBR(f.data.value)],
    // Pedido fechado não tem validade
    ...(tipo === "Pedido" ? [] : [["Válido até", dataBR(f.validade.value) || "-"]]),
    ["Previsão de Entrega", dataBR(f.previsao.value) || "A combinar"],
    ["Valor Total", numero.format(t.total)],
  ];
  const colW = (W - 2 * M) / info.length;
  const ultima = info.length - 1;
  info.forEach(([rotulo, valor], i) => {
    const x = M + colW * i;
    const destaque = i === ultima;
    if (destaque) { doc.setFillColor(228, 232, 243); doc.rect(x, yi + 1.5, colW, 17, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...CINZA);
    doc.text(txt(rotulo), x + colW / 2, yi + 7, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(destaque ? 13 : 11.5);
    if (destaque) doc.setTextColor(...AZUL); else doc.setTextColor(30, 37, 35);
    doc.text(txt(valor), x + colW / 2, yi + 14.5, { align: "center" });
  });
  doc.setLineWidth(0.6); doc.line(M, yi + 20, W - M, yi + 20);

  // Tabela de itens
  const linhas = t.itens.filter((i) => MODELOS[i.dados.modelo]).map(({ dados, r }) => {
    const m = MODELOS[dados.modelo];
    const desc = [m.nome.toUpperCase(), m.guia && dados.guia && "Com guia", dados.descricao, !ocultarMedidas && r.medida].filter(Boolean).join("\n");
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
  const linhasTotais = [["SUBTOTAL", t.subtotal], ["FRETE", t.frete]];
  if (t.desconto || !t.acrescimo) linhasTotais.push(["DESCONTO", t.desconto]);
  if (t.acrescimo) linhasTotais.push(["ACRÉSCIMO", t.acrescimo]);
  linhasTotais.forEach(([r, v], i) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    doc.text(`${r}  ${txt(reais.format(v))}`, xr, yt + i * 5.5, { align: "right" });
  });
  const yTot = yt + linhasTotais.length * 5.5 + 3;
  doc.setDrawColor(...AZUL); doc.setLineWidth(0.4); doc.line(xr - 62, yTot - 4, xr, yTot - 4);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...AZUL);
  doc.text(`TOTAL  ${txt(reais.format(t.total))}`, xr, yTot + 1.5, { align: "right" });

  // Condições de pagamento, logo abaixo do total
  const pg = condicoesPagamento(t.total);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(30, 37, 35);
  doc.text(txt(`À vista: ${reais.format(pg.avista)} (${PAGAMENTO.descontoAvista}% de desconto)`), xr, yTot + 7.5, { align: "right" });
  doc.text(txt(`Cartão: ${PAGAMENTO.parcelas}x de ${reais.format(pg.parcela)} sem juros`), xr, yTot + 12, { align: "right" });
  const yFimTotais = yTot + 12;

  // Considerações gerais
  let yg = Math.max(yt + 5 + obs.length * 4, yFimTotais + 6) + 6;
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
    doc.text(`${tipo} Nº ${txt(f.numero.value)} - Pág. ${p}/${paginas}`, W - M, 291.5, { align: "right" });
  }

  const nomeArquivo = `${tipo === "Pedido" ? "Pedido" : "Orcamento"} ${f.numero.value || ""} - ${f.cliente.value || "cliente"}`.replace(/[\\/:*?"<>|]/g, "").trim();
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

// Identificador curto de cada link (para guardar o rascunho dele separado)
function idDoLink(texto) {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
  return h.toString(36);
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
      guia: p.g ? "1" : "",
      descricao: p.d || (indice < 0 && p.m ? p.m : ""),
    });
  });
  if (!pedido.length) adicionarItem();
  // Dados que o cliente preencheu no simulador (vêm no 1º item do link)
  const c = pedido[0] || {};
  if (c.cn) form.cliente.value = c.cn;
  if (c.cb) form.bairro.value = c.cb;
  if (c.co) form.obs.value = `Como conheceu: ${c.co}`;
}

// Abrir outro link com esta página já aberta: recarrega para carregar o pedido certo
window.addEventListener("hashchange", () => { if (lerPedidoDoLink()) location.reload(); });

/* ---------- Login ----------
   Login e senha são conferidos no servidor de acessos (Cloudflare Worker).
   Nada da senha fica no site. "edduardo" é o administrador. */
const API_ACESSOS = (() => {
  // Só na prévia local dá para apontar para outro servidor (testes)
  try { if (location.hostname === "localhost" && localStorage.getItem("edd-api")) return localStorage.getItem("edd-api"); } catch (e) {}
  return "https://edd-acessos.eddcortinas.workers.dev";
})();
const CHAVE_ACESSO = "edd-orcamento-acesso";
const formLogin = document.querySelector("#form-login");
const loginErro = document.querySelector("#login-erro");
const botaoAcessos = document.querySelector("#abrir-acessos");

function lerAcesso() {
  try { return localStorage.getItem(CHAVE_ACESSO) || sessionStorage.getItem(CHAVE_ACESSO) || ""; } catch (e) { return ""; }
}
function apagarAcesso() {
  try { localStorage.removeItem(CHAVE_ACESSO); sessionStorage.removeItem(CHAVE_ACESSO); } catch (e) {}
}
async function api(metodo, rota, corpo) {
  const acesso = lerAcesso();
  const r = await fetch(API_ACESSOS + rota, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(acesso ? { Authorization: `Bearer ${acesso}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  return { ...dados, ok: r.ok, status: r.status };
}
function mostrarErroLogin(texto) {
  loginErro.textContent = texto;
  loginErro.hidden = false;
}
function liberar(adm) {
  document.body.classList.remove("bloqueado");
  botaoAcessos.hidden = !adm;
  iniciar();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErro.hidden = true;
  const usuario = formLogin.usuario.value.trim().toLowerCase();
  // Tira espaços que o teclado do celular às vezes coloca no fim
  const senha = formLogin.senha.value.trim();
  if (!usuario || !senha) return mostrarErroLogin("Informe login e senha.");
  const botao = formLogin.querySelector("button");
  botao.disabled = true;
  let r = null;
  try { r = await api("POST", "/login", { usuario, senha }); } catch (err) {}
  botao.disabled = false;
  if (!r) return mostrarErroLogin("Sem conexão com o servidor. Confira a internet e tente de novo.");
  if (!r.ok) {
    formLogin.senha.value = "";
    formLogin.senha.focus();
    return mostrarErroLogin(r.erro || "Login ou senha incorretos.");
  }
  try { (formLogin.lembrar.checked ? localStorage : sessionStorage).setItem(CHAVE_ACESSO, r.acesso); } catch (err) {}
  formLogin.reset();
  liberar(r.adm);
});

document.querySelector("#sair").addEventListener("click", () => {
  apagarAcesso();
  location.reload();
});

/* ---------- Gerenciar acessos (só administrador) ---------- */
const painel = document.querySelector("#painel-acessos");
const formAcesso = document.querySelector("#form-acesso");
const listaAcessos = document.querySelector("#lista-acessos");
const msgAcessos = document.querySelector("#acessos-msg");

function avisoAcessos(texto, ok) {
  msgAcessos.textContent = texto;
  msgAcessos.style.color = ok ? "#1f6b33" : "";
  msgAcessos.hidden = !texto;
}
function botaoLinha(texto, acao) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn btn--linha";
  b.textContent = texto;
  b.addEventListener("click", async () => { b.disabled = true; await acao(); });
  return b;
}
async function carregarAcessos() {
  listaAcessos.innerHTML = '<li class="vazio">Carregando...</li>';
  const r = await api("GET", "/usuarios").catch(() => ({ ok: false, erro: "Sem conexão com o servidor." }));
  listaAcessos.innerHTML = "";
  if (!r.ok) return avisoAcessos(r.erro || "Não foi possível carregar a lista.");
  if (!r.usuarios.length) {
    listaAcessos.innerHTML = '<li class="vazio">Ninguém adicionado ainda. Só você (edduardo) tem acesso.</li>';
    return;
  }
  r.usuarios.forEach((u) => {
    const li = document.createElement("li");
    const email = document.createElement("span");
    email.className = "email";
    email.textContent = u.email;
    const status = document.createElement("span");
    status.className = `status${u.ativo ? "" : " status--bloq"}`;
    status.textContent = u.ativo ? "Liberado" : "Bloqueado";
    const alternar = botaoLinha(u.ativo ? "Bloquear" : "Desbloquear", async () => {
      const res = await api("POST", "/usuarios/status", { email: u.email, ativo: !u.ativo }).catch(() => ({ ok: false }));
      avisoAcessos(res.ok ? `${u.email} ${u.ativo ? "bloqueado" : "desbloqueado"}.` : res.erro || "Não deu certo, tente de novo.", res.ok);
      carregarAcessos();
    });
    const remover = botaoLinha("Remover", async () => {
      if (!confirm(`Remover ${u.email}? A pessoa perde o acesso.`)) return carregarAcessos();
      const res = await api("POST", "/usuarios/remover", { email: u.email }).catch(() => ({ ok: false }));
      avisoAcessos(res.ok ? `${u.email} removido.` : res.erro || "Não deu certo, tente de novo.", res.ok);
      carregarAcessos();
    });
    li.append(email, status, alternar, remover);
    listaAcessos.appendChild(li);
  });
}

botaoAcessos.addEventListener("click", () => {
  avisoAcessos("");
  painel.showModal();
  carregarAcessos();
});
document.querySelector("#fechar-acessos").addEventListener("click", () => painel.close());

formAcesso.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = formAcesso.email.value.trim().toLowerCase();
  const senha = formAcesso.senha.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return avisoAcessos("Digite um e-mail válido.");
  if (senha.length < 6) return avisoAcessos("A senha precisa ter pelo menos 6 caracteres.");
  const botao = formAcesso.querySelector("button");
  botao.disabled = true;
  const res = await api("POST", "/usuarios", { email, senha }).catch(() => ({ ok: false, erro: "Sem conexão com o servidor." }));
  botao.disabled = false;
  if (!res.ok) return avisoAcessos(res.erro || "Não deu certo, tente de novo.");
  avisoAcessos(res.atualizado ? `Senha de ${email} atualizada.` : `${email} adicionado. Passe o e-mail e a senha para a pessoa.`, true);
  formAcesso.reset();
  carregarAcessos();
});

/* ---------- Início (só depois do login) ---------- */
let iniciado = false;
async function iniciar() {
  if (iniciado) return;
  iniciado = true;
  await carregarModelos();
  const pedido = lerPedidoDoLink();
  // O link fica no endereço: abrir o mesmo link de novo volta para o mesmo orçamento,
  // e links de clientes diferentes nunca se sobrepõem
  if (pedido) chaveRascunho = `${CHAVE_RASCUNHO}-${idDoLink(location.hash)}`;
  const r = carregarRascunho();
  if (pedido && !(r && r.campos)) {
    carregarPedido(pedido);
    erro.textContent = "Pedido do cliente carregado. Confira as medidas da visita e preencha os dados do cliente.";
    erro.style.color = "#0B1D54";
    erro.hidden = false;
  } else if (r && r.campos) {
    Object.entries(r.campos).forEach(([k, v]) => {
      const c = form[k];
      if (!c || c.type === "file") return;
      if (c.type === "checkbox") c.checked = v === true;
      else c.value = v;
    });
    (r.itens && r.itens.length ? r.itens : [{}]).forEach(({ nome, ...d }) => {
      if (nome) { const i = MODELOS.findIndex((m) => m.nome === nome); d.modelo = i >= 0 ? String(i) : ""; }
      adicionarItem(d);
    });
  } else {
    novoOrcamento();
  }
  if (!form.consideracoes.value) form.consideracoes.value = CONSIDERACOES_PADRAO;
  if (!form.data.value) form.data.value = hoje();
  atualizar();
}

// Já entrou antes neste aparelho? Confirma com o servidor (vale bloqueio na hora)
(async () => {
  if (!lerAcesso()) return formLogin.usuario.focus();
  const r = await api("GET", "/eu").catch(() => null);
  if (r && r.ok) return liberar(r.adm);
  apagarAcesso();
  if (!r) mostrarErroLogin("Sem conexão com o servidor. Confira a internet e tente de novo.");
  else if (r.status === 401) mostrarErroLogin("Entre novamente.");
  formLogin.usuario.focus();
})();
