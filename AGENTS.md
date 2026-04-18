# AGENTS.md — Bool Sinuca Premiere

Arquivo de referência para agentes de código. Leia isto antes de modificar qualquer arquivo do projeto.

---

## Visão Geral do Projeto

**Bool Sinuca Premiere** é um protótipo funcional de jogo de sinuca/bilhar online, mobile-first, construído com Next.js 14. O projeto é um frontend completo com dados mockados e persistência local (`localStorage`). Todas as interações são locais — não há backend real conectado.

O foco principal é a experiência mobile (lobby, loja, jogo, ranking, perfil), com uma versão desktop adaptada que usa layout de sidebar.

- **Repositório:** `bool-sinuca-premiere`
- **Versão:** 1.0.0
- **Privado:** sim

---

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | ^14.2.0 |
| Linguagem | TypeScript | ^5.3.0 |
| UI | React | ^18.3.0 |
| Estilização | Tailwind CSS | ^3.4.0 |
| Animações | Framer Motion | ^11.0.0 |
| Estado Global | Zustand | ^4.5.0 |
| i18n | next-intl | ^3.0.0 |
| Ícones | Lucide React | ^0.300.0 |
| Utilitários CSS | clsx + tailwind-merge | ^2.1.0 / ^2.2.0 |

**PostCSS:** `tailwindcss` + `autoprefixer`.

**Fonte:** Inter (Google Fonts, via `next/font/google`).

---

## Scripts Disponíveis

Todos os comandos usam `npm`:

```bash
npm run dev          # Servidor de desenvolvimento (Next.js)
npm run build        # Build para produção (Static ou SSR conforme rotas)
npm run start        # Inicia servidor de produção
npm run lint         # ESLint (next/core-web-vitals)
npm run type-check   # TypeScript --noEmit
```

**Nota:** Não existem testes automatizados no projeto. Não há Jest, Vitest, Cypress, Playwright nem qualquer outra suite de testes configurada no código-fonte da aplicação.

---

## Estrutura de Diretórios

```
src/
├── app/                          # App Router (Next.js 14)
│   ├── layout.tsx                # Root layout (metadata, fonte Inter)
│   ├── globals.css               # Tailwind directives + estilos globais
│   └── [locale]/                 # Rotas internacionalizadas (pt, en, es)
│       ├── layout.tsx            # LocaleLayout (NextIntlClientProvider)
│       ├── page.tsx              # Lobby (detecção mobile/desktop)
│       ├── (mobile)/             # Route group mobile
│       │   ├── layout.tsx        # MobileLayout (usa MobileScaffold ou DesktopLayout)
│       │   ├── friends/page.tsx
│       │   ├── leaderboard/page.tsx
│       │   ├── profile/page.tsx
│       │   ├── (shop)/shop/page.tsx
│       │   ├── game/
│       │   │   ├── layout.tsx    # Layout do jogo (sem header/nav)
│       │   │   └── [mode]/page.tsx
│       │   └── ...
│       └── (desktop)/            # Route group desktop
│           ├── layout.tsx        # DesktopGroupLayout
│           └── play/[mode]/page.tsx
├── components/
│   ├── mobile/                   # Componentes mobile
│   │   ├── layout/               # MobileHeader, MobileBottomNav, MobileScaffold, ForceLandscapeOverlay
│   │   ├── lobby/                # MobileLobbyScreen, GameModeCard
│   │   ├── shop/                 # MobileShopScreen, CueCard
│   │   ├── game/                 # MobileGameScreen, PoolTable, AimControl, PowerSlider, ShootButton, GameHUD, CueStick, GameExitButton
│   │   └── effects/              # ConfettiEffect, CoinAnimation
│   └── desktop/                  # Componentes desktop
│       ├── layout/               # DesktopLayout
│       ├── lobby/                # DesktopLobbyScreen
│       └── game/                 # DesktopGameScreen, DesktopPoolTable, DesktopGameHUD, DesktopCueControls, GameExitModal
├── hooks/                        # Hooks customizados
│   ├── useDeviceDetection.ts     # Detecta mobile/desktop e orientação
│   ├── useLocale.ts              # Obtém locale atual da rota
│   └── useVibration.ts           # Wrapper para navigator.vibrate
├── lib/
│   ├── i18n/
│   │   ├── config.ts             # Configuração next-intl (locales, defaultLocale, messages)
│   │   └── messages/             # Arquivos JSON de tradução
│   │       ├── pt.json           # Português (padrão)
│   │       ├── en.json           # Inglês
│   │       └── es.json           # Espanhol
│   ├── store/
│   │   ├── userStore.ts          # Zustand store do usuário (com persist localStorage)
│   │   └── gameStore.ts          # Zustand store do jogo (sem persist)
│   └── utils/
│       ├── cn.ts                 # clsx + tailwind-merge
│       └── format.ts             # formatNumber, formatCurrency, formatTime, getCountryFlag
├── mocks/data/                   # Dados mockados
│   ├── user.mock.ts              # MOCK_USER
│   ├── cues.mock.ts              # MOCK_CUES
│   ├── gameModes.mock.ts         # MOCK_GAME_MODES
│   └── leaderboard.mock.ts       # MOCK_LEADERBOARD
├── types/
│   └── index.ts                  # Tipos TypeScript globais (User, Cue, GameMode, Ball, GameState, etc.)
└── middleware.ts                 # Middleware next-intl (redirecionamento de locale)
```

