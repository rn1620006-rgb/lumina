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
- Segurança da conta: alteração da palavra-passe após reautenticação com a palavra-passe atual, sem armazenar credenciais na base de dados.
- Área pessoal para **clientes** e **profissionais**.
- Realtime Database sob `lumina_v1/profiles/{uid}` e `lumina_v1/requests/{uid}/{requestId}`.
- Pedidos pessoais de orçamento para clientes com email confirmado — **ainda não enviados a profissionais**.
- **Pedidos publicados na homepage**: aparecem diretamente na primeira página, em cards Liquid Glass, atualizados pelo Realtime Database.
- **Publicação voluntária**: pedidos antigos continuam privados até o cliente clicar em «Publicar resumo na página inicial» no histórico. Pedidos novos incluem checkbox de publicação opcional. O cliente pode retirar o resumo depois.
- Dados do feed: título, categoria, localidade e datas; a descrição detalhada, o email e o perfil permanecem privados.
- As regras novas de `publicRequests` **ainda precisam de publicação manual na consola Firebase** para permitir estes acessos. Publicar o site na Vercel não atualiza as Firebase Rules.

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

## Critérios de validação de autenticação antes de disponibilizar dados reais

- Testar registo, confirmação de email, saída/entrada, recuperação e alteração de palavra-passe com uma conta de teste controlada.
- Testar no Realtime Database que o utilizador A não lê/escreve o perfil ou os pedidos do utilizador B.
- Verificar a flag de registos, as Firebase Rules realmente publicadas e os domínios autorizados da Authentication.
- Configurar Firebase App Check, proteção contra abuso e capacidade de eliminar contas/dados mediante pedido (RGPD) antes do lançamento público.
- Diferenciar **email confirmado** de **profissional aprovado**: nenhum prestador está validado apenas por abrir conta.

As funcionalidades de contratação e propostas ainda não estão abertas; nenhum pedido privado é distribuído automaticamente.

## Ativar o feed de pedidos na homepage

1. Abrir [Realtime Database > Regras](https://console.firebase.google.com/project/lumina-a0b15/database/lumina-a0b15-default-rtdb/rules).
2. Substituir as regras atuais pelo **ficheiro completo** `database/firebase.rules.json` atualizado e carregar em **Publicar**, preservando as regras das contas.
3. Aceder à [área de conta](https://lumina-rho-mauve-95.vercel.app/conta.html) e, no histórico, usar **Publicar resumo na página inicial** no primeiro pedido já criado.
4. Abrir a homepage: a secção **Pedidos de serviços — Em destaque** mostra o resumo em tempo real.
5. Confirmar também o fluxo inverso: **Retirar da página inicial** faz desaparecer o resumo público, mantendo o pedido privado.

Sem a atualização das Firebase Rules, a homepage apresenta um aviso de configuração pendente e não tenta expor pedidos privados.
