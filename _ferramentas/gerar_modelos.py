# Gera as páginas de cada modelo a partir dos dados que já estão no index.html.
import json, os, sys
from urllib.parse import quote

RAIZ = sys.argv[1]
V_CSS, V_JS = 29, 1
SITE = "https://eddcortinas.com.br"
WHATS = "5585987334369"

def brl(v):
    s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return "R$ " + s

TECIDO_CALC = "Calculada pelo metro de tecido: 3 vezes a largura da janela, com mínimo de 1,5 m de tecido por peça."
M2_CALC = "Calculado pela área da janela (largura × altura), com área mínima de 1,5 m² por peça."

MODELOS = [
  dict(slug="cortina-de-tecido", nome="Cortina de tecido", grupo="Cortinas", img="produto-tecido.jpg",
       alt="Cortina de tecido em sala de TV, instalada pela EDD Cortinas em Fortaleza",
       resumo="Linho, voil e fendy, feita sob medida para a sua janela.",
       texto=["A cortina de tecido é a escolha clássica para salas e quartos: deixa o ambiente mais aconchegante e combina com qualquer decoração.",
              "Trabalhamos com linho, voil e fendy. Na visita técnica levamos amostras para você ver e tocar o tecido antes de escolher."],
       preco=100.00, unidade="tecido", prazo=10,
       fotos=[("projeto-03.jpg","Cortina de tecido em sala de estar, projeto da EDD Cortinas em Fortaleza"),
              ("projeto-18.jpg","Cortina de tecido em sala, projeto da EDD Cortinas em Fortaleza"),
              ("projeto-01.jpg","Cortina de tecido sobre persiana de madeira, projeto da EDD Cortinas em Fortaleza"),
              ("projeto-19.jpg","Cortina de tecido em espaço de academia, projeto da EDD Cortinas em Fortaleza")]),
  dict(slug="cortina-blackout", nome="Cortina de tecido com blackout", grupo="Cortinas", img="produto-tecido-blackout.jpg",
       alt="Cortina de tecido com forro blackout instalada pela EDD Cortinas",
       resumo="Tecido com forro blackout que bloqueia a luz.",
       texto=["A cortina de tecido com blackout tem um forro que bloqueia a luz. É muito procurada para quartos e salas de TV, onde a claridade incomoda.",
              "Por fora, fica com o caimento e a beleza de uma cortina de tecido."],
       preco=173.91, unidade="tecido", prazo=10,
       fotos=[("produto-blackout-acortinado.jpg","Cortina de tecido com blackout em quarto, projeto da EDD Cortinas em Fortaleza")]),
  dict(slug="cortina-rolo", nome="Cortina rolô", grupo="Cortinas", img="produto-rolo.jpg",
       alt="Cortina rolô tela solar em janela, instalada pela EDD Cortinas",
       resumo="Coleções em tela solar, blackout, pimpoint e mais.",
       texto=["A cortina rolô é prática e moderna: o tecido enrola na parte de cima e ocupa pouco espaço. Vai bem em salas, quartos, varandas e cozinhas.",
              "Temos coleções em tela solar, blackout, pimpoint e mais. Se quiser, a cortina pode levar guia (opcional)."],
       preco=234.50, unidade="m2", prazo=5,
       extras=["Guia opcional: " + brl(110.00) + " por metro (altura × 2 + largura, por peça)."],
       fotos=[("projeto-02.jpg","Cortinas rolô tela solar em varanda, projeto da EDD Cortinas em Fortaleza"),
              ("projeto-08.jpg","Cortina rolô tela solar em varanda com vista, projeto da EDD Cortinas em Fortaleza"),
              ("projeto-11.jpg","Cortina rolô em quarto, projeto da EDD Cortinas em Fortaleza"),
              ("projeto-16.jpg","Cortina rolô em cozinha, projeto da EDD Cortinas em Fortaleza"),
              ("projeto-17.jpg","Cortina rolô em sala de jantar com vista, projeto da EDD Cortinas em Fortaleza")]),
  dict(slug="cortina-romana", nome="Cortina romana", grupo="Cortinas", img="produto-romana.jpg",
       alt="Cortina romana em janela, instalada pela EDD Cortinas em Fortaleza",
       resumo="Dobras horizontais elegantes que sobem e descem.",
       texto=["A cortina romana forma dobras horizontais quando sobe e fica lisa quando desce. É elegante e ocupa pouco espaço na lateral da janela."],
       preco=361.29, unidade="m2", prazo=12,
       fotos=[("projeto-15.jpg","Cortina romana, projeto da EDD Cortinas em Fortaleza"),
              ("produto-painel-romano.jpg","Cortina romana em painéis ocupando a parede do quarto, projeto da EDD Cortinas em Fortaleza")]),
  dict(slug="cortina-painel", nome="Cortina painel", grupo="Cortinas", img="produto-painel.jpg",
       alt="Cortina painel em quarto com vista, instalada pela EDD Cortinas",
       resumo="Painéis deslizantes, ótimos para janelas amplas e portas de vidro.",
       texto=["A cortina painel é formada por painéis que deslizam lado a lado. É ótima para janelas amplas e portas de vidro."],
       preco=190.46, unidade="m2", prazo=10, fotos=[]),
  dict(slug="cortina-double-vision", nome="Cortina double vision", grupo="Cortinas", img="produto-double-vision.jpg",
       alt="Cortina double vision em escritório, instalada pela EDD Cortinas",
       resumo="Off white, sand, black e mais.",
       texto=["A cortina double vision tem faixas que se alternam, permitindo regular a entrada de luz e a privacidade.",
              "Cores off white, sand, black e mais. O preço não inclui o reposteiro de tecido."],
       preco=431.20, unidade="m2", prazo=10, fotos=[]),
  dict(slug="cortina-motorizada", nome="Cortina motorizada", grupo="Cortinas", img="produto-motorizada.jpg",
       alt="Cortinas rolô motorizadas em sala de jantar com vista, instaladas pela EDD Cortinas",
       resumo="Cortina rolô com motor e controle remoto. Também motorizamos outros modelos.",
       texto=["A cortina motorizada é uma cortina rolô com motor e controle remoto: abre e fecha sem esforço. Também motorizamos outros modelos.",
              "A pré-disposição elétrica (ponto de energia perto da janela) fica por conta do cliente. Na visita técnica orientamos onde o ponto deve ficar."],
       preco=259.00, unidade="m2", prazo=12, garantia_moto=True,
       extras=["Motor: " + brl(1220.00) + " por peça."],
       preco_sufixo=" + motor", fotos=[]),
  dict(slug="persiana-vertical-tecido", nome="Persiana vertical de tecido", grupo="Persianas", img="produto-vertical-tecido.jpg",
       alt="Persiana vertical de tecido azul em sala de treinamento, instalada pela EDD Cortinas",
       resumo="Translúcida ou blackout.",
       texto=["A persiana vertical de tecido tem lâminas na vertical que giram e correm para o lado. É muito usada em salas, escritórios e janelas largas.",
              "Pode ser translúcida ou blackout."],
       preco=169.90, unidade="m2", prazo=5,
       extras=["Versão blackout: a partir de " + brl(203.90) + " por m²."], fotos=[]),
  dict(slug="persiana-vertical-pvc", nome="Persiana vertical de PVC", grupo="Persianas", img="produto-vertical-pvc.jpg",
       alt="Persiana vertical de PVC em escritório, instalada pela EDD Cortinas",
       resumo="Prática e fácil de limpar, ideal para escritórios e quartos.",
       texto=["A persiana vertical de PVC é prática e fácil de limpar. É ideal para escritórios e quartos."],
       preco=234.00, unidade="m2", prazo=5, fotos=[]),
  dict(slug="persiana-horizontal-25mm", nome="Persiana horizontal 25 mm", grupo="Persianas", img="produto-horizontal-25.jpg",
       alt="Persiana horizontal 25 mm em sala de aula, instalada pela EDD Cortinas",
       resumo="Lâminas finas que regulam a luz com precisão.",
       texto=["A persiana horizontal 25 mm tem lâminas finas que giram para regular a luz com precisão. Vai bem em salas, quartos, escritórios e salas de aula."],
       preco=242.67, unidade="m2", prazo=5,
       fotos=[("projeto-20.jpg","Persiana horizontal em sala de aula, projeto da EDD Cortinas em Fortaleza")]),
  dict(slug="persiana-horizontal-50mm-aluminio", nome="Persiana horizontal 50 mm alumínio", grupo="Persianas", img="produto-ph50.jpg",
       alt="Persiana horizontal 50 mm de alumínio preta em sala de reunião, instalada pela EDD Cortinas",
       resumo="Lâminas largas de alumínio, visual moderno.",
       texto=["A persiana horizontal 50 mm de alumínio tem lâminas largas e visual moderno, ótima para salas de reunião, escritórios e ambientes contemporâneos."],
       preco=476.26, unidade="m2", prazo=12, fotos=[]),
  dict(slug="persiana-horizontal-50mm-madeira", nome="Persiana horizontal 50 mm madeira", grupo="Persianas", img="produto-horizontal-50-madeira.jpg",
       alt="Persiana horizontal 50 mm de madeira com cortina de tecido, instalada pela EDD Cortinas",
       resumo="Lâminas de madeira que deixam o ambiente aconchegante.",
       texto=["A persiana horizontal 50 mm de madeira tem lâminas largas de madeira que deixam o ambiente aconchegante. Combina muito bem com uma cortina de tecido por cima."],
       preco=1093.76, unidade="m2", prazo=12,
       fotos=[("projeto-01.jpg","Cortina de tecido sobre persiana de madeira, projeto da EDD Cortinas em Fortaleza")]),
]

