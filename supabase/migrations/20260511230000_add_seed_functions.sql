-- ============================================================
-- Seed Functions
-- Bool Sinuca Premiere
-- ============================================================

-- Function to seed shop_items
CREATE OR REPLACE FUNCTION public.seed_shop_items()
RETURNS void AS $$
BEGIN
  -- Cues
  INSERT INTO shop_items (category, name, description, price_coins, price_cash, rarity, stats, is_active)
  VALUES
    ('cue', 'Taco Iniciante', 'Taco básico de madeira para iniciantes. Bom para aprender.', 0, null, 'common', '{"power":3,"aim":3,"spin":1,"time":1}', true),
    ('cue', 'Taco Clássico', 'Taco tradicional de mogno. Equilibrado e confiável.', 500, null, 'common', '{"power":4,"aim":4,"spin":2,"time":2}', true),
    ('cue', 'Taco de Carvalho', 'Madeira de carvalho envelhecida. Toque sólido.', 800, null, 'common', '{"power":5,"aim":4,"spin":2,"time":2}', true),
    ('cue', 'Taco Profissional', 'Usado em campeonatos regionais. Precisão aprimorada.', 2000, null, 'rare', '{"power":6,"aim":6,"spin":4,"time":3}', true),
    ('cue', 'Taco de Ébano', 'Madeira preta densa. Peso perfeito para tacadas fortes.', 3500, null, 'rare', '{"power":7,"aim":5,"spin":5,"time":3}', true),
    ('cue', 'Taco de Bambu', 'Leve e flexível. Ideal para efeito.', 3000, null, 'rare', '{"power":5,"aim":7,"spin":6,"time":3}', true),
    ('cue', 'Taco de Carbono', 'Fibra de carbono de alta tecnologia. Leveza extrema.', 5000, 50, 'epic', '{"power":7,"aim":8,"spin":6,"time":4}', true),
    ('cue', 'Taco de Titânio', 'Titânio aeroespacial. Força máxima.', 7000, 70, 'epic', '{"power":9,"aim":7,"spin":5,"time":4}', true),
    ('cue', 'Taco de Cristal', 'Design translúcido com núcleo de grafite.', 6000, 60, 'epic', '{"power":6,"aim":9,"spin":7,"time":5}', true),
    ('cue', 'Taco Lendário', 'O taco dos campeões mundiais. Poder absoluto.', 10000, 100, 'legendary', '{"power":10,"aim":10,"spin":8,"time":5}', true),
    ('cue', 'Taco do Dragão', 'Inspirado nos antigos mestres do Oriente. Efeito supremo.', 12000, 120, 'legendary', '{"power":8,"aim":9,"spin":10,"time":6}', true),
    ('cue', 'Taco Dourado', 'Revestimento de ouro 24k. Status máximo.', 15000, 150, 'legendary', '{"power":9,"aim":10,"spin":9,"time":6}', true)
  ON CONFLICT DO NOTHING;

  -- Tables
  INSERT INTO shop_items (category, name, description, price_coins, rarity, stats, is_active)
  VALUES
    ('table', 'Mesa Clássica', 'Feltro verde tradicional. A mesa de todos os tempos.', 0, 'common', '{"friction":1.0,"restitution":1.0}', true),
    ('table', 'Mesa Azul Real', 'Feltro azul elegante. Toque de classe.', 1000, 'rare', '{"friction":0.98,"restitution":1.02}', true),
    ('table', 'Mesa Vermelha', 'Feltro vermelho vibrante. Energia na mesa.', 3000, 'epic', '{"friction":0.95,"restitution":1.05}', true),
    ('table', 'Mesa Dourada', 'Feltro preto com bordas douradas. Luxo absoluto.', 8000, 'legendary', '{"friction":0.93,"restitution":1.08}', true),
    ('table', 'Mesa de Mármore', 'Tampo de mármore branco. Fricção única.', 5000, 'epic', '{"friction":0.90,"restitution":1.10}', true)
  ON CONFLICT DO NOTHING;

  -- Coin packs
  INSERT INTO shop_items (category, name, description, price_cash, rarity, is_active)
  VALUES
    ('coin', 'Poucas Moedas', '100 moedas para começar.', 100, 'common', true),
    ('coin', 'Saco de Moedas', '500 moedas para jogar à vontade.', 500, 'common', true),
    ('coin', 'Baú de Moedas', '2.000 moedas. Grande valor.', 2000, 'rare', true),
    ('coin', 'Fortuna', '10.000 moedas. Para high rollers.', 10000, 'epic', true),
    ('coin', 'Jackpot', '50.000 moedas. O sonho de todo jogador.', 50000, 'legendary', true)
  ON CONFLICT DO NOTHING;

  -- Cash packs
  INSERT INTO shop_items (category, name, description, price_coins, rarity, is_active)
  VALUES
    ('cash', 'Pouco Cash', '10 cash. Para acelerar uma box.', 1000, 'common', true),
    ('cash', 'Monte de Cash', '50 cash. Para várias acelerações.', 5000, 'common', true),
    ('cash', 'Pilha de Cash', '200 cash. Para jogadores frequentes.', 20000, 'rare', true),
    ('cash', 'Fortuna em Cash', '1.000 cash. Para quem quer tudo.', 100000, 'epic', true)
  ON CONFLICT DO NOTHING;

  -- Special bundles
  INSERT INTO shop_items (category, name, description, price_cash, rarity, is_limited, available_until, is_active)
  VALUES
    ('special', 'Pack Iniciante', 'Taco Clássico + Mesa Azul + 500 moedas. Perfeito para começar.', 200, 'rare', true, (now() + interval '7 days'), true),
    ('special', 'Pack Pro', 'Taco de Carbono + Mesa Vermelha + 2.000 moedas + 50 cash.', 1000, 'epic', true, (now() + interval '3 days'), true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to seed season_passes
CREATE OR REPLACE FUNCTION public.seed_season_pass()
RETURNS void AS $$
DECLARE
  free_rewards jsonb;
  premium_rewards jsonb;
  elite_rewards jsonb;
BEGIN
  free_rewards := '[
    {"type":"coins","amount":100,"icon":"🪙","name":"100 Moedas"},{"type":"coins","amount":55,"icon":"🪙","name":"55 Moedas"},{"type":"xp","amount":65,"icon":"⭐","name":"65 XP"},{"type":"coins","amount":70,"icon":"🪙","name":"70 Moedas"},{"type":"cash","amount":5,"icon":"💎","name":"5 Cash"},
    {"type":"xp","amount":80,"icon":"⭐","name":"80 XP"},{"type":"coins","amount":85,"icon":"🪙","name":"85 Moedas"},{"type":"coins","amount":90,"icon":"🪙","name":"90 Moedas"},{"type":"xp","amount":95,"icon":"⭐","name":"95 XP"},{"type":"cue","amount":1,"icon":"🎱","name":"Taco Clássico","itemId":"taco-classico","rarity":"common"},
    {"type":"coins","amount":105,"icon":"🪙","name":"105 Moedas"},{"type":"xp","amount":110,"icon":"⭐","name":"110 XP"},{"type":"coins","amount":115,"icon":"🪙","name":"115 Moedas"},{"type":"coins","amount":120,"icon":"🪙","name":"120 Moedas"},{"type":"coins","amount":500,"icon":"🪙","name":"500 Moedas"},
    {"type":"coins","amount":130,"icon":"🪙","name":"130 Moedas"},{"type":"coins","amount":135,"icon":"🪙","name":"135 Moedas"},{"type":"xp","amount":140,"icon":"⭐","name":"140 XP"},{"type":"coins","amount":145,"icon":"🪙","name":"145 Moedas"},{"type":"box","amount":1,"icon":"📦","name":"Caixa Rara","rarity":"rare"},
    {"type":"xp","amount":155,"icon":"⭐","name":"155 XP"},{"type":"coins","amount":160,"icon":"🪙","name":"160 Moedas"},{"type":"coins","amount":165,"icon":"🪙","name":"165 Moedas"},{"type":"xp","amount":170,"icon":"⭐","name":"170 XP"},{"type":"cash","amount":15,"icon":"💎","name":"15 Cash"},
    {"type":"coins","amount":180,"icon":"🪙","name":"180 Moedas"},{"type":"coins","amount":185,"icon":"🪙","name":"185 Moedas"},{"type":"xp","amount":190,"icon":"⭐","name":"190 XP"},{"type":"coins","amount":195,"icon":"🪙","name":"195 Moedas"},{"type":"table","amount":1,"icon":"🎱","name":"Mesa Azul Real","itemId":"mesa-azul","rarity":"rare"},
    {"type":"coins","amount":205,"icon":"🪙","name":"205 Moedas"},{"type":"xp","amount":210,"icon":"⭐","name":"210 XP"},{"type":"coins","amount":215,"icon":"🪙","name":"215 Moedas"},{"type":"coins","amount":220,"icon":"🪙","name":"220 Moedas"},{"type":"cash","amount":25,"icon":"💎","name":"25 Cash"},
    {"type":"xp","amount":230,"icon":"⭐","name":"230 XP"},{"type":"coins","amount":235,"icon":"🪙","name":"235 Moedas"},{"type":"coins","amount":240,"icon":"🪙","name":"240 Moedas"},{"type":"xp","amount":245,"icon":"⭐","name":"245 XP"},{"type":"coins","amount":1000,"icon":"🪙","name":"1000 Moedas"},
    {"type":"coins","amount":255,"icon":"🪙","name":"255 Moedas"},{"type":"xp","amount":260,"icon":"⭐","name":"260 XP"},{"type":"coins","amount":265,"icon":"🪙","name":"265 Moedas"},{"type":"coins","amount":270,"icon":"🪙","name":"270 Moedas"},{"type":"cash","amount":35,"icon":"💎","name":"35 Cash"},
    {"type":"xp","amount":280,"icon":"⭐","name":"280 XP"},{"type":"coins","amount":285,"icon":"🪙","name":"285 Moedas"},{"type":"coins","amount":290,"icon":"🪙","name":"290 Moedas"},{"type":"xp","amount":295,"icon":"⭐","name":"295 XP"},{"type":"box","amount":1,"icon":"📦","name":"Caixa Épica","rarity":"epic"},
    {"type":"coins","amount":305,"icon":"🪙","name":"305 Moedas"},{"type":"xp","amount":310,"icon":"⭐","name":"310 XP"},{"type":"coins","amount":315,"icon":"🪙","name":"315 Moedas"},{"type":"coins","amount":320,"icon":"🪙","name":"320 Moedas"},{"type":"cash","amount":45,"icon":"💎","name":"45 Cash"},
    {"type":"xp","amount":330,"icon":"⭐","name":"330 XP"},{"type":"coins","amount":335,"icon":"🪙","name":"335 Moedas"},{"type":"coins","amount":340,"icon":"🪙","name":"340 Moedas"},{"type":"xp","amount":345,"icon":"⭐","name":"345 XP"},{"type":"coins","amount":350,"icon":"🪙","name":"350 Moedas"},
    {"type":"coins","amount":2000,"icon":"🪙","name":"2000 Moedas"},{"type":"xp","amount":360,"icon":"⭐","name":"360 XP"},{"type":"coins","amount":365,"icon":"🪙","name":"365 Moedas"},{"type":"coins","amount":370,"icon":"🪙","name":"370 Moedas"},{"type":"cash","amount":30,"icon":"💎","name":"30 Cash"},
    {"type":"cue","amount":1,"icon":"🎱","name":"Taco Lendário","itemId":"taco-lendario","rarity":"legendary"}
  ]'::jsonb;

  premium_rewards := '[
    {"type":"coins","amount":500,"icon":"🪙","name":"500 Moedas Premium"},{"type":"coins","amount":220,"icon":"🪙","name":"220 Moedas"},{"type":"spin","amount":2,"icon":"🎰","name":"2 Spins"},{"type":"coins","amount":240,"icon":"🪙","name":"240 Moedas"},{"type":"cash","amount":20,"icon":"💎","name":"20 Cash"},
    {"type":"spin","amount":2,"icon":"🎰","name":"2 Spins"},{"type":"coins","amount":270,"icon":"🪙","name":"270 Moedas"},{"type":"coins","amount":280,"icon":"🪙","name":"280 Moedas"},{"type":"spin","amount":2,"icon":"🎰","name":"2 Spins"},{"type":"cue","amount":1,"icon":"🎱","name":"Taco Profissional","itemId":"taco-pro","rarity":"rare"},
    {"type":"coins","amount":310,"icon":"🪙","name":"310 Moedas"},{"type":"spin","amount":3,"icon":"🎰","name":"3 Spins"},{"type":"coins","amount":330,"icon":"🪙","name":"330 Moedas"},{"type":"coins","amount":340,"icon":"🪙","name":"340 Moedas"},{"type":"coins","amount":1500,"icon":"🪙","name":"1500 Moedas"},
    {"type":"coins","amount":360,"icon":"🪙","name":"360 Moedas"},{"type":"coins","amount":370,"icon":"🪙","name":"370 Moedas"},{"type":"spin","amount":3,"icon":"🎰","name":"3 Spins"},{"type":"coins","amount":390,"icon":"🪙","name":"390 Moedas"},{"type":"box","amount":1,"icon":"📦","name":"Caixa Épica","rarity":"epic"},
    {"type":"spin","amount":4,"icon":"🎰","name":"4 Spins"},{"type":"coins","amount":420,"icon":"🪙","name":"420 Moedas"},{"type":"coins","amount":430,"icon":"🪙","name":"430 Moedas"},{"type":"spin","amount":4,"icon":"🎰","name":"4 Spins"},{"type":"cash","amount":50,"icon":"💎","name":"50 Cash"},
    {"type":"coins","amount":460,"icon":"🪙","name":"460 Moedas"},{"type":"spin","amount":4,"icon":"🎰","name":"4 Spins"},{"type":"coins","amount":480,"icon":"🪙","name":"480 Moedas"},{"type":"coins","amount":490,"icon":"🪙","name":"490 Moedas"},{"type":"table","amount":1,"icon":"🎱","name":"Mesa Vermelha","itemId":"mesa-vermelha","rarity":"epic"},
    {"type":"spin","amount":5,"icon":"🎰","name":"5 Spins"},{"type":"coins","amount":520,"icon":"🪙","name":"520 Moedas"},{"type":"coins","amount":530,"icon":"🪙","name":"530 Moedas"},{"type":"spin","amount":5,"icon":"🎰","name":"5 Spins"},{"type":"coins","amount":3000,"icon":"🪙","name":"3000 Moedas"},
    {"type":"spin","amount":5,"icon":"🎰","name":"5 Spins"},{"type":"coins","amount":560,"icon":"🪙","name":"560 Moedas"},{"type":"coins","amount":570,"icon":"🪙","name":"570 Moedas"},{"type":"spin","amount":6,"icon":"🎰","name":"6 Spins"},{"type":"box","amount":1,"icon":"📦","name":"Caixa Lendária","rarity":"legendary"},
    {"type":"spin","amount":6,"icon":"🎰","name":"6 Spins"},{"type":"coins","amount":600,"icon":"🪙","name":"600 Moedas"},{"type":"coins","amount":610,"icon":"🪙","name":"610 Moedas"},{"type":"spin","amount":6,"icon":"🎰","name":"6 Spins"},{"type":"cash","amount":80,"icon":"💎","name":"80 Cash"},
    {"type":"coins","amount":630,"icon":"🪙","name":"630 Moedas"},{"type":"spin","amount":7,"icon":"🎰","name":"7 Spins"},{"type":"coins","amount":650,"icon":"🪙","name":"650 Moedas"},{"type":"coins","amount":660,"icon":"🪙","name":"660 Moedas"},{"type":"spin","amount":7,"icon":"🎰","name":"7 Spins"},
    {"type":"cash","amount":100,"icon":"💎","name":"100 Cash"},{"type":"spin","amount":7,"icon":"🎰","name":"7 Spins"},{"type":"coins","amount":690,"icon":"🪙","name":"690 Moedas"},{"type":"coins","amount":700,"icon":"🪙","name":"700 Moedas"},{"type":"spin","amount":8,"icon":"🎰","name":"8 Spins"},
    {"type":"cue","amount":1,"icon":"🎱","name":"Taco Dourado","itemId":"taco-dourado","rarity":"legendary"}
  ]'::jsonb;

  elite_rewards := '[
    {"type":"cash","amount":50,"icon":"💎","name":"50 Cash Elite"},{"type":"coins","amount":105,"icon":"🪙","name":"105 Moedas"},{"type":"coins","amount":110,"icon":"🪙","name":"110 Moedas"},{"type":"coins","amount":115,"icon":"🪙","name":"115 Moedas"},{"type":"cash","amount":30,"icon":"💎","name":"30 Cash"},
    {"type":"coins","amount":125,"icon":"🪙","name":"125 Moedas"},{"type":"coins","amount":130,"icon":"🪙","name":"130 Moedas"},{"type":"coins","amount":135,"icon":"🪙","name":"135 Moedas"},{"type":"coins","amount":140,"icon":"🪙","name":"140 Moedas"},{"type":"box","amount":1,"icon":"📦","name":"Caixa Épica Elite","rarity":"epic"},
    {"type":"coins","amount":150,"icon":"🪙","name":"150 Moedas"},{"type":"coins","amount":155,"icon":"🪙","name":"155 Moedas"},{"type":"coins","amount":160,"icon":"🪙","name":"160 Moedas"},{"type":"coins","amount":165,"icon":"🪙","name":"165 Moedas"},{"type":"cash","amount":50,"icon":"💎","name":"50 Cash"},
    {"type":"coins","amount":175,"icon":"🪙","name":"175 Moedas"},{"type":"coins","amount":180,"icon":"🪙","name":"180 Moedas"},{"type":"coins","amount":185,"icon":"🪙","name":"185 Moedas"},{"type":"coins","amount":190,"icon":"🪙","name":"190 Moedas"},{"type":"cash","amount":100,"icon":"💎","name":"100 Cash"},
    {"type":"coins","amount":200,"icon":"🪙","name":"200 Moedas"},{"type":"coins","amount":205,"icon":"🪙","name":"205 Moedas"},{"type":"coins","amount":210,"icon":"🪙","name":"210 Moedas"},{"type":"coins","amount":215,"icon":"🪙","name":"215 Moedas"},{"type":"coins","amount":5000,"icon":"🪙","name":"5000 Moedas Elite"},
    {"type":"coins","amount":225,"icon":"🪙","name":"225 Moedas"},{"type":"coins","amount":230,"icon":"🪙","name":"230 Moedas"},{"type":"coins","amount":235,"icon":"🪙","name":"235 Moedas"},{"type":"coins","amount":240,"icon":"🪙","name":"240 Moedas"},{"type":"box","amount":1,"icon":"📦","name":"Caixa Lendária Elite","rarity":"legendary"},
    {"type":"coins","amount":250,"icon":"🪙","name":"250 Moedas"},{"type":"coins","amount":255,"icon":"🪙","name":"255 Moedas"},{"type":"coins","amount":260,"icon":"🪙","name":"260 Moedas"},{"type":"coins","amount":265,"icon":"🪙","name":"265 Moedas"},{"type":"cash","amount":150,"icon":"💎","name":"150 Cash"},
    {"type":"coins","amount":275,"icon":"🪙","name":"275 Moedas"},{"type":"coins","amount":280,"icon":"🪙","name":"280 Moedas"},{"type":"coins","amount":285,"icon":"🪙","name":"285 Moedas"},{"type":"coins","amount":290,"icon":"🪙","name":"290 Moedas"},{"type":"coins","amount":3500,"icon":"🪙","name":"3500 Moedas"},
    {"type":"coins","amount":300,"icon":"🪙","name":"300 Moedas"},{"type":"coins","amount":305,"icon":"🪙","name":"305 Moedas"},{"type":"coins","amount":310,"icon":"🪙","name":"310 Moedas"},{"type":"coins","amount":315,"icon":"🪙","name":"315 Moedas"},{"type":"cash","amount":200,"icon":"💎","name":"200 Cash"},
    {"type":"coins","amount":325,"icon":"🪙","name":"325 Moedas"},{"type":"coins","amount":330,"icon":"🪙","name":"330 Moedas"},{"type":"coins","amount":335,"icon":"🪙","name":"335 Moedas"},{"type":"coins","amount":340,"icon":"🪙","name":"340 Moedas"},{"type":"coins","amount":4000,"icon":"🪙","name":"4000 Moedas"},
    {"type":"coins","amount":350,"icon":"🪙","name":"350 Moedas"},{"type":"coins","amount":355,"icon":"🪙","name":"355 Moedas"},{"type":"coins","amount":360,"icon":"🪙","name":"360 Moedas"},{"type":"coins","amount":365,"icon":"🪙","name":"365 Moedas"},{"type":"cash","amount":250,"icon":"💎","name":"250 Cash"},
    {"type":"cue","amount":1,"icon":"🎱","name":"Taco do Dragão","itemId":"taco-dragao","rarity":"legendary"}
  ]'::jsonb;

  INSERT INTO season_passes (
    season_number, title, start_date, end_date, theme,
    free_rewards, premium_rewards, elite_rewards
  ) VALUES (
    1, 'Season 1: Lançamento',
    timezone('utc'::text, now()),
    timezone('utc'::text, now() + interval '30 days'),
    '{"primaryColor":"#3B82F6","secondaryColor":"#8B5CF6","accentColor":"#F59E0B","badgeIcon":"🏆","backgroundImage":"/images/seasons/season1-bg.jpg"}'::jsonb,
    free_rewards, premium_rewards, elite_rewards
  )
  ON CONFLICT (season_number) DO UPDATE SET
    title = EXCLUDED.title,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    theme = EXCLUDED.theme,
    free_rewards = EXCLUDED.free_rewards,
    premium_rewards = EXCLUDED.premium_rewards,
    elite_rewards = EXCLUDED.elite_rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