**Arquivos de configuração na raiz:**
- `package.json` — dependências e scripts
- `next.config.js` — configuração Next.js com plugin next-intl; `images.unoptimized: true`
- `tsconfig.json` — strict mode, path alias `@/* -> ./src/*`, moduleResolution bundler
- `tailwind.config.ts` — tema extendido com cores `bool-*`, animações customizadas
- `postcss.config.js` — tailwindcss + autoprefixer
- `.eslintrc.json` — estende `next/core-web-vitals`

---

## Arquitetura de Rotas

O projeto usa **App Router** do Next.js 14 com internacionalização via `next-intl`.

- A URL base é `/{locale}/...`, onde `locale ∈ {pt, en, es}`.
- O `defaultLocale` é `pt`.
- O `middleware.ts` intercepta todas as rotas que não sejam `/api`, `/_next` ou arquivos estáticos.
- Rotas são geradas estaticamente via `generateStaticParams()` no `LocaleLayout`.

**Roteamento Mobile vs Desktop:**
- A decisão de renderizar mobile ou desktop é feita **no cliente** pelo hook `useDeviceDetection`.
- A página raiz (`[locale]/page.tsx`) e os layouts de route group decidem qual conjunto de componentes renderizar.
- Não há separação real de rotas por dispositivo — ambos os dispositivos acessam as mesmas URLs, mas veem layouts diferentes.

**Rotas de jogo:**
- Mobile: `/{locale}/game/{mode}` — usa `MobileGameScreen`, layout sem header/bottom nav.
- Desktop: `/{locale}/play/{mode}` — usa `DesktopGameScreen`, tela cheia.

---

## Convenções de Código

### Linguagem
- **Comentários e documentação:** Português (PT-BR).
- **Nomenclatura de variáveis e funções:** inglês (padrão React/TypeScript).
- **Chaves de tradução (i18n):** `pt.json` é a fonte da verdade; `en.json` e `es.json` devem espelhar a estrutura.

### Estilo de Código
- **Componentes:** funções nomeadas exportadas, PascalCase. Ex: `export function MobileHeader(...)`.
- **Hooks:** prefixo `use`, camelCase. Ex: `useDeviceDetection`.
- **Stores:** prefixo `use`, sufixo `Store`. Ex: `useUserStore`.
- **Mocks:** constantes em UPPER_SNAKE_CASE. Ex: `MOCK_USER`.
- **Tipos:** interfaces em PascalCase. Ex: `interface GameMode { ... }`.
- **Path alias:** sempre use `@/` para imports internos. Nunca use paths relativos como `../../../`.

### Diretrizes React/Next.js
- Todos os componentes que usam hooks do React ou do Next.js devem ter `'use client';` no topo.
- Componentes de servidor são usados apenas quando estritamente necessário (poucos no projeto — basicamente os layouts de locale).
- O `cn()` de `clsx` + `tailwind-merge` é o padrão para concatenação condicional de classes Tailwind.

### Tailwind CSS
- Cores customizadas do projeto usam prefixo `bool-*`: `bool-blue`, `bool-gold`, `bool-green`, `bool-purple`, `bool-dark`, `bool-darker`.
- Classes utilitárias de animação: `animate-float`, `animate-shine`, `animate-pulse-glow`.
- Classe utilitária de glassmorphism: `glass`.
- Classe utilitária de texto gradiente: `gradient-text`.
- O projeto usa extensivamente classes condicionais com `cn()` e padrões de gradiente escuros (`bg-gradient-to-r from-slate-900 ...`).

### Framer Motion
- Animações de entrada/saída são padrão em quase todos os componentes.
- Transições comuns: `type: 'spring', stiffness: 300, damping: 30`.
- `whileTap={{ scale: 0.9 }}` ou `whileTap={{ scale: 0.95 }}` é usado consistentemente em botões touch.

---

## Gerenciamento de Estado

