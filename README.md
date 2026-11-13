# Voz Segura

Protótipo de uma plataforma de acolhimento e denúncia anônima contra bullying, abuso e
violência. Reconstruído a partir do protótipo do Figma (`figma1.mhtml`) como um site
estático, separado em HTML, CSS e JavaScript.

## Arquivos

| Arquivo      | Descrição                                                        |
| ------------ | ---------------------------------------------------------------- |
| `index.html` | Estrutura semântica da página (cabeçalho, seções, rodapé e modal) |
| `styles.css` | Estilos organizados por variáveis, componentes e responsividade   |
| `script.js`  | Interações: menu mobile, rolagem suave, link ativo e modal        |

## Como abrir

Basta abrir o `index.html` no navegador. Não há dependências nem build.

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

## Observações

O protótipo original do Figma foi capturado apenas na tela inicial. Os botões de
denúncia foram implementados como um modal de demonstração — não há envio real de dados.
