/* EDD Cortinas — acessos do gerador de orçamento (Cloudflare Worker)
   - "edduardo" é o administrador (senha conferida aqui, no servidor)
   - O administrador adiciona, bloqueia e remove e-mails; ninguém se cadastra sozinho
   - Lista guardada no KV ligado como USUARIOS */

const ADMIN = {
  usuario: "edduardo",
  salt: "__COPIAR_DO_WORKER_ATUAL__",
  hash: "__COPIAR_DO_WORKER_ATUAL__",
};
// Chave que assina os acessos (fica só aqui no servidor)
const CHAVE = "__COPIAR_DO_WORKER_ATUAL__";
const ITERACOES = 10000;
const VALIDADE_DIAS = 30;
const ORIGENS = ["https://eddcortinas.com.br", "https://www.eddcortinas.com.br", "https://eddcortinas.github.io", "http://localhost:5173"];

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const b64url = (s) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64url = (s) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

async function codigoSenha(senha, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: ITERACOES }, k, 256);
  return hex(bits);
}
async function assinar(texto) {
  const k = await crypto.subtle.importKey("raw", enc.encode(CHAVE), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(texto)));
}
function iguais(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function criarAcesso(u, adm) {
  const corpo = b64url(JSON.stringify({ u, adm, exp: Date.now() + VALIDADE_DIAS * 864e5 }));
  return `${corpo}.${await assinar(corpo)}`;
}
async function lerAcesso(req, env) {
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const [corpo, ass] = t.split(".");
  if (!corpo || !ass || !iguais(ass, await assinar(corpo))) return null;
  let d;
  try { d = JSON.parse(deB64url(corpo)); } catch (e) { return null; }
  if (!d.exp || d.exp < Date.now()) return null;
  if (d.adm) return d;
  // Usuário comum: confere na hora se continua liberado (bloqueio vale na hora)
  const reg = await env.USUARIOS.get(`u:${d.u}`, "json");
  return reg && reg.ativo ? d : null;
}

const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* ---------- Numeração por mês, separada para orçamento e pedido ----------
   Orçamento: ORC 10/26-001, ORC 10/26-002...  Pedido: PED 10/26-001...  Todo mês recomeça do 001.
   O mês é o da data do documento. */
const PREFIXO = { "Orçamento": "ORC", "Pedido": "PED" };
const RE_NUMERO = /^(ORC|PED) (\d{2})\/(\d{2})-(\d+)$/;
const tipoValido = (t) => (t === "Pedido" ? "Pedido" : "Orçamento");
function dataValida(d) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(d || ""))) return String(d);
  // Sem data: hoje no horário de Fortaleza (UTC-3)
  return new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);
}
function baseNumero(tipo, data) {
  const d = dataValida(data);
  return `${PREFIXO[tipoValido(tipo)]} ${d.slice(5, 7)}/${d.slice(2, 4)}-`;
}
const sequencia = (n) => { const m = RE_NUMERO.exec(String(n || "")); return m ? parseInt(m[4], 10) : 0; };
async function todasAsChaves(env) {
  const chaves = [];
  let cursor;
  do {
    const pag = await env.USUARIOS.list({ prefix: "o:", cursor });
    chaves.push(...pag.keys);
    cursor = pag.list_complete ? null : pag.cursor;
  } while (cursor);
  return chaves;
}
// Próximo número do mês e do tipo, olhando todos os documentos (de todos os usuários)
async function proximoNumero(env, tipo, data, ignorarId = "") {
  const base = baseNumero(tipo, data);
  let maior = 0;
  for (const k of await todasAsChaves(env)) {
    const n = (k.metadata || {}).n;
    if (k.name !== `o:${ignorarId}` && String(n || "").startsWith(base)) maior = Math.max(maior, sequencia(n));
  }
  return base + String(maior + 1).padStart(3, "0");
}

