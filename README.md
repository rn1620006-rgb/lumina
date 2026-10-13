# LUMINA — Marketplace de Serviços (Algarve)

Este repositório é o projeto principal da LUMINA, publicado na Vercel.

## Estado atual (14 outubro 2026)

- Identidade visual **Petróleo Imperial** (azul midnight, champanhe metálico, Liquid Glass).
- Homepage responsiva, pesquisa por categorias e pré-visualização de reserva/orçamento.
- `/participar.html`: formulário de pré-interesse de clientes e profissionais, **desativado por padrão**.
- `/privacidade.html`: política de privacidade preliminar, sujeita a revisão antes de abrir inscrições.
- `/api/health`: informa ao frontend se a recolha de interesse está ativada.
- `/api/interesse`: endpoint POST, validação server-side, consentimento, honeypot, limitação por IP e Postgres.
- `database/001_early_access.sql`: tabelas para manifestações de interesse e antispam.
- `tests/lead-validation.test.js`: testes de validação.

**O website não tem reservas, pagamentos, registo de contas ou chat reais nesta fase. Não ativar qualquer um desses fluxos sem infraestrutura, segurança e testes.**

## Regras de proteção

1. Nunca utilizar bases de dados já existentes de outros projetos (Nayara Clean, Jarvis etc.).
2. Criar uma base PostgreSQL **exclusiva** para a LUMINA, preferencialmente na UE.
3. Não colocar DATABASE_URL, tokens ou segredos no GitHub, HTML ou JavaScript cliente.
4. Preparar documentação jurídica definitiva, identificação do responsável e processo de eliminação de dados antes de abrir inscrições.
5. O formulário está fechado por padrão, mesmo depois de adicionar a base.

## Ligar a base de dados (ação pendente)

1. Aceder ao projeto LUMINA na Vercel, secção **Storage**.
2. Criar uma instância **Neon Postgres** exclusiva para este projeto, respeitando o plano gratuito e os limites apresentados pelo fornecedor.
3. Selecionar, se disponível, região europeia (ex.: Frankfurt).
4. Associar a nova base ao projeto LUMINA nas opções da Vercel.
5. Confirmar que a variável de ambiente de servidor `DATABASE_URL` ou `POSTGRES_URL` está configurada, sem a divulgar.
6. Na base de dados dedicada, executar o script `database/001_early_access.sql`.
7. Rever identidade jurídica, política de privacidade, contactabilidade e procedimentos para pedidos RGPD.
8. **Só depois** definir `LUMINA_SIGNUPS_ENABLED=true` no ambiente de produção e fazer novo deploy.

Se a integração da Vercel definir outra variável, alterar o nome da configuração da API sem copiar o valor para o repositório.

O frontend verificará `GET /api/health`. Se `submissionsEnabled=false`, o botão do formulário mantém-se bloqueado e é disponibilizado contacto alternativo por email.

## Desenvolvimento e testes

Requer Node 24.x.

```sh
npm install
npm test
```

As funções em `api/` são Functions compatíveis com a Vercel. Para servir localmente todas as rotas, usar ambiente de desenvolvimento apropriado da Vercel; abrir diretamente o HTML não reproduz os endpoints.

Variáveis de ambiente (definidas **fora** do GitHub):

- `DATABASE_URL` (ou `POSTGRES_URL`) — ligação confidencial a Postgres.
- `RATE_LIMIT_SECRET` — chave para derivar um identificador criptográfico diário do IP (recomendada).
- `LUMINA_SIGNUPS_ENABLED` — `true` apenas depois da ativação autorizada; por omissão, fechado.

## Próximas fases técnicas

- Autenticação com confirmação de email e sessões seguras (cliente, profissional, administração).
- Serviços reais, localização, categorias, disponibilidades e preços.
- Pedidos de orçamento, propostas, histórico e estados transacionais.
- Reserva, comunicação, notificações e avaliações verificadas.
- Moderação administrativa, antifraude, observabilidade e RGPD.
- Pagamentos e comissões apenas após fluxos transacionais e reconciliação estarem testados.

## Identidade visual

A logo oficial da LUMINA é preservada. O design utiliza `#071B2D`, `#123C46`, `#D4AF6A`, `#F6F1E8` e `#1C1F24`, tipografia editorial e interfaces translúcidas. Evitar substituições por templates genéricos.
