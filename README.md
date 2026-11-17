# Voz Segura

Protótipo de uma plataforma de acolhimento e denúncia anônima contra bullying, abuso e
violência. Reconstruído a partir do protótipo do Figma (`figma1.mhtml`) como um site
estático, separado em HTML, CSS e JavaScript.

## Arquivos

| Arquivo      | Descrição                                                        |
| ------------ | ---------------------------------------------------------------- |
| `index.html`           | Estrutura semântica da página (cabeçalho, seções, rodapé e modais) |
| `styles.css`           | Estilos organizados por variáveis, componentes e responsividade    |
| `script.js`            | Interações, persistência, área restrita e registro do service worker |
| `manifest.webmanifest` | Metadados de instalação do PWA (nome, cores, ícones)              |
| `sw.js`                | Service worker: cache offline do "app shell"                       |
| `icons/`               | Ícones PNG (192, 512, maskable e Apple Touch)                      |

## Como abrir

Basta abrir o `index.html` no navegador. Não há dependências nem build.
Para usar os recursos de **PWA** (instalação e offline), é necessário servir por
`localhost` ou HTTPS — service workers não funcionam em `file://`.

Para servir localmente:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Funcionalidades

- Layout responsivo (mobile, tablet e desktop).
- Menu hambúrguer no mobile.
- Rolagem suave entre as seções com destaque do link ativo.
- Animações de entrada das seções (respeitando `prefers-reduced-motion`).
- Modal de denúncia anônima com validação e tela de confirmação.
- Contatos de emergência clicáveis (`tel:`).
- Denúncias salvas localmente (`localStorage`) com número de protocolo e data.
- **Área da Equipe**: acesso restrito por senha para consultar as denúncias.
- **PWA**: instalável na tela inicial, funciona offline e avisa quando a conexão cai.

## PWA (instalação e offline)

- `manifest.webmanifest` define nome, cores, ícone e `display: standalone` — o app
  abre sem a barra do navegador quando instalado.
- `sw.js` guarda o "app shell" (HTML, CSS, JS, manifesto e ícones) em cache. A
  navegação tenta a rede primeiro e cai para a página salva quando não há conexão.
- O botão **Instalar app** aparece no cabeçalho quando o navegador oferece o
  prompt de instalação (some no celular, onde o menu do navegador já faz isso).
- Um aviso vermelho no topo informa quando o dispositivo está offline.

### Como testar

1. Sirva em `http://localhost:8000` e abra no Chrome/Edge.
2. Aguarde o carregamento e recarregue uma vez para o service worker assumir o controle.
3. No DevTools → **Application → Service Workers**, confirme que está ativado.
4. Desmarque "Update on reload", vá em **Application → Manifest → Install app** ou
   use o botão "Instalar app" para testar a instalação.
5. Em **Network → Offline**, recarregue a página: o conteúdo continua disponível.

> Ao alterar HTML/CSS/JS, incremente a versão em `CACHE_NAME` em `sw.js` (ex.:
> `vozsegura-v2`) para forçar a atualização do cache nos dispositivos já instalados.

## Área da Equipe (acesso restrito)

O botão **Área da Equipe** existe no cabeçalho e no rodapé. Ao clicar, é exibido um
modal que pede a senha. Depois de autenticado (a sessão vale até fechar a aba), é
possível consultar as denúncias registradas **neste mesmo navegador**, excluir
itens e fazer logout.

### Senha padrão

```
vozsegura2024
```

A senha **não** aparece em texto puro no código: `script.js` guarda apenas o hash
SHA-256 dela na constante `ACCESS_HASH`.

### Como trocar a senha

1. Escolha a nova senha e calcule o hash no console do navegador:

   ```js
   const bytes = new TextEncoder().encode("sua-nova-senha");
   const hash = await crypto.subtle.digest("SHA-256", bytes);
   console.log(
     Array.from(new Uint8Array(hash))
       .map((b) => b.toString(16).padStart(2, "0"))
       .join("")
   );
   ```

2. Substitua o valor de `ACCESS_HASH` em `script.js` pelo hash impresso.
3. Atualize a senha documentada aqui.

> A verificação usa a Web Crypto API (`crypto.subtle`), disponível em contexto
> seguro: `file://`, `localhost` ou `https`. Serve o projeto com
> `python3 -m http.server 8000` e acesse `http://localhost:8000`.

## Observações

O protótipo original do Figma foi capturado apenas na tela inicial. Os botões de
denúncia foram implementados como um modal de demonstração — não há envio real de
dados. As denúncias ficam apenas no `localStorage` do navegador e a área restrita é
uma **proteção demonstrativa**: como tudo roda no cliente, qualquer pessoa com
acesso ao código pode burlar a senha. Em produção, a autenticação e o banco de
dados precisam ficar no servidor, com senhas armazenadas usando bcrypt/Argon2.
