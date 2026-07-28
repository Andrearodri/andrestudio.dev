# Demo Visual — Agenda Cheia SLZ

## O que é

Interface visual estática para demonstração comercial e gravação de vídeo do Agenda Cheia SLZ. Não é um sistema funcional — é uma representação visual do MVP manual já aprovado.

**Esta demo não possui:**
- Backend ou servidor
- Conexão com Supabase
- Automações n8n
- WhatsApp API
- Login ou autenticação
- Dados em tempo real

Todos os dados são fictícios e estáticos, baseados nos CSVs do projeto.

## Como rodar

Basta abrir o arquivo `index.html` no navegador:

```bash
# Opção 1 — abrir diretamente
open frontend/demo-visual/index.html

# Opção 2 — servidor local (se preferir)
cd frontend/demo-visual
python3 -m http.server 8080
# Acessar http://localhost:8080
```

Não precisa de npm, Node.js ou qualquer dependência.

## Navegação

### Mouse
Clique nos itens da sidebar para trocar entre as telas.

### Teclado (ideal para gravação)
| Tecla | Ação |
| --- | --- |
| `1` | Dashboard |
| `2` | Agenda |
| `3` | Fila de Encaixe |
| `4` | Mensagens |
| `5` | Reativação |
| `6` | Resultado |
| `→` | Próxima tela |
| `←` | Tela anterior |

## Telas

1. **Dashboard** — cards de métricas e banner de destaque com R$ 1.350 recuperados.
2. **Agenda** — tabela de 7 consultas com status visuais e encaixe destacado.
3. **Fila de Encaixe** — fluxo visual Carla→Ana e tabela com status de cada cliente.
4. **Mensagens** — simulação de conversas WhatsApp (Carla cancelando, Ana confirmando encaixe).
5. **Reativação** — clientes reativados (Joana e Renata) com valores recuperados.
6. **Resultado** — resumo final com R$ 1.350 de receita potencial recuperada e oferta do piloto.

## Limitações

- Os dados são estáticos e não mudam.
- Não há interação real com WhatsApp.
- Não há cálculos em tempo real — os números estão fixos no HTML.
- As mensagens WhatsApp são simulações visuais.
- Esta demo existe exclusivamente para apresentação comercial e gravação de vídeo.

## Para gravação de vídeo

Use as teclas `→` e `←` para navegar entre as telas de forma fluida. As animações de transição são suaves e adequadas para gravação de tela.

Resolução recomendada: 1280×720 ou 1920×1080.

Roteiro de gravação: `docs/roteiro-gravacao-video.md`
Checklist: `docs/checklist-gravacao.md`
