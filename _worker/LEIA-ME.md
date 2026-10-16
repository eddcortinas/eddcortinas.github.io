# Worker `edd-acessos` (Cloudflare) — versão para publicar

Esta pasta começa com `_`, então o GitHub Pages (Jekyll) **não** publica no site.
O repositório é público: por isso as chaves **não** estão aqui (`__COPIAR_DO_WORKER_ATUAL__`).

## O que esta versão muda (em relação à que está no ar até 16/10/2026)
- Numeração por mês, separada por tipo: `ORC 10/26-001` (orçamento) e `PED 10/26-001` (pedido).
- `GET /proximo-numero?tipo=Pedido&data=AAAA-MM-DD&ignorar=<id>` devolve o próximo do mês e do tipo.
- `POST /orcamentos`: guarda a data do documento (metadado `dt`); documento novo com número automático já usado ganha o seguinte.
- `GET /orcamentos`: devolve também `data`.
- `POST /orcamentos/renumerar` (só admin): `{aplicar:false}` mostra a prévia, `{aplicar:true}` grava.
- O gerador (`js/orcamento.js`) já está publicado e funciona com a versão antiga e com a nova.

## Como publicar (conversa com acesso à Cloudflare)
1. Ler o código atual (conector Cloudflare `workers_get_worker_code` de `edd-acessos`) e copiar dele
   os valores de `ADMIN.salt`, `ADMIN.hash` e `CHAVE` para os três `__COPIAR_DO_WORKER_ATUAL__`.
   **Nunca** fazer commit do arquivo com as chaves.
2. Publicar como módulo ES, conta eddcortinas@gmail.com, com o KV ligado como `USUARIOS`
   (namespace `edd-acessos-usuarios`, id `f632d2a9defb4a9f819de746ad29e8f5`).
   Pela API: `PUT /accounts/<conta>/workers/scripts/edd-acessos` (multipart com `metadata`:
   `{"main_module":"worker.js","bindings":[{"type":"kv_namespace","name":"USUARIOS","namespace_id":"f632d2a9defb4a9f819de746ad29e8f5"}],"compatibility_date":"2024-01-01"}`).
   Ou à mão: Workers & Pages → edd-acessos → Edit code → colar (em UTF-8) → Deploy.
3. Testar: login no gerador, "Novo orçamento" deve mostrar `ORC MM/AA-NNN`.
4. No gerador, "Meus orçamentos" → "Reorganizar numeração" (prévia e confirmação).
