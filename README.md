# LUMINA — Marketplace Premium de Serviços

**Produção:** https://lumina-rho-mauve-95.vercel.app  
**Área de conta:** https://lumina-rho-mauve-95.vercel.app/conta.html  
**Repositório:** rn1620006-rgb/lumina · branch main  
**Firebase:** `lumina-a0b15` (Realtime Database europe-west1)

## O que está implementado

- Identidade visual **Petróleo Imperial** — azul profundo, dourado champanhe, vidro e tipografia premium.
- Homepage e catálogo demonstrativo de serviços.
- Integração direta no código do Firebase Web SDK (ver `firebase-client.js`), **sem variáveis de ambiente** para a configuração pública.
- Firebase Authentication com email/palavra-passe, sessões persistentes, recuperação de acesso e confirmação de email.
- Área pessoal para **clientes** e **profissionais**.
- Realtime Database sob `lumina_v1/profiles/{uid}` e `lumina_v1/requests/{uid}/{requestId}`.
- Pedidos pessoais de orçamento para clientes com email confirmado — **ainda não enviados a profissionais**.
- Homepage: clicar numa categoria abre a área de conta com o serviço pré-selecionado para preparar um pedido privado.
- Editor de perfil: o utilizador pode atualizar nome e localidade sem alterar o email nem o papel da conta.
- Histórico em tempo real: pesquisa por título/localidade, cópia do resumo e diagnóstico de ligação Firebase.
- A área profissional apresenta o estado do perfil, enquanto aguardam a verificação e aprovação dos prestadores.
- Regras de segurança por UID em `database/firebase.rules.json` e testes em `tests/firebase-security.test.js`.
- Página `/participar.html` encaminha para `/conta.html`.

## Estado de ativação

**O código está instalado e publicado no GitHub/Vercel, mas o projeto Firebase ainda precisa de configuração administrativa na Firebase Console.** Publicar `firebase.rules.json` no GitHub não publica automaticamente as Rules no Firebase.

O botão de criação de contas fica desativado até que `lumina_v1/public/registrationEnabled` seja `true`. Esta flag é uma barreira de UX e protege a criação de perfis conforme as Rules fornecidas; para bloquear tecnicamente **todas** as criações de contas Firebase, o fornecedor Email/Password tem de permanecer desativado na consola até ao lançamento.

### Abrir o serviço com segurança

Consulta **[FIREBASE-SETUP.md](FIREBASE-SETUP.md)** para:
1. Ativar Email/Password e autorizar o domínio de produção.
2. Publicar as Rules oficiais no **Realtime Database**.
3. Rever identificação do responsável e RGPD.
4. Criar `lumina_v1/public/registrationEnabled=true` sem substituir a raiz do DB.
5. Testar um utilizador cliente, um profissional e o isolamento de dados.

**Não utilizar regras públicas com `.read: true, .write: true` na base real.**

## SDK

A app atual ainda é um website HTML/CSS/JS estático. Para não introduzir alterações de bundler no deployment do design aprovado, o navegador importa módulos JavaScript do CDN oficial `https://www.gstatic.com/firebasejs/12.19.0/`. A dependência `firebase` também está declarada no `package.json` para evolução futura com bundler. Analytics continua desligado até existir gestão de consentimento.

```sh
npm install
npm test
```

Não há credenciais do Firebase Admin SDK, segredos de service account, nem passwords no código. A web `apiKey` da configuração `firebaseConfig` é pública, sendo a proteção de dados assegurada sobretudo por Authentication e Rules publicadas no servidor Firebase.

## Próximas fases

- Administração com autenticação e privilégios atribuídos em backend.
- Aprovação real de profissionais, portefólios e categorias.
- Pedidos distribuídos aos profissionais autorizados e propostas de orçamento.
- Agenda, disponibilidade, reservas, mensagens e notificações.
- Controlo de abuso, backups, App Check e revisão RGPD.
- Pagamentos apenas depois de infraestrutura e regras de negócio validadas.
