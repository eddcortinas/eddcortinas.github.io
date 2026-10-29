# Gera catalogo.html: textos e fotos das páginas de modelo; PREÇOS e prazos lidos do index.html (fonte única).
import os, re, sys, runpy, tempfile, html
from urllib.parse import quote

RAIZ = sys.argv[1]
AQUI = os.path.dirname(os.path.abspath(__file__))

# Carrega a lista de modelos sem regravar as páginas do site
saida = tempfile.mkdtemp()
sys.argv = ["gerar_modelos.py", saida]
dados = runpy.run_path(os.path.join(AQUI, "gerar_modelos.py"))
MODELOS, brl, WHATS = dados["MODELOS"], dados["brl"], dados["WHATS"]

index = open(os.path.join(RAIZ, "index.html"), encoding="utf-8").read()
OPCOES = {}
for attrs, nome in re.findall(r'<option (data-preco="[^>]*)>([^<]+)</option>', index):
    a = dict(re.findall(r'data-([a-z-]+)="([^"]*)"', attrs))
    OPCOES[html.unescape(nome.strip())] = a

# Fotos de projeto com a descrição que já está no site
PROJETOS = re.findall(r'<img src="img/(projeto-\d+\.jpg)" alt="([^"]+)"', index)

V = 1
e = html.escape

def card(m):
    op = OPCOES[m["nome"]]
    preco = float(op["preco"])
    prazo = int(op["prazo"]) + 2
    tecido = op.get("calculo") == "tecido"
    rotulo = "metro de tecido a partir de" if tecido else "m² a partir de"
    extras = []
    if op.get("guia"):
        extras.append(f"Guia opcional: {brl(float(op['guia']))} por metro")
    if op.get("acessorios"):
        extras.append(f"{op.get('acessorios-nome', 'acessórios').capitalize()}: {brl(float(op['acessorios']))} por peça")
    if m["slug"] == "persiana-vertical-tecido":
        extras.append("Versão blackout a partir de R$ 203,90 por m²")
    if m["slug"] == "cortina-double-vision":
        extras.append("Não inclui o reposteiro de tecido")
    garantia = "Garantia de 5 anos" if m.get("garantia_moto") else "Garantia de 12 meses"
    msg = f"Olá, EDD Cortinas! Vi o catálogo e gostaria de um orçamento de {m['nome'].lower()}."
    fotos = "".join(
        f'<img src="img/{f}" alt="{e(a)}" loading="lazy">' for f, a in m["fotos"][:3])
    return f"""
      <article class="cat-item" id="{m['slug']}">
        <figure class="cat-item__foto media" data-label="Foto: {e(m['nome'].lower())}">
          <img src="img/{m['img']}" alt="{e(m['alt'])}" loading="lazy" width="720" height="720">
        </figure>
        <div class="cat-item__texto">
          <h3>{e(m['nome'])}</h3>
          <p>{e(m['texto'][0])}</p>
          <p class="cat-item__preco">{rotulo} <strong>{brl(preco)}</strong>{e(m.get('preco_sufixo', ''))}</p>
          <ul class="cat-item__dados">
            <li>Prazo: até {prazo} dias úteis após a medição</li>
            <li>{garantia} · instalação inclusa</li>
            {''.join(f'<li>{e(x)}</li>' for x in extras)}
          </ul>
          {f'<div class="cat-item__mini">{fotos}</div>' if fotos else ''}
          <div class="cat-item__acoes">
            <a class="btn btn--primary btn--sm" href="https://wa.me/{WHATS}" data-whatsapp data-msg="{e(msg)}" target="_blank" rel="noopener">Pedir orçamento</a>
            <a class="btn btn--outline btn--sm" href="/{m['slug']}">Ver detalhes</a>
          </div>
        </div>
      </article>"""

def grupo(nome):
    return "".join(card(m) for m in MODELOS if m["grupo"] == nome)

indice = "".join(f'<li><a href="#{m["slug"]}">{e(m["nome"])}</a></li>' for m in MODELOS)
toldo = OPCOES["Toldo vertical (tela screen 5%)"]
galeria = "".join(f'<figure class="media"><img src="img/{f}" alt="{e(a)}" loading="lazy"></figure>' for f, a in PROJETOS)

pagina = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Catálogo | EDD Cortinas</title>
  <meta name="description" content="Catálogo da EDD Cortinas: cortinas e persianas sob medida em Fortaleza, com fotos, preços a partir de, prazos e garantia.">
  <meta name="robots" content="noindex, follow">
  <meta name="theme-color" content="#0B1D54">
  <meta property="og:title" content="Catálogo EDD Cortinas – cortinas e persianas sob medida">
  <meta property="og:description" content="Modelos, fotos de projetos, preços a partir de e prazos. Visita técnica sem compromisso em Fortaleza e todo o Ceará.">
  <meta property="og:image" content="https://eddcortinas.com.br/img/og-image.jpg">
  <meta property="og:url" content="https://eddcortinas.com.br/catalogo">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <link rel="icon" href="img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="img/favicon-180.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css?v=29">
  <link rel="stylesheet" href="css/catalogo.css?v={V}">
