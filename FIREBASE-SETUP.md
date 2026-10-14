# LUMINA — Ativação oficial do Firebase

Projeto Firebase: **lumina-a0b15**  
Realtime Database: **https://lumina-a0b15-default-rtdb.europe-west1.firebasedatabase.app**  
Projeto web: **https://lumina-rho-mauve-95.vercel.app**  
GitHub: **rn1620006-rgb/lumina**, branch **main**.

## O que já está integrado

- `firebase-client.js` inicializa o projeto com a configuração web pública **no código**, sem `.env`.
- `conta.html` e `conta.js` implementam registo/login Email/Password, sessão persistente, confirmação de email, recuperação de palavra-passe, perfis privados e pedidos próprios.
- Realtime Database usa o namespace `lumina_v1`, isolado da raiz.
- `database/firebase.rules.json` tem negação global por omissão e regras específicas para cada UID.
- O campo `role` aceita **cliente** ou **profissional**, nunca **admin**. Um utilizador não pode trocar o próprio papel depois de criar o perfil.
- Pedidos só podem ser criados por **clientes com email verificado** e são legíveis apenas pelo dono. Ainda não são distribuídos a profissionais.
- Registo **bloqueado por omissão**, mesmo com SDK configurado.

## Ativação na Firebase Console (necessária)

### 1. Authentication

Abrir https://console.firebase.google.com/project/lumina-a0b15/authentication/providers

Ativar **Email/Password** em Sign-in method. Nas opções de domínios autorizados, garantir que está autorizado **lumina-rho-mauve-95.vercel.app** (e outros domínios oficiais de produção quando usados). Não autorizar domínios aleatórios de previews públicos para lançamentos reais.

### 2. Realtime Database Rules

Abrir https://console.firebase.google.com/project/lumina-a0b15/database/lumina-a0b15-default-rtdb/rules

Copiar o **conteúdo completo** de `database/firebase.rules.json` para Rules, validar e **Publish**. **Não** utilizar `{".read":true,".write":true}` em produção.

Alternativamente, numa máquina autenticada como proprietária do projeto Firebase:

```sh
npm install -g firebase-tools
firebase login
firebase deploy --only database --project lumina-a0b15
```

O ficheiro `firebase.json` já aponta para `database/firebase.rules.json`.

**Importante:** publicar o ficheiro no GitHub não publica as regras no Firebase. As regras são aplicadas pelos servidores Firebase, não pelo código do frontend.

### 3. Testar as Rules antes de abrir

Na consola Firebase > Realtime Database > Rules Playground (ou Emulator Suite), confirmar:

- Visitante anónimo consegue ler `/lumina_v1/public/registrationEnabled`, **mas não escrever** aí.
- Visitante sem login não consegue ler `/lumina_v1/profiles/` nem `/lumina_v1/requests/`.
- Utilizador A lê/escreve apenas `/lumina_v1/profiles/A`, nunca `/lumina_v1/profiles/B`.
- Utilizador autenticado não altera `role` após criação do perfil.
- Papel `admin` é rejeitado.
- Profissional não consegue escrever em `/lumina_v1/requests/`.
- Cliente com email não verificado não consegue criar pedido.
- Cliente com email verificado cria pedido apenas na própria pasta UID, no formato permitido.

### 4. Preparar revisão legal e abrir registos

Concluir a identificação jurídica do responsável pelo tratamento e rever a Política de Privacidade antes de recolher dados reais.

Na consola **Realtime Database > Data**, criar os nós:

```json
{
  "lumina_v1": {
    "public": {
      "registrationEnabled": true
    }
  }
}
```

**Atenção:** esta flag protege o registo na interface e (com as regras publicadas) impede criação de novos perfis enquanto estiver false, mas não impede alguém de invocar diretamente a API pública Firebase Authentication se Email/Password estiver ativo. Para impedir novas contas Auth até ao lançamento, mantém o fornecedor Email/Password desativado até completares a configuração. Isto é um exemplo de estrutura. Não substituas o conteúdo atual da raiz do Realtime Database; adiciona só o nó necessário sem apagar dados existentes.

A flag `registrationEnabled` pode ser alterada na consola ou por uma ferramenta administrativa autorizada. As regras negam escritas de clientes nesta flag.

### 5. Verificar o funcionamento real

Abrir https://lumina-rho-mauve-95.vercel.app/conta.html e testar:

1. Criar uma conta de teste.
2. Confirmar que `/lumina_v1/profiles/{uid}` foi gravado.
3. Terminar sessão e entrar novamente, validando persistência.
4. Verificar o email e atualizar a sessão.
5. Guardar um pedido de teste.
6. Atualizar a página e confirmar que o pedido continua visível para o dono.
7. Entrar com outra conta e confirmar que não vê o pedido.

## Fase seguinte

- Aprovação de profissionais através de permissões administrativas atribuídas no backend.
- Catálogo de serviços, agendas, propostas e reservas reais.
- Firebase App Check, controlo de abuso/rate limits, backups, monitorização, minimização e eliminação de dados RGPD.

## SDK e segurança

Esta versão utiliza importações ESM do **CDN oficial Firebase v12.19.0** para manter a aplicação estática atual. A dependência npm também está definida em `package.json` para futura migração para um bundler. A configuração web não é segredo; nunca colocar credenciais de service account/admin no repositório.

**Analytics** não é iniciado enquanto não estiver implementada uma decisão de consentimento apropriada.

## Pedidos na primeira página (regra adicional obrigatória)

A LUMINA usa agora um feed `lumina_v1/publicRequests/{requestId}` com dados minimizados. Todos os visitantes podem ler **apenas** esse feed. Os pedidos privados continuam sob `lumina_v1/requests/{uid}/{requestId}` e não são abertos a terceiros.

**Publica novamente o ficheiro COMPLETO** `database/firebase.rules.json` em [Firebase Console → Realtime Database → Regras](https://console.firebase.google.com/project/lumina-a0b15/database/lumina-a0b15-default-rtdb/rules) após esta atualização. O código no GitHub ou na Vercel não consegue alterar as regras de produção do Firebase sozinho.

Teste: publica o resumo de um pedido já guardado na área de cliente. A homepage deve apresentar título, categoria e localidade; nunca email, nome, descrição privada ou palavra-passe. Depois retira a publicação e confirma que a homepage deixa de mostrar o cartão, mas o pedido permanece no histórico privado.

Os clientes devem confirmar conscientemente a publicação de cada resumo. **Não migrar automaticamente todos os pedidos privados para o feed.** O título publicado pode conter dados pessoais que o próprio utilizador introduziu; evitar identificadores e contactos.