ICON_WHATS = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.65-4.95A9 9 0 1 1 8 19.4L3 21z"/><g transform="translate(7.3 7.3) scale(.4)" stroke-width="4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></g></svg>'

def pagina(m):
    url = f"{SITE}/{m['slug']}"
    tecido = m["unidade"] == "tecido"
    rotulo_preco = "metro de tecido a partir de" if tecido else "m² a partir de"
    preco = brl(m["preco"])
    titulo = f"{m['nome']} sob medida em Fortaleza | EDD Cortinas"
    desc = (f"{m['nome']} sob medida em Fortaleza e todo o Ceará. {m['resumo']} "
            f"{rotulo_preco.capitalize()} {preco}. Visita técnica sem compromisso e instalação inclusa.")
    msg = f"Olá, EDD Cortinas! Vim pelo site e gostaria de um orçamento de {m['nome'].lower()}."
    simular = "/?modelo=" + quote(m["nome"]) + "#simulador"
    garantia = ("60 meses (5 anos) de garantia, desde que as manutenções e assistências sejam feitas pela EDD Cortinas"
                if m.get("garantia_moto") else "12 meses de garantia contra defeitos de fabricação e instalação")
    calc = TECIDO_CALC if tecido else M2_CALC
    extras = "".join(f"<li>{e}</li>" for e in m.get("extras", []))
    texto = "\n".join(f"          <p>{p}</p>" for p in m["texto"])

    fotos = ""
    if m["fotos"]:
        itens = "\n".join(
            f'          <figure class="media modelo__foto" data-label="Foto de projeto ({f})"><img src="img/{f}" alt="{a}" loading="lazy"></figure>'
            for f, a in m["fotos"])
        fotos = f"""
    <section class="section section--soft">
      <div class="container">
        <div class="section__head">
          <p class="eyebrow">Projetos</p>
          <h2>{m['nome']} em projetos da EDD</h2>
        </div>
        <div class="modelo__fotos">
{itens}
        </div>
      </div>
    </section>
"""

    outros = "\n".join(
        f'          <li><a href="/{o["slug"]}">{o["nome"]}</a></li>' for o in MODELOS if o is not m)

    ld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": m["grupo"], "item": SITE + "/#produtos"},
            {"@type": "ListItem", "position": 3, "name": m["nome"], "item": url},
        ],
    }

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{titulo}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#0B1D54">
  <link rel="canonical" href="{url}">

  <meta property="og:url" content="{url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="EDD Cortinas">
  <meta property="og:title" content="{titulo}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{SITE}/img/{m['img']}">
  <meta property="og:image:alt" content="{m['alt']}">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="img/favicon-180.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css?v={V_CSS}">

  <script type="application/ld+json">
  {json.dumps(ld, ensure_ascii=False)}
  </script>
