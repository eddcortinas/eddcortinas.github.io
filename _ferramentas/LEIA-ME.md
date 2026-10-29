# Ferramentas (não publicadas: pastas com `_` ficam fora do site)

- `gerar_modelos.py` — gera as 12 páginas de modelo (cortina-rolo.html etc.).
  **Os preços ficam escritos dentro dele**: ao mudar um preço no `index.html`, mude aqui também e rode
  `python3 _ferramentas/gerar_modelos.py .`
- `gerar_catalogo.py` — gera `catalogo.html`. Textos e fotos vêm do `gerar_modelos.py`;
  **preços e prazos vêm do `index.html`** (opções do `#sim-modelo`). Rode `python3 _ferramentas/gerar_catalogo.py .`
- `pdf-catalogo.js` — gera `catalogo-edd-cortinas.pdf` (ver instruções no arquivo).

Sempre que mudar preços: atualizar `index.html`, rodar os dois geradores e refazer o PDF.
