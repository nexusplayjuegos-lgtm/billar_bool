import { Cue } from '@/types';

export const MOCK_CUES: Cue[] = [
  {
    id: "cue_beginner",
    nameKey: "cues.beginner.name",
    descriptionKey: "cues.beginner.desc",
    rarity: "common",
    stats: { power: 2, aim: 2, spin: 1, time: 3 },
    price: { coins: 0, cash: 0 },
    visual: "/assets/cues/beginner_wood.png",
    effects: [],
    unlocked: true
  },
  {
    id: "cue_venom_striker",
    nameKey: "cues.venom.name",
    descriptionKey: "cues.venom.desc",
    rarity: "rare",
    stats: { power: 5, aim: 6, spin: 4, time: 5 },
    price: { coins: 5000, cash: 0 },
    visual: "/assets/cues/venom_green.png",
    effects: ["trail_green", "hit_particle_poison"],
    unlocked: true,
    acquiredAt: "2024-04-10"
  },
  {
    id: "cue_precision_pro",
    nameKey: "cues.precision.name",
    descriptionKey: "cues.precision.desc",
    rarity: "rare",
    stats: { power: 4, aim: 8, spin: 3, time: 6 },
    price: { coins: 8000, cash: 0 },
    visual: "/assets/cues/precision_blue.png",
    effects: ["trail_blue", "aim_assist"],
    unlocked: false
  },
  {
    id: "cue_fire_storm",
    nameKey: "cues.fire.name",
    descriptionKey: "cues.fire.desc",
    rarity: "epic",
    stats: { power: 8, aim: 6, spin: 7, time: 5 },
    price: { coins: 15000, cash: 0 },
    visual: "/assets/cues/fire_orange.png",
    effects: ["trail_fire", "hit_explosion"],
    unlocked: false,
    levelRequired: 15
  },
  {
    id: "cue_ice_queen",
    nameKey: "cues.ice.name",
    descriptionKey: "cues.ice.desc",
    rarity: "epic",
    stats: { power: 6, aim: 7, spin: 8, time: 7 },
    price: { coins: 0, cash: 150 },
    visual: "/assets/cues/ice_cyan.png",
    effects: ["trail_ice", "freeze_effect", "idle_glow"],
    unlocked: false,
    levelRequired: 20
  },
  {
    id: "cue_golden_dragon",
    nameKey: "cues.dragon.name",
    descriptionKey: "cues.dragon.desc",
    rarity: "legendary",
    stats: { power: 10, aim: 9, spin: 8, time: 7 },
    price: { coins: 0, cash: 500 },
    visual: "/assets/cues/dragon_gold.png",
    effects: ["trail_fire", "hit_explosion", "idle_glow", "win_animation"],
    unlocked: false,
    levelRequired: 25
  },
  {
    id: "cue_shadow_assassin",
    nameKey: "cues.shadow.name",
    descriptionKey: "cues.shadow.desc",
    rarity: "legendary",
    stats: { power: 9, aim: 10, spin: 9, time: 8 },
    price: { coins: 0, cash: 750 },
    visual: "/assets/cues/shadow_purple.png",
    effects: ["trail_purple", "shadow_effect", "critical_hit", "idle_glow"],
    unlocked: false,
    levelRequired: 30
  }
];