</head>
<body>

  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

  <header class="header" id="topo">
    <div class="container header__inner">
      <a href="/" class="logo" aria-label="EDD Cortinas, ir para a página inicial">
        <img src="img/logo-edd-cortinas-sem-sombra.png" alt="EDD Cortinas – Estilo em sua decoração" width="537" height="246">
      </a>

      <nav class="nav" id="menu" aria-label="Menu principal">
        <ul class="nav__list">
          <li><a href="/#sobre" class="nav__link">Sobre</a></li>
          <li><a href="/#produtos" class="nav__link is-active">Produtos</a></li>
          <li><a href="/#simulador" class="nav__link">Simular orçamento</a></li>
          <li><a href="/#como-funciona" class="nav__link">Como funciona</a></li>
          <li><a href="/#projetos" class="nav__link">Projetos</a></li>
          <li><a href="/#contato" class="nav__link">Contato</a></li>
        </ul>
        <a href="/#contato" class="btn btn--primary nav__cta">Orçamento grátis</a>
      </nav>

      <button class="hamburger" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <main id="conteudo">

    <section class="hero hero--modelo">
      <div class="container">
        <nav class="trilha" aria-label="Você está em">
          <a href="/">Início</a> <span aria-hidden="true">›</span>
          <a href="/#produtos">{m['grupo']}</a> <span aria-hidden="true">›</span>
          <span aria-current="page">{m['nome']}</span>
        </nav>
        <div class="hero__inner">
          <div class="hero__text">
            <p class="eyebrow">{m['grupo']} sob medida em Fortaleza</p>
            <h1>{m['nome']}</h1>
{texto.replace('<p>', '<p class="hero__lead">', 1)}
            <p class="modelo__preco">{rotulo_preco} <strong>{preco}</strong>{m.get('preco_sufixo', '')}</p>
            <div class="hero__actions">
              <a href="{simular}" class="btn btn--primary btn--lg">Simular este modelo</a>
              <a href="https://wa.me/{WHATS}" class="btn btn--outline btn--lg" data-whatsapp data-msg="{msg}" target="_blank" rel="noopener">
                {ICON_WHATS}
                Pedir orçamento
              </a>
            </div>
          </div>
          <figure class="hero__media media" data-label="Foto: {m['nome'].lower()} (img/{m['img']})">
            <img src="img/{m['img']}" alt="{m['alt']}" width="720" height="720" fetchpriority="high">
          </figure>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container modelo__info">
        <div class="card modelo__bloco">
          <h2>Como é calculado</h2>
          <ul>
            <li>{calc}</li>
            {extras}
            <li>O valor final depende das medidas, do tecido e dos acessórios, e é confirmado no orçamento depois da medição.</li>
          </ul>
        </div>
        <div class="card modelo__bloco">
          <h2>Prazo e garantia</h2>
          <ul>
            <li>Prazo: até {m['prazo'] + 2} dias úteis após a medição (produção + instalação).</li>
            <li>{garantia}.</li>
            <li>Visita técnica e medição gratuitas e sem compromisso.</li>
            <li>Instalação inclusa.</li>
          </ul>
        </div>
      </div>
    </section>
{fotos}
    <section class="section">
      <div class="container">
        <div class="section__head">
          <p class="eyebrow">Outros modelos</p>
          <h2>Conheça também</h2>
        </div>
        <ul class="modelo__outros">
{outros}
        </ul>
        <p class="modelo__voltar"><a href="/#produtos" class="btn btn--outline">Ver todos os produtos com preços</a></p>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <a href="/" class="logo logo--light" aria-label="EDD Cortinas, ir para a página inicial">
          <img src="img/logo-edd-cortinas-sem-sombra.png" alt="EDD Cortinas – Estilo em sua decoração" width="537" height="246" loading="lazy">
        </a>
        <p>Cortinas e persianas sob medida em Fortaleza e todo o Ceará.</p>
      </div>

      <ul class="footer__links">
        <li><a href="https://www.instagram.com/eddcortinas/" target="_blank" rel="noopener" data-instagram>Instagram @eddcortinas</a></li>
        <li><a href="https://wa.me/{WHATS}" target="_blank" rel="noopener" data-whatsapp>WhatsApp (85) 9 8733-4369</a></li>
        <li><a href="https://wa.me/5585992309555" target="_blank" rel="noopener">WhatsApp (85) 9 9230-9555</a></li>
        <li><a href="/#duvidas">Dúvidas frequentes</a></li>
      </ul>

      <p class="footer__legal">© <span id="ano">2026</span> EDD Cortinas · CNPJ 72.170.673/0001-09</p>
    </div>
  </footer>

  <a href="https://wa.me/{WHATS}" class="whatsapp-float" data-whatsapp data-msg="{msg}" target="_blank" rel="noopener" aria-label="Conversar no WhatsApp">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.65-4.95A9 9 0 1 1 8 19.4L3 21z"/><g transform="translate(7.3 7.3) scale(.4)" stroke-width="4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></g></svg>
  </a>

  <script src="js/modelo.js?v={V_JS}" defer></script>
</body>
</html>
"""

for m in MODELOS:
    with open(os.path.join(RAIZ, m["slug"] + ".html"), "w", encoding="utf-8") as f:
        f.write(pagina(m))

# Lista para o sitemap e para os links da página inicial
print(json.dumps({m["nome"]: m["slug"] for m in MODELOS}, ensure_ascii=False))