async function tratar(req, env) {
  const url = new URL(req.url);
  const rota = `${req.method} ${url.pathname}`;
  const dados = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  if (rota === "POST /login") {
    const usuario = String(dados.usuario || "").trim().toLowerCase();
    const senha = String(dados.senha || "").trim();
    if (!usuario || !senha) return [400, { erro: "Informe login e senha." }];
    if (usuario === ADMIN.usuario) {
      if (!iguais(await codigoSenha(senha, ADMIN.salt), ADMIN.hash)) return [401, { erro: "Login ou senha incorretos." }];
      return [200, { acesso: await criarAcesso(usuario, true), usuario, adm: true }];
    }
    const reg = await env.USUARIOS.get(`u:${usuario}`, "json");
    if (!reg || !iguais(await codigoSenha(senha, reg.salt), reg.hash)) return [401, { erro: "Login ou senha incorretos." }];
    if (!reg.ativo) return [403, { erro: "Seu acesso está bloqueado. Fale com o administrador." }];
    return [200, { acesso: await criarAcesso(usuario, false), usuario, adm: false }];
  }

  const quem = await lerAcesso(req, env);
  if (!quem) return [401, { erro: "Entre novamente." }];
  if (rota === "GET /eu") return [200, { usuario: quem.u, adm: !!quem.adm }];

  /* ---------- Orçamentos e pedidos salvos ----------
     Cada um vê os seus; o administrador vê todos. Chave "o:<id>".
     O resumo (nº, cliente, total, status...) vai nos metadados, para a lista não precisar abrir um por um. */
  const podeVer = (m) => quem.adm || m.d === quem.u;

  if (rota === "GET /orcamentos") {
    const itens = [];
    let cursor;
    do {
      const pag = await env.USUARIOS.list({ prefix: "o:", cursor });
      for (const k of pag.keys) {
        const m = k.metadata || {};
        if (podeVer(m)) itens.push({ id: k.name.slice(2), numero: m.n, tipo: m.t, cliente: m.c, bairro: m.b, total: m.v, status: m.s, dono: m.d, atualizado: m.a, data: m.dt || "", arquivado: !!m.x });
      }
      cursor = pag.list_complete ? null : pag.cursor;
    } while (cursor);
    itens.sort((a, b) => String(b.atualizado).localeCompare(String(a.atualizado)));
    return [200, { orcamentos: itens }];
  }

  if (rota === "GET /proximo-numero") {
    // ?tipo=Pedido&data=2026-10-16 -> "PED 10/26-004" (ignorar=<id>: não conta o próprio documento)
    const p = url.searchParams;
    return [200, { numero: await proximoNumero(env, p.get("tipo"), p.get("data"), p.get("ignorar") || "") }];
  }

  if (req.method === "GET" && url.pathname.startsWith("/orcamentos/")) {
    const id = url.pathname.split("/")[2];
    const { value, metadata } = await env.USUARIOS.getWithMetadata(`o:${id}`, "json");
    if (!value || !podeVer(metadata || {})) return [404, { erro: "Orçamento não encontrado." }];
    return [200, { id, status: metadata.s, dono: metadata.d, arquivado: !!metadata.x, dados: value }];
  }

  if (rota === "POST /orcamentos") {
    const r = dados.resumo || {};
    if (!dados.dados || typeof dados.dados !== "object") return [400, { erro: "Nada para salvar." }];
    if (JSON.stringify(dados.dados).length > 200000) return [400, { erro: "Orçamento grande demais." }];
    let id = String(dados.id || "");
    let meta = null;
    if (id) {
      meta = (await env.USUARIOS.getWithMetadata(`o:${id}`)).metadata;
      if (!meta) return [404, { erro: "Orçamento não encontrado." }];
      if (!podeVer(meta)) return [403, { erro: "Este orçamento é de outra pessoa." }];
    } else {
      id = hex(crypto.getRandomValues(new Uint8Array(8)));
    }
    // Numeração: sem número, pega o próximo do mês e do tipo
    let numero = String(r.numero || "").trim().slice(0, 20);
    // Documento novo com número automático que outra pessoa acabou de usar: pega o seguinte
    if (!meta && RE_NUMERO.test(numero)) {
      const usados = (await todasAsChaves(env)).map((k) => (k.metadata || {}).n);
      if (usados.includes(numero)) numero = "";
    }
    if (!numero) numero = await proximoNumero(env, r.tipo, r.data, id);
    if (dados.dados.campos) dados.dados.campos.numero = numero;
    const cortar = (s, t) => String(s || "").slice(0, t);
    const novoMeta = {
      n: numero, t: tipoValido(r.tipo), c: cortar(r.cliente, 80), b: cortar(r.bairro, 40),
      v: Math.round((Number(r.total) || 0) * 100) / 100,
      s: meta ? meta.s : "Orçamento", d: meta ? meta.d : quem.u, a: new Date().toISOString(), x: meta ? meta.x : 0,
      dt: /^\d{4}-\d{2}-\d{2}$/.test(String(r.data || "")) ? r.data : (meta && meta.dt) || "",
    };
    await env.USUARIOS.put(`o:${id}`, JSON.stringify(dados.dados), { metadata: novoMeta });
    return [200, { id, numero, status: novoMeta.s }];
  }

  if (rota === "POST /orcamentos/status" || rota === "POST /orcamentos/arquivar") {
    const id = String(dados.id || "");
    const { value, metadata } = await env.USUARIOS.getWithMetadata(`o:${id}`);
    if (!value || !metadata || !podeVer(metadata)) return [404, { erro: "Orçamento não encontrado." }];
    if (rota.endsWith("/status")) {
      const validos = ["Orçamento", "Aprovado", "Em produção", "Pronto", "Instalado", "Perdido"];
      if (!validos.includes(dados.status)) return [400, { erro: "Status inválido." }];
      metadata.s = dados.status;
    } else {
      metadata.x = dados.arquivado ? 1 : 0;
    }
    metadata.a = new Date().toISOString();
    await env.USUARIOS.put(`o:${id}`, value, { metadata });
    return [200, { ok: true }];
  }

  // Daqui para baixo, só o administrador
  if (!quem.adm) return [403, { erro: "Só o administrador pode fazer isso." }];

  /* Reorganiza a numeração de TODOS os documentos salvos (arquivados também):
     separa por tipo e pelo mês da data do documento e numera em ordem de data (001, 002...).
     { aplicar: false } só mostra como ficaria; { aplicar: true } grava. A data de "alterado em" não muda. */
  if (rota === "POST /orcamentos/renumerar") {
    const docs = [];
    for (const k of await todasAsChaves(env)) {
      const { value, metadata } = await env.USUARIOS.getWithMetadata(k.name, "json");
      if (!value) continue;
      const m = metadata || {};
      const c = value.campos || {};
      const data = /^\d{4}-\d{2}-\d{2}$/.test(String(c.data || "")) ? c.data : (m.dt || String(m.a || "").slice(0, 10));
      docs.push({ chave: k.name, value, m, tipo: tipoValido(m.t || c.tipo), data: dataValida(data), antigo: String(m.n || "") });
    }
    // Ordem: data do documento; no mesmo dia, o número antigo; depois a hora em que foi salvo
    const ordemAntiga = (n) => sequencia(n) || parseInt(n, 10) || 0;
    docs.sort((a, b) => a.data.localeCompare(b.data) || ordemAntiga(a.antigo) - ordemAntiga(b.antigo) || String(a.m.a).localeCompare(String(b.m.a)));
    const contagem = {};
    for (const d of docs) {
      const base = baseNumero(d.tipo, d.data);
      contagem[base] = (contagem[base] || 0) + 1;
      d.novo = base + String(contagem[base]).padStart(3, "0");
    }
    const mudancas = docs.filter((d) => d.novo !== d.antigo || d.m.dt !== d.data);
    if (dados.aplicar) {
      for (const d of mudancas) {
        d.value.campos = { ...(d.value.campos || {}), numero: d.novo };
        await env.USUARIOS.put(d.chave, JSON.stringify(d.value), { metadata: { ...d.m, n: d.novo, t: d.tipo, dt: d.data } });
      }
    }
    return [200, {
      total: docs.length,
      aplicado: !!dados.aplicar,
      mudancas: mudancas.filter((d) => d.novo !== d.antigo).map((d) => ({ id: d.chave.slice(2), tipo: d.tipo, cliente: d.m.c || "", data: d.data, de: d.antigo, para: d.novo })),
    }];
  }

  if (rota === "GET /usuarios") {
    const lista = await env.USUARIOS.list({ prefix: "u:" });
    const usuarios = [];
    for (const k of lista.keys) {
      const r = await env.USUARIOS.get(k.name, "json");
      if (r) usuarios.push({ email: k.name.slice(2), ativo: r.ativo, criado: r.criado });
    }
    usuarios.sort((a, b) => a.email.localeCompare(b.email));
    return [200, { usuarios }];
  }
  if (rota === "POST /usuarios") {
    const email = String(dados.email || "").trim().toLowerCase();
    const senha = String(dados.senha || "").trim();
    if (!emailValido(email)) return [400, { erro: "E-mail inválido." }];
    if (senha.length < 6) return [400, { erro: "A senha precisa ter pelo menos 6 caracteres." }];
    const antigo = await env.USUARIOS.get(`u:${email}`, "json");
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    await env.USUARIOS.put(`u:${email}`, JSON.stringify({
      salt, hash: await codigoSenha(senha, salt), ativo: true, criado: antigo ? antigo.criado : new Date().toISOString(),
    }));
    return [200, { ok: true, atualizado: !!antigo }];
  }
  if (rota === "POST /usuarios/status") {
    const email = String(dados.email || "").trim().toLowerCase();
    const r = await env.USUARIOS.get(`u:${email}`, "json");
    if (!r) return [404, { erro: "E-mail não encontrado." }];
    r.ativo = !!dados.ativo;
    await env.USUARIOS.put(`u:${email}`, JSON.stringify(r));
    return [200, { ok: true }];
  }
  if (rota === "POST /usuarios/remover") {
    const email = String(dados.email || "").trim().toLowerCase();
    await env.USUARIOS.delete(`u:${email}`);
    return [200, { ok: true }];
  }
  return [404, { erro: "Rota não encontrada." }];
}

export default {
  async fetch(req, env) {
    const origem = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGENS.includes(origem) ? origem : ORIGENS[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    let status, corpo;
    try { [status, corpo] = await tratar(req, env); }
    catch (e) { status = 500; corpo = { erro: "Erro no servidor. Tente de novo." }; }
    return new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
  },
};
