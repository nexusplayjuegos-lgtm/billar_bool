-- ============================================
-- SEED: TACOS (Cues)
-- ============================================

INSERT INTO shop_items (category, name, description, price_coins, price_cash, rarity, stats, is_active) VALUES
-- Common (grátis ou barato)
('cue', 'Taco Iniciante', 'Taco básico de madeira para iniciantes. Bom para aprender.', 0, null, 'common', '{"power":3,"aim":3,"spin":1,"time":1}', true),
('cue', 'Taco Clássico', 'Taco tradicional de mogno. Equilibrado e confiável.', 500, null, 'common', '{"power":4,"aim":4,"spin":2,"time":2}', true),
('cue', 'Taco de Carvalho', 'Madeira de carvalho envelhecida. Toque sólido.', 800, null, 'common', '{"power":5,"aim":4,"spin":2,"time":2}', true),

-- Rare
('cue', 'Taco Profissional', 'Usado em campeonatos regionais. Precisão aprimorada.', 2000, null, 'rare', '{"power":6,"aim":6,"spin":4,"time":3}', true),
('cue', 'Taco de Ébano', 'Madeira preta densa. Peso perfeito para tacadas fortes.', 3500, null, 'rare', '{"power":7,"aim":5,"spin":5,"time":3}', true),
('cue', 'Taco de Bambu', 'Leve e flexível. Ideal para efeito.', 3000, null, 'rare', '{"power":5,"aim":7,"spin":6,"time":3}', true),

-- Epic
('cue', 'Taco de Carbono', 'Fibra de carbono de alta tecnologia. Leveza extrema.', 5000, 50, 'epic', '{"power":7,"aim":8,"spin":6,"time":4}', true),
('cue', 'Taco de Titânio', 'Titânio aeroespacial. Força máxima.', 7000, 70, 'epic', '{"power":9,"aim":7,"spin":5,"time":4}', true),
('cue', 'Taco de Cristal', 'Design translúcido com núcleo de grafite.', 6000, 60, 'epic', '{"power":6,"aim":9,"spin":7,"time":5}', true),

-- Legendary
('cue', 'Taco Lendário', 'O taco dos campeões mundiais. Poder absoluto.', 10000, 100, 'legendary', '{"power":10,"aim":10,"spin":8,"time":5}', true),
('cue', 'Taco do Dragão', 'Inspirado nos antigos mestres do Oriente. Efeito supremo.', 12000, 120, 'legendary', '{"power":8,"aim":9,"spin":10,"time":6}', true),
('cue', 'Taco Dourado', 'Revestimento de ouro 24k. Status máximo.', 15000, 150, 'legendary', '{"power":9,"aim":10,"spin":9,"time":6}', true);

-- ============================================
-- SEED: MESAS (Tables)
-- ============================================

INSERT INTO shop_items (category, name, description, price_coins, rarity, stats, is_active) VALUES
('table', 'Mesa Clássica', 'Feltro verde tradicional. A mesa de todos os tempos.', 0, 'common', '{"friction":1.0,"restitution":1.0}', true),
('table', 'Mesa Azul Real', 'Feltro azul elegante. Toque de classe.', 1000, 'rare', '{"friction":0.98,"restitution":1.02}', true),
('table', 'Mesa Vermelha', 'Feltro vermelho vibrante. Energia na mesa.', 3000, 'epic', '{"friction":0.95,"restitution":1.05}', true),
('table', 'Mesa Dourada', 'Feltro preto com bordas douradas. Luxo absoluto.', 8000, 'legendary', '{"friction":0.93,"restitution":1.08}', true),
('table', 'Mesa de Mármore', 'Tampo de mármore branco. Fricção única.', 5000, 'epic', '{"friction":0.90,"restitution":1.10}', true);

-- ============================================
-- SEED: PACKS DE MOEDAS (Coin Packs)
-- ============================================

INSERT INTO shop_items (category, name, description, price_cash, rarity, is_active) VALUES
('coin', 'Poucas Moedas', '100 moedas para começar.', 100, 'common', true),
('coin', 'Saco de Moedas', '500 moedas para jogar à vontade.', 500, 'common', true),
('coin', 'Baú de Moedas', '2.000 moedas. Grande valor.', 2000, 'rare', true),
('coin', 'Fortuna', '10.000 moedas. Para high rollers.', 10000, 'epic', true),
('coin', 'Jackpot', '50.000 moedas. O sonho de todo jogador.', 50000, 'legendary', true);

-- ============================================
-- SEED: PACKS DE CASH (Cash Packs — para comprar com dinheiro real futuramente)
-- ============================================

INSERT INTO shop_items (category, name, description, price_coins, rarity, is_active) VALUES
('cash', 'Pouco Cash', '10 cash. Para acelerar uma box.', 1000, 'common', true),
('cash', 'Monte de Cash', '50 cash. Para várias acelerações.', 5000, 'common', true),
('cash', 'Pilha de Cash', '200 cash. Para jogadores frequentes.', 20000, 'rare', true),
('cash', 'Fortuna em Cash', '1.000 cash. Para quem quer tudo.', 100000, 'epic', true);

-- ============================================
-- SEED: ESPECIAL (Bundles e Ofertas)
-- ============================================

INSERT INTO shop_items (category, name, description, price_cash, rarity, is_limited, available_until, is_active) VALUES
('special', 'Pack Iniciante', 'Taco Clássico + Mesa Azul + 500 moedas. Perfeito para começar.', 200, 'rare', true, (now() + interval '7 days'), true),
('special', 'Pack Pro', 'Taco de Carbono + Mesa Vermelha + 2.000 moedas + 50 cash.', 1000, 'epic', true, (now() + interval '3 days'), true);
