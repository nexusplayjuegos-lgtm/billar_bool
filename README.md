# 🎱 BOOL SINUCA PREMIERE

O jogo de sinuca mais viciante do Brasil. Uma experiência mobile-first de dominação digital, construída com Next.js 14, TypeScript e Tailwind CSS.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript 5.3
- **Estilização:** Tailwind CSS 3.4
- **Animações:** Framer Motion
- **Estado Global:** Zustand
- **i18n:** next-intl (PT/EN/ES)
- **Ícones:** Lucide React

## 📁 Estrutura do Projeto

```
bool-sinuca/
├── src/
│   ├── app/[locale]/
│   │   ├── (mobile)/          # Rotas mobile
│   │   │   ├── page.tsx       # Lobby
│   │   │   ├── shop/page.tsx  # Loja
│   │   │   ├── leaderboard/   # Ranking
│   │   │   ├── profile/       # Perfil
│   │   │   └── (game)/        # Jogo
│   │   └── (desktop)/         # Versão desktop
│   ├── components/
│   │   ├── mobile/            # Componentes mobile
│   │   │   ├── layout/        # Header, BottomNav, ForceLandscape
│   │   │   ├── lobby/         # GameModeCard, LobbyScreen
│   │   │   ├── shop/          # CueCard, ShopScreen
│   │   │   ├── game/          # PoolTable, AimControl, PowerSlider
│   │   │   └── effects/       # Confetti, CoinAnimation
│   │   └── desktop/           # Layout desktop
│   ├── lib/
│   │   ├── i18n/              # Mensagens PT/EN/ES
│   │   ├── store/             # Zustand stores
│   │   └── utils/             # Utilitários
│   ├── mocks/data/            # Dados mockados
│   ├── types/                 # TypeScript types
│   └── hooks/                 # Hooks customizados
├── public/assets/             # Imagens, sons
└── package.json
```

## 🎮 Funcionalidades Implementadas

### Mobile (Foco Principal)
- ✅ **Force Landscape:** Bloqueio de portrait com animação
- ✅ **Header:** Avatar, nível, XP, moedas, cash
- ✅ **Bottom Navigation:** Play, Shop, Friends, Leaderboard
- ✅ **Lobby:** Carrossel de modos de jogo (8-Ball, Sinuca BR, Snooker)
- ✅ **Loja:** Tabs (Tacos, Mesas, Moedas, Cash, Especial)
- ✅ **Jogo:** Canvas 2D, mira touch, slider de força, botão bater
- ✅ **Animações:** Framer Motion em todas as transições
- ✅ **Efeitos:** Confetes, animação de moedas

### Desktop
- ✅ **Sidebar Layout:** Navegação lateral completa
- ✅ **Dashboard:** Stats, modos de jogo, leaderboard
- ✅ **Responsive:** Adaptação automática mobile/desktop

### Internacionalização
- ✅ **PT-BR:** Português (padrão)
- ✅ **EN:** Inglês
- ✅ **ES:** Espanhol

### Dados Mockados
- ✅ **Usuário:** SinucaMaster, nível 7, 12.500 moedas
- ✅ **Tacos:** 7 tacos (Common, Rare, Epic, Legendary)
- ✅ **Modos:** 6 modos (8-Ball, Sinuca BR, Snooker)
- ✅ **Leaderboard:** Top 10 global + amigos

## 🛠️ Como Executar

1. **Instalar dependências:**
```bash
cd bool-sinuca
npm install
```

2. **Executar em modo desenvolvimento:**
```bash
npm run dev
```

3. **Acessar:**
- Mobile: http://localhost:3000/pt (simule mobile no DevTools)
- Desktop: http://localhost:3000/pt (modo desktop automático)

4. **Build para produção:**
```bash
npm run build
```

## 🎯 Próximos Passos (Futuro)

- [ ] Conectar backend real (Supabase/Firebase)
- [ ] Multiplayer em tempo real (WebSocket)
- [ ] Física avançada das bolas (colisões realistas)
- [ ] Sons e música
- [ ] Sistema de torneios
- [ ] Clube de jogadores
- [ ] Integração de pagamentos

## 📝 Notas

Este é um protótipo funcional com dados mockados. Todas as interações são locais e persistem no localStorage (Zustand persist).

---

**BOOL SINUCA PREMIERE** - Domine a mesa! 🎱👑
