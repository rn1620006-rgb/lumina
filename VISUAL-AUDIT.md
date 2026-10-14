# LUMINA — Auditoria e reformulação visual Imperial

Data: 15 outubro 2026. Projeto principal: `rn1620006-rgb/lumina` (`main`).

## Objetivo implementado

Reformular o website existente sem alterar a arquitetura de autenticação, os pedidos privados ou o feed público do Firebase. Preservar a logomarca LUMINA, as cores oficiais e a experiência do utilizador.

## Alterações implementadas

### Cabeçalho e logomarca
- Header editorial com glass profundo, espaçamento consistente e navegação desktop/mobile mais clara.
- Recorte de apresentação do **emblema original**, sem substituir a imagem original.
- Alinhamento entre símbolo, wordmark Cormorant Garamond e assinatura «Serviços Elevados».
- A mesma identidade está presente na página de conta e na política de privacidade.

### Hero
- Composição redesenhada, tipografia editorial e CTAs reais para serviços e pedidos publicados.
- Vitrine de vidro para a identidade LUMINA, com reflexos, luz ambiental e enquadramento controlado.
- Pesquisa de serviços funcional mantida; categorias rápidas mantidas.
- Responsividade para telefone, tablet e desktop.

### Fotografias
- Cinco imagens de categorias existentes convertidas de fundos CSS com largura fixa para `<img>` reais com `srcset`, `sizes`, `loading="lazy"`, `decoding="async"` e textos alternativos.
- Fontes responsivas com versões 640, 1200 e 1920 px; JPEG/WebP/AVIF automático conforme negociação com o serviço de imagem.
- Enquadramento por categoria, correção ótica de cor e gradientes que não prejudicam a legibilidade.
- **Limite:** as fotografias continuam a vir da origem Unsplash já utilizada pelo projeto; a atualização melhora entrega e enquadramento, mas não as transforma em fotografias exclusivas feitas para a LUMINA. Para imagens verdadeiramente próprias serão necessárias fotografias do cliente ou geração expressamente autorizada.

### Ícones e interface
- `assets/lumina-icons.svg` contém um conjunto personalizado de ícones vetoriais com o mesmo peso de linha.
- Substituídos símbolos Unicode/emoji dos serviços, cards, menu mobile, localização, botões, perguntas frequentes e áreas de conta.
- `premium.css` coordena materiais, sombras, tipografia, focus, hover e escalabilidade.

### Funcionalidades preservadas
- Firebase Authentication e Realtime Database (sem alterar configuração nem regras).
- Registo, login, recuperação e alteração de palavra-passe, perfis privados e pedidos pessoais.
- Feed de resumos públicos na **própria homepage**, com opção voluntária de publicação.
- Pesquisa de categorias e navegação para formulário de pedido.

## QA executada
- GitHub Actions / Node.js: testes existentes e novo `tests/premium-visual.test.js`.
- Compilação/publicação da Vercel verificada no estado `READY`.
- Testes de estrutura cobrem marca, imagens `srcset`, presença dos SVG, manutenção da homepage e ligações ao Firebase.

## Limites e próximos passos
1. **Logótipo:** o único ficheiro original encontrado no código é um WebP de **220 × 220 píxeis**. Foi enquadrado com menos ampliação, mas a recuperação de detalhes reais e nitidez em ecrãs Retina requer a arte final original em alta resolução ou um SVG do emblema.
2. **Validação visual:** o código e os pipelines de deploy foram verificados; a inspeção pixel a pixel com navegador real em todos os dispositivos não foi possível nesta sessão.
3. **Fotografia exclusiva:** substituir as cinco imagens externas por material original em resolução elevada quando fornecido/autorizado, mantendo enquadramentos e design.
4. **Marketplace:** continuar a validar segurança do Firebase e as regras de acesso antes de ativar propostas, reservas e pagamentos.

Alterações realizadas diretamente na branch `main` e na publicação Vercel associada.
