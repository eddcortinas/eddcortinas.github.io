/* =========================================================
   EDD Cortinas — tabela de tecidos do gerador de orçamento
   Preços ao consumidor final por m² (tabela de revenda Emteco 2024.1 x 1,80).
   Cada modelo tem coleções; cada coleção tem suas cores (todas com o mesmo preço)
   e um preço por opção (tubo R32/R38/R43 na rolô, 2 a 5 vias no painel).
   - areaMinima / areaMaxima: m² cobrados por peça (sem areaMinima vale 1,5 m²)
   - larguraMax: largura máxima da coleção (o gerador avisa se passar)
   - adicionais: pct = acréscimo % no preço do m²; valor = R$ fixo por peça
   Para mudar um preço, edite o número aqui. Só o gerador usa este arquivo.
   ========================================================= */
const TABELA_TECIDOS = {
  "Cortina rolô": {
    "areaMinima": 1.6,
    "variante": { "rotulo": "Tubo", "opcoes": ["R32", "R38", "R43 (motorizada)"], "automatica": "rolo" },
    "colecoes": [
      { "nome": "Screen 1%", "cores": ["710", "711", "712"], "larguraMax": 3.0, "precos": [287.66, 317.29, 396.72] },
      { "nome": "Screen 3%", "cores": ["700", "701", "702", "703", "704", "705"], "larguraMax": 3.0, "precos": [237.96, 262.46, 304.11] },
      { "nome": "Screen 5%", "cores": ["700", "701", "702", "703", "704", "705"], "larguraMax": 3.0, "precos": [201.78, 222.57, 243.94] },
      { "nome": "Screen Lugano 5%", "cores": ["Brown", "Silver", "Cream"], "larguraMax": 2.5, "precos": [362.09, 400.05, 463.95] },
      { "nome": "Luzes", "cores": ["White", "Offwhite", "Roller", "Strip", "Imbuia", "Tropical", "Inca", "Veneza", "Athenea", "Topázio"], "larguraMax": 2.0, "precos": [222.16, 245.05, 258.03] },
      { "nome": "Munique", "cores": ["Lino", "Sweet", "Ice"], "larguraMax": 2.8, "precos": [233.24, 257.2, 270.9] },
      { "nome": "Bonna", "cores": ["Almond", "Sand", "Silver"], "larguraMax": 2.5, "precos": [207.79, 229.36, 272.61] },
      { "nome": "Treviso Translúcido", "cores": ["Green", "Mescla Marfim", "Bege", "Castanho", "Prata"], "larguraMax": 2.5, "precos": [200.16, 221.94, 257.04] },
      { "nome": "Treviso BK", "cores": ["Branco", "Creme", "Bege", "Cinza", "Natural", "Cinza Mescla"], "larguraMax": 2.8, "precos": [229.5, 253.24, 269.1] },
      { "nome": "Laguna BK", "cores": ["Offwhite", "Castor", "Natural", "Cinza"], "larguraMax": 2.0, "precos": [275.04, 303.37, 351.45] },
      { "nome": "Prestige BK", "cores": ["Branco", "Bege", "Offwhite", "Cinza"], "larguraMax": 2.8, "precos": [271.3, 299.25, 346.61] },
      { "nome": "Munique BK", "cores": ["Lino", "Sweet", "Ice"], "larguraMax": 2.8, "precos": [297.22, 328.68, 380.88] },
      { "nome": "Bonna BK", "cores": ["White", "Sand"], "larguraMax": 2.5, "precos": [306.18, 337.68, 391.14] },
      { "nome": "Pimpoint", "cores": ["320", "322", "323", "324", "330"], "larguraMax": 1.83, "precos": [237.78, 262.28, 287.55] },
      { "nome": "Pimpoint Plus", "cores": ["331", "332", "333", "334"], "larguraMax": 3.0, "precos": [213.66, 235.67, 258.28] },
      { "nome": "Shantung BK", "cores": ["Creme", "Candy", "Chocolate", "Black", "Nature", "Cinza Mescla"], "larguraMax": 2.2, "precos": [304.24, 335.59, 388.71] },
      { "nome": "Miami BK", "cores": ["Crome", "Cinza", "Black"], "larguraMax": 2.5, "precos": [257.62, 284.18, 330.41] },
      { "nome": "Madrid BK", "cores": ["Blue", "Beige", "Sand", "Salmon"], "larguraMax": 2.5, "precos": [335.41, 369.97, 380.88] }
    ],
    "adicionais": [
      { "id": "premium", "nome": "Kit Premium (acessórios bege, cinza, preto ou marrom)", "pdf": "Kit Premium", "pct": 10 },
      { "id": "cunha", "nome": "Base cunha alumínio branco", "pdf": "Base cunha", "pct": 5 },
      { "id": "redutor", "nome": "Redutor de peso", "pdf": "Redutor de peso", "valor": 135.0 }
    ]
  },
  "Cortina painel": {
    "variante": { "rotulo": "Vias", "opcoes": ["2 vias", "3 vias", "4 vias", "5 vias"] },
    "colecoes": [
      { "nome": "Screen 1%", "cores": ["710", "711", "712"], "precos": [297.97, 341.24, 377.68, 424.22] },
      { "nome": "Screen 3%", "cores": ["700", "701", "702", "704", "705"], "precos": [228.37, 261.54, 289.44, 325.1] },
      { "nome": "Screen 5%", "cores": ["750", "751", "752"], "precos": [167.24, 189.52, 209.68, 235.6] },
      { "nome": "Lugano Screen 5%", "cores": ["Brown", "Silver", "Cream"], "precos": [348.46, 398.38, 441.67, 496.1] },
      { "nome": "Pimpoint", "cores": ["320", "322", "323", "324", "330"], "precos": [215.93, 247.28, 273.67, 307.4] },
      { "nome": "Pimpoint Plus", "cores": ["331", "332", "333", "334"], "precos": [180.43, 206.62, 228.67, 256.86] },
      { "nome": "Luzes", "cores": ["Linho", "Strip", "Imbuia", "Tropical"], "precos": [193.79, 221.94, 245.63, 275.9] },
      { "nome": "Treviso Translúcido", "cores": ["Creme", "Bege", "Cinza Mescla", "Green", "Marrom"], "precos": [193.07, 221.09, 244.69, 274.86] },
      { "nome": "Munique", "cores": ["Sweet", "Lino", "Ice"], "precos": [203.44, 233.64, 257.83, 289.55] },
      { "nome": "Bonna", "cores": ["Almond", "Sand", "Silver"], "precos": [204.71, 234.5, 259.51, 291.51] },
      { "nome": "Laguna BK", "cores": ["Offwhite", "Natural", "Castor", "Cinza"], "precos": [263.93, 302.27, 334.53, 375.77] },
      { "nome": "Prestige BK", "cores": ["Branco", "Bege", "Offwhite", "Cinza"], "precos": [260.33, 298.13, 329.98, 370.62] },
      { "nome": "Treviso BK", "cores": ["Branco", "Creme", "Bege", "Cinza", "Natural", "Cinza Mescla"], "precos": [202.03, 231.37, 256.05, 287.6] },
      { "nome": "Munique BK", "cores": ["Lino", "Sweet", "Ice"], "precos": [286.09, 327.69, 362.59, 407.29] },
      { "nome": "Bonna BK", "cores": ["White", "Sand"], "precos": [293.76, 336.44, 372.33, 418.23] },
      { "nome": "Shantung BK", "cores": ["Creme", "Candy", "Chocolate", "Black"], "precos": [291.96, 334.37, 370.04, 415.66] },
      { "nome": "Miami BK", "cores": ["Crome", "Cinza", "Black"], "precos": [248.17, 284.2, 314.53, 353.34] },
      { "nome": "Madrid", "cores": ["Blue", "Beige", "Sand", "Salmon"], "precos": [286.16, 327.64, 362.59, 407.29] }
    ],
    "adicionais": [
      { "id": "cunha", "nome": "Base cunha", "pdf": "Base cunha", "pct": 7 },
      { "id": "corda", "nome": "Comando com corda (por trilho)", "pdf": "Comando com corda", "valor": 135.0 }
    ]
  },
  "Cortina painel romano": {
    "variante": { "rotulo": "Vias", "opcoes": ["2 vias", "3 vias", "4 vias", "5 vias"] },
    "colecoes": [
      { "nome": "Screen 1%", "cores": ["710", "711", "712"], "precos": [348.03, 394.65, 462.15, 504.5] },
      { "nome": "Screen 3%", "cores": ["700", "701", "702", "704", "705"], "precos": [266.67, 302.49, 354.15, 385.7] },
      { "nome": "Screen 5%", "cores": ["750", "751", "752"], "precos": [193.28, 219.24, 256.68, 280.55] },
      { "nome": "Screen 5% (Lugano)", "cores": ["Brown", "Silver", "Cream"], "precos": [406.91, 461.52, 540.45, 590.69] },
      { "nome": "Luzes", "cores": ["Linho", "Strip", "Imbuia", "Tropical", "Athenea"], "precos": [226.35, 256.68, 300.56, 328.5] },
      { "nome": "Munique", "cores": ["Sweet", "Lino", "Ice"], "precos": [237.76, 269.46, 315.54, 344.83] },
      { "nome": "Bonna", "cores": ["Almond", "Sand", "Silver"], "precos": [239.33, 271.26, 317.63, 347.09] },
      { "nome": "Treviso Translúcido", "cores": ["Green", "Marrom", "Prata Mescla", "Bege"], "precos": [226.73, 256.05, 299.61, 327.69] },
      { "nome": "Pinpoint Plus", "cores": ["331", "332", "333", "334"], "precos": [210.73, 239.08, 279.9, 305.91] },
      { "nome": "Laguna BK", "cores": ["Offwhite", "Natural", "Castor", "Cinza"], "precos": [308.34, 349.76, 409.5, 447.57] },
      { "nome": "BK Prestige", "cores": ["Branco", "Bege", "Offwhite", "Cinza"], "precos": [304.16, 345.02, 403.92, 441.63] },
      { "nome": "Treviso BK", "cores": ["Branco", "Creme", "Bege", "Cinza", "Natural"], "precos": [236.07, 267.75, 313.47, 342.72] },
      { "nome": "Bonna BK", "cores": ["White", "Sand", "Almond"], "precos": [343.35, 389.52, 455.85, 498.4] },
      { "nome": "Munique BK", "cores": ["Lino", "Sweet", "Ice"], "precos": [334.42, 379.35, 443.93, 485.37] },
      { "nome": "Shantung BK", "cores": ["Creme", "Candy", "Chocolate", "Black", "Natural", "Cinza Mescla"], "precos": [341.28, 387.45, 453.1, 495.36] },
      { "nome": "Madrid BK", "cores": ["Crome", "Cinza", "Black", "Salmon"], "precos": [334.42, 379.35, 443.93, 485.37] },
      { "nome": "Miami BK", "cores": ["Blue", "Beige", "Sand"], "precos": [289.98, 329.08, 385.11, 421.11] }
    ],
    "adicionais": [
      { "id": "cunha", "nome": "Base cunha", "pdf": "Base cunha", "pct": 8 },
      { "id": "corda", "nome": "Comando com corda (por trilho)", "pdf": "Comando com corda", "valor": 135.0 }
    ]
  },
  "Cortina romana": {
    "areaMinima": 1.6,
    "areaMaxima": 4.5,
    "colecoes": [
      { "nome": "Screen 1%", "cores": ["710", "711", "712"], "larguraMax": 3.0, "precos": [527.49] },
      { "nome": "Screen 3%", "cores": ["700", "701", "702", "704"], "larguraMax": 3.0, "precos": [403.33] },
      { "nome": "Screen 5%", "cores": ["750", "751", "752"], "larguraMax": 3.0, "precos": [292.23] },
      { "nome": "Lugano Screen 5%", "cores": ["Brown", "Silver", "Cream"], "larguraMax": 2.5, "precos": [615.69] },
      { "nome": "Pimpoint Plus", "cores": ["331", "332", "333", "334"], "larguraMax": 3.0, "precos": [318.78] },
      { "nome": "Luzes", "cores": ["Linho", "Strip", "Imbuia", "Tropical"], "larguraMax": 2.0, "precos": [342.27] },
      { "nome": "Bonna", "cores": ["Almond", "Sand", "Silver"], "larguraMax": 2.5, "precos": [361.98] },
      { "nome": "Munique", "cores": ["Sweet", "Lino", "Ice"], "larguraMax": 2.8, "precos": [359.28] },
      { "nome": "Treviso Translúcido", "cores": ["Green", "Castanho", "Prata Mescla", "Bege"], "larguraMax": 2.5, "precos": [341.01] },
      { "nome": "Laguna BK", "cores": ["Offwhite", "Natural", "Castor", "Cinza"], "larguraMax": 2.0, "precos": [466.29] },
      { "nome": "Prestige BK", "cores": ["Branco", "Bege", "Offwhite", "Cinza"], "larguraMax": 2.8, "precos": [459.81] },
      { "nome": "Treviso BK", "cores": ["Branco", "Creme", "Bege", "Cinza", "Natural", "Cinza Mescla"], "larguraMax": 2.8, "precos": [356.94] },
      { "nome": "Munique BK", "cores": ["Lino", "Sweet", "Ice"], "larguraMax": 2.8, "precos": [505.26] },
      { "nome": "Bonna BK", "cores": ["White", "Sand"], "larguraMax": 2.0, "precos": [518.85] },
      { "nome": "Shantung BK", "cores": ["Creme", "Candy", "Chocolate", "Black"], "larguraMax": 2.2, "precos": [515.65] },
      { "nome": "Miami BK", "cores": ["Crome", "Cinza", "Black"], "larguraMax": 2.5, "precos": [438.3] },
      { "nome": "Madrid BK", "cores": ["Blue", "Beige", "Sand", "Salmon"], "larguraMax": 2.5, "precos": [505.26] }
    ],
    "adicionais": [
      { "id": "premium", "nome": "Kit Premium (acessórios bege, cinza, preto ou marrom)", "pdf": "Kit Premium", "pct": 10 }
    ]
  },
  "Cortina double vision": {
    "areaMinima": 1.6,
    "colecoes": [
      { "nome": "Double Vision 32mm", "cores": ["White", "Black", "Nature", "Cinza", "Chocolate", "Offwhite", "Capuccino", "Sand"], "precos": [408.42] },
      { "nome": "Double Vision R 38mm", "cores": ["White", "Black", "Nature", "Cinza", "Chocolate", "Offwhite", "Capuccino", "Sand"], "precos": [450.54] },
      { "nome": "Double Vision R 43mm", "cores": ["White", "Black", "Nature", "Cinza", "Chocolate", "Offwhite", "Capuccino", "Sand"], "precos": [522.18] }
    ],
    "adicionais": [
      { "id": "premium", "nome": "Kit Premium (acessórios bege, cinza, preto ou marrom)", "pdf": "Kit Premium", "pct": 10 }
    ]
  },
  /* Cortinas em tecido (preço por metro de tecido). Metragem = largura do vão x franzimento
     (linhos e tecido com blackout: o vendedor escolhe 2,00 a 4,00, padrão 3,00;
     Cortina acortinado: 2,50 fixo). Até 2,65 m de altura o tecido vai invertido (sem emendas);
     acima disso vai em pé com emendas (panos) e o gerador avisa para confirmar. Cor = código Emteco + nome. */
  "Cortina de tecido": {
    "rotulo": "Tecido",
    "franzido": 3.0,
    "franzimentos": [2.0, 2.5, 3.0, 3.3, 3.5, 4.0],
    "alturaInvertido": 2.65,
    "colecoes": [
      { "nome": "Linho Flame Irlandês", "cores": ["987 Bege 04", "988 Trigo 09", "989 Cinza 03", "990 Marfim 02", "991 Branco 01", "992 Prata 06"], "precos": [100.00] },
      { "nome": "Linho Nix", "cores": ["769 Off White", "770 Cru", "771 Castor"], "precos": [124.00] },
      { "nome": "Linho Safira", "cores": ["772 Safira 02"], "precos": [129.00] },
      { "nome": "Linho Israelense", "cores": ["773 Cinza"], "precos": [129.00] },
      { "nome": "Linho Bora Bora", "cores": ["850 Cru"], "precos": [143.00] },
      { "nome": "Linho Roma", "cores": ["714 Marfim", "767 Bege"], "precos": [159.00] },
      { "nome": "Linho Absoluto", "cores": ["851 Off White", "852 Fendy (K2407-5A C#3)"], "precos": [215.00] },
      { "nome": "Linho Botone", "cores": ["1088 Off White", "1089 Bege"], "precos": [240.00] }
    ]
  },
  /* Linho com blackout: mesmo linho (coleção e cor) + blackout com cor própria.
     Preço do metro = preço do linho + R$ 73,91 do blackout (Flame Irlandês: 100,00 + 73,91 = 173,91). */
  "Cortina de tecido com blackout": {
    "rotulo": "Tecido",
    "franzido": 3.0,
    "franzimentos": [2.0, 2.5, 3.0, 3.3, 3.5, 4.0],
    "alturaInvertido": 2.65,
    "corBlackout": ["Branco", "Marfim", "Cinza", "Bege"],
    "colecoes": [
      { "nome": "Linho Flame Irlandês", "cores": ["987 Bege 04", "988 Trigo 09", "989 Cinza 03", "990 Marfim 02", "991 Branco 01", "992 Prata 06"], "precos": [173.91] },
      { "nome": "Linho Nix", "cores": ["769 Off White", "770 Cru", "771 Castor"], "precos": [197.91] },
      { "nome": "Linho Safira", "cores": ["772 Safira 02"], "precos": [202.91] },
      { "nome": "Linho Israelense", "cores": ["773 Cinza"], "precos": [202.91] },
      { "nome": "Linho Bora Bora", "cores": ["850 Cru"], "precos": [216.91] },
      { "nome": "Linho Roma", "cores": ["714 Marfim", "767 Bege"], "precos": [232.91] },
      { "nome": "Linho Absoluto", "cores": ["851 Off White", "852 Fendy (K2407-5A C#3)"], "precos": [288.91] },
      { "nome": "Linho Botone", "cores": ["1088 Off White", "1089 Bege"], "precos": [313.91] }
    ]
  },
  /* Acortinado BK: modelo à parte (só no gerador), franzimento 2,50 fixo */
  "Cortina acortinado": {
    "depoisDe": "Cortina de tecido com blackout",
    "calculo": "tecido",
    "alturamax": 2.7,
    "rotulo": "Tecido",
    "franzido": 2.5,
    "alturaInvertido": 2.65,
    "colecoes": [
      { "nome": "Acortinado BK", "cores": ["858 Linho Branco", "878 Indonésia Linho (2210 C#3)"], "precos": [254.00] }
    ]
  }
};