### `useUserStore` (`src/lib/store/userStore.ts`)
- Persistido em `localStorage` via `zustand/middleware` (chave: `bool-user-storage`).
- Contém dados do usuário logado: nível, XP, moedas, cash, equipamentos, inventário, configurações.
- Ações: `setUser`, `updateCurrencies`, `updateEquipment`, `addXP`, `levelUp`, `buyCue`, `equipCue`, `reset`.
- O estado inicial vem de `MOCK_USER`.

### `useGameStore` (`src/lib/store/gameStore.ts`)
- **NÃO persistido**.
- Contém estado da partida atual: bolas, jogador atual, turno, faltas, etc.
- Ações: `startGame`, `endGame`, `updateGameState`, `shoot`, `reset`.
- A física das bolas é simplificada — não há motor de física real; é apenas um protótipo visual.

---

## Internacionalização (i18n)

Configurada via `next-intl`:
- **Idiomas suportados:** Português (`pt`), Inglês (`en`), Espanhol (`es`).
- **Idioma padrão:** `pt`.
- Arquivos de mensagens em `src/lib/i18n/messages/{locale}.json`.
- Uso no cliente: `useTranslations('namespace')` ou `useTranslations()` para todas as chaves.
- O `useLocale()` custom hook extrai o locale dos params da rota.

**Regra importante:** ao adicionar novas chaves de tradução, sempre adicione-as aos três arquivos JSON (`pt`, `en`, `es`). O `pt.json` é a referência.

---

## Dados Mockados

Todos os dados do jogo são mockados e vivem em `src/mocks/data/`:
- `user.mock.ts` — usuário demo (`SinucaMaster`, nível 7, 12.500 moedas).
- `cues.mock.ts` — 7 tacos com raridades (Common, Rare, Epic, Legendary).
- `gameModes.mock.ts` — 6 modos de jogo (8-Ball, Sinuca BR, Snooker) com taxas de entrada e recompensas.
- `leaderboard.mock.ts` — ranking global e de amigos.

**Persistência:** apenas o `userStore` persiste no `localStorage`. Dados mockados de jogos, loja e leaderboard são estáticos e recarregados a cada sessão.

---

## Mobile-First & Responsividade

- O design prioriza mobile. Desktop é uma adaptação secundária.
- Detecção de dispositivo é híbrida: combina `window.innerWidth < 1024` com `navigator.userAgent`.
- **Force Landscape:** em mobile, se o dispositivo estiver em portrait, uma overlay em tela cheia (`ForceLandscapeOverlay`) bloqueia a interface e pede para girar o aparelho.
- Classes `landscape:` do Tailwind são usadas extensivamente para ajustar tamanhos em orientação horizontal.
- O jogo mobile sempre roda em tela cheia sem header nem bottom navigation.

---

## Segurança e Considerações

- **Sem autenticação real:** o usuário é hardcoded via mock.
- **Sem backend:** não há APIs, endpoints protegidos, nem validação de servidor.
- **Persistência local:** dados do usuário ficam no `localStorage` do navegador. Qualquer um pode inspecionar/modificar.
- **Imagens:** `next.config.js` define `images.unoptimized: true`. Não há otimização de imagem do Next.js.
- **ESLint:** configuração mínima (`next/core-web-vitals`). Não há regras customizadas de segurança ou acessibilidade.

---

## Processo de Build e Deploy

1. **Dependências:** `npm install`
2. **Desenvolvimento:** `npm run dev` — acessível em `http://localhost:3000/pt`
3. **Type check:** `npm run type-check`
4. **Lint:** `npm run lint`
5. **Produção:** `npm run build` — gera build otimizado na pasta `.next/`
6. **Start produção:** `npm run start`

O projeto pode ser deployado em qualquer plataforma que suporte Next.js (Vercel, Netlify, etc.). Como não há backend nem banco de dados, deploy estático também é viável desde que as rotas dinâmicas sejam configuradas corretamente.

---

## Notas para Agentes de Código

- **Não invente backends ou APIs:** este é um protótipo frontend-only. Se precisar adicionar funcionalidades, use mocks ou Zustand.
- **Mantenha a separação mobile/desktop:** novas telas devem ter versões para ambos os dispositivos, ou pelo menos fallback adequado no `useDeviceDetection`.
- **Use `cn()` para classes:** nunca concatene strings de classe manualmente.
- **Adicione `'use client';`** se o componente usar hooks, estado, eventos ou bibliotecas client-side (Zustand, Framer Motion, next-intl client).
- **Atualize i18n:** sempre que adicionar texto visível ao usuário, adicione a chave nos três arquivos de mensagens.
- **Mantenha os mocks consistentes:** se alterar a interface `User` ou `GameMode`, atualize também os arquivos `.mock.ts`.
- **Não remova o ForceLandscapeOverlay:** ele é essencial para a experiência mobile do jogo.