</head>
<body class="catalogo">

  <!-- CAPA -->
  <header class="cat-capa">
    <div class="cat-capa__texto">
      <img class="cat-capa__logo" src="img/logo-edd-cortinas-sem-sombra.png" alt="EDD Cortinas – Estilo em sua decoração" width="537" height="246">
      <p class="eyebrow">Catálogo {e('2026')}</p>
      <h1>Cortinas e persianas sob medida</h1>
      <p class="cat-capa__lead">Da medição à instalação, em Fortaleza e todo o Ceará.</p>
      <ul class="cat-selos">
        <li>Visita e medição sem compromisso</li>
        <li>Instalação inclusa</li>
        <li>Garantia de até 5 anos</li>
        <li><strong>4,8 ★</strong> no Google (19 avaliações)</li>
      </ul>
      <div class="cat-capa__acoes nao-imprime">
        <a class="btn btn--primary" href="https://wa.me/{WHATS}" data-whatsapp data-msg="Olá, EDD Cortinas! Vi o catálogo e gostaria de agendar uma visita." target="_blank" rel="noopener">Agendar visita no WhatsApp</a>
        <button type="button" class="btn btn--outline" id="compartilhar">Compartilhar catálogo</button>
        <a class="btn btn--outline" href="catalogo-edd-cortinas.pdf" download>Baixar em PDF</a>
      </div>
    </div>
    <figure class="cat-capa__foto media">
      <img src="img/hero.jpg" alt="Janela alta com cortina de voil sob medida instalada pela EDD Cortinas em Fortaleza" width="900" height="1200" fetchpriority="high">
    </figure>
  </header>

  <nav class="cat-indice nao-imprime" aria-label="Modelos do catálogo">
    <ul>{indice}<li><a href="#toldos-servicos">Toldos e serviços</a></li><li><a href="#projetos">Projetos</a></li></ul>
  </nav>

  <main>
    <section class="cat-secao">
      <h2>Cortinas</h2>
      {grupo('Cortinas')}
    </section>

    <section class="cat-secao">
      <h2>Persianas</h2>
      {grupo('Persianas')}
    </section>

    <section class="cat-secao" id="toldos-servicos">
      <h2>Toldos e serviços</h2>
      <div class="cat-servicos">
        <div class="cat-servico">
          <h3>Toldo vertical (tela screen 5%)</h3>
          <p>Toldos sob medida para varandas, janelas e fachadas, protegendo do sol e da chuva.</p>
          <p class="cat-item__preco">m² a partir de <strong>{brl(float(toldo['preco']))}</strong> + {brl(float(toldo['acessorios']))} de acessórios por peça</p>
        </div>
        <div class="cat-servico">
          <h3>Higienização</h3>
          <p>Limpeza de cortinas e persianas para tirar poeira e manchas e deixar o ambiente mais saudável.</p>
        </div>
        <div class="cat-servico">
          <h3>Manutenção</h3>
          <p>Ajustes, troca de peças e reparos em cortinas e persianas, inclusive motorizadas. O serviço tem 90 dias de garantia.</p>
        </div>
      </div>
    </section>

    <section class="cat-secao" id="projetos">
      <h2>Projetos da EDD</h2>
      <div class="cat-galeria">{galeria}</div>
    </section>

    <section class="cat-secao cat-como">
      <h2>Como funciona</h2>
      <ol>
        <li><strong>Contato</strong> Fale com a gente pelo WhatsApp e conte o que você precisa.</li>
        <li><strong>Visita técnica</strong> Medimos as janelas, mostramos amostras e entendemos a luz de cada ambiente.</li>
        <li><strong>Orçamento</strong> Você recebe um orçamento detalhado e sem compromisso.</li>
        <li><strong>Instalação</strong> Produzimos tudo sob medida e nossa equipe instala.</li>
      </ol>
      <p class="cat-nota">Preços “a partir de”, por m² (nas cortinas de tecido, por metro de tecido: 3 vezes a largura da janela), com área mínima de 1,5 por peça. O valor final é confirmado no orçamento, depois da medição e da escolha do tecido e dos acessórios. Prazos em dias úteis após a medição (produção + instalação).</p>
    </section>
  </main>

  <footer class="cat-contato">
    <img src="img/logo-edd-cortinas-sem-sombra.png" alt="EDD Cortinas" width="537" height="246" loading="lazy">
    <ul>
      <li>WhatsApp <a href="https://wa.me/5585987334369" data-whatsapp target="_blank" rel="noopener">(85) 9 8733-4369</a> · <a href="https://wa.me/5585992309555" target="_blank" rel="noopener">(85) 9 9230-9555</a></li>
      <li>Instagram <a href="https://www.instagram.com/eddcortinas/" data-instagram target="_blank" rel="noopener">@eddcortinas</a> · <a href="https://eddcortinas.com.br">eddcortinas.com.br</a></li>
      <li>Rua 906, 35 · Conjunto Ceará II · Fortaleza/CE · Atendimento 24 horas</li>
      <li>CNPJ 72.170.673/0001-09</li>
    </ul>
  </footer>

  <a href="https://wa.me/{WHATS}" class="whatsapp-float nao-imprime" data-whatsapp data-msg="Olá, EDD Cortinas! Vi o catálogo e gostaria de um orçamento." target="_blank" rel="noopener" aria-label="Conversar no WhatsApp">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.65-4.95A9 9 0 1 1 8 19.4L3 21z"/><g transform="translate(7.3 7.3) scale(.4)" stroke-width="4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></g></svg>
  </a>

  <script src="js/catalogo.js?v={V}" defer></script>
</body>
</html>
"""
open(os.path.join(RAIZ, "catalogo.html"), "w", encoding="utf-8").write(pagina)
print("ok:", len(MODELOS), "modelos,", len(PROJETOS), "fotos de projeto")
