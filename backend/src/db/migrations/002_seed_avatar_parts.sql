-- Migration: Seed initial avatar parts
-- Created: 2025-11-08

-- デフォルトの髪型パーツ
INSERT INTO avatar_parts (category, name, asset_url, unlock_rule, rarity) VALUES
('hair', 'ショートヘア', '/avatars/hair/short.svg', '{"type": "default"}', 'common'),
('hair', 'ロングヘア', '/avatars/hair/long.svg', '{"type": "points", "required": 50}', 'common'),
('hair', 'ツインテール', '/avatars/hair/twintail.svg', '{"type": "points", "required": 100}', 'rare'),
('hair', 'ポニーテール', '/avatars/hair/ponytail.svg', '{"type": "points", "required": 100}', 'rare'),
('hair', 'アフロ', '/avatars/hair/afro.svg', '{"type": "points", "required": 200}', 'epic'),
('hair', 'ボブ', '/avatars/hair/bob.svg', '{"type": "checkin_days", "required": 5}', 'common');

-- デフォルトの目パーツ
INSERT INTO avatar_parts (category, name, asset_url, unlock_rule, rarity) VALUES
('eyes', 'まん丸目', '/avatars/eyes/round.svg', '{"type": "default"}', 'common'),
('eyes', '細目', '/avatars/eyes/narrow.svg', '{"type": "default"}', 'common'),
('eyes', 'ウィンク', '/avatars/eyes/wink.svg', '{"type": "points", "required": 30}', 'common'),
('eyes', '星目', '/avatars/eyes/star.svg', '{"type": "points", "required": 150}', 'rare'),
('eyes', 'ハート目', '/avatars/eyes/heart.svg', '{"type": "points", "required": 150}', 'rare'),
('eyes', 'キラキラ目', '/avatars/eyes/sparkle.svg', '{"type": "consecutive_days", "required": 7}', 'epic');

-- デフォルトの口パーツ
INSERT INTO avatar_parts (category, name, asset_url, unlock_rule, rarity) VALUES
('mouth', '笑顔', '/avatars/mouth/smile.svg', '{"type": "default"}', 'common'),
('mouth', '真顔', '/avatars/mouth/neutral.svg', '{"type": "default"}', 'common'),
('mouth', '大笑い', '/avatars/mouth/laugh.svg', '{"type": "points", "required": 40}', 'common'),
('mouth', 'びっくり', '/avatars/mouth/surprised.svg', '{"type": "points", "required": 80}', 'common'),
('mouth', 'ニヤリ', '/avatars/mouth/smirk.svg', '{"type": "quest_complete", "required": 3}', 'rare'),
('mouth', '口笛', '/avatars/mouth/whistle.svg', '{"type": "points", "required": 180}', 'rare');

-- デフォルトの服パーツ
INSERT INTO avatar_parts (category, name, asset_url, unlock_rule, rarity) VALUES
('clothing', 'Tシャツ', '/avatars/clothing/tshirt.svg', '{"type": "default"}', 'common'),
('clothing', 'パーカー', '/avatars/clothing/hoodie.svg', '{"type": "points", "required": 60}', 'common'),
('clothing', 'セーター', '/avatars/clothing/sweater.svg', '{"type": "checkin_days", "required": 10}', 'common'),
('clothing', 'スーツ', '/avatars/clothing/suit.svg', '{"type": "points", "required": 250}', 'rare'),
('clothing', '着物', '/avatars/clothing/kimono.svg', '{"type": "points", "required": 300}', 'epic'),
('clothing', 'エプロン', '/avatars/clothing/apron.svg', '{"type": "quest_complete", "required": 5}', 'rare');

-- デフォルトのアクセサリーパーツ
INSERT INTO avatar_parts (category, name, asset_url, unlock_rule, rarity) VALUES
('accessory', 'なし', '/avatars/accessory/none.svg', '{"type": "default"}', 'common'),
('accessory', 'メガネ', '/avatars/accessory/glasses.svg', '{"type": "points", "required": 50}', 'common'),
('accessory', 'サングラス', '/avatars/accessory/sunglasses.svg', '{"type": "points", "required": 120}', 'rare'),
('accessory', '帽子', '/avatars/accessory/hat.svg', '{"type": "checkin_days", "required": 15}', 'rare'),
('accessory', 'リボン', '/avatars/accessory/ribbon.svg', '{"type": "points", "required": 90}', 'common'),
('accessory', '王冠', '/avatars/accessory/crown.svg', '{"type": "ranking", "rank": 1, "category": "visits"}', 'legendary'),
('accessory', 'ヘッドホン', '/avatars/accessory/headphones.svg', '{"type": "consecutive_days", "required": 14}', 'epic');

-- デフォルトの色パーツ（肌色、髪色）
INSERT INTO avatar_parts (category, name, asset_url, unlock_rule, rarity) VALUES
('skin_color', '肌色1', '#ffc9a3', '{"type": "default"}', 'common'),
('skin_color', '肌色2', '#f5b895', '{"type": "default"}', 'common'),
('skin_color', '肌色3', '#d4a373', '{"type": "default"}', 'common'),
('hair_color', '黒', '#2c2c2c', '{"type": "default"}', 'common'),
('hair_color', '茶色', '#8b4513', '{"type": "default"}', 'common'),
('hair_color', '金髪', '#f4c542', '{"type": "points", "required": 70}', 'common'),
('hair_color', '赤', '#c41e3a', '{"type": "points", "required": 120}', 'rare'),
('hair_color', '青', '#4169e1', '{"type": "points", "required": 120}', 'rare'),
('hair_color', '緑', '#32cd32', '{"type": "points", "required": 120}', 'rare'),
('hair_color', 'ピンク', '#ff69b4', '{"type": "points", "required": 150}', 'rare'),
('hair_color', '紫', '#9370db', '{"type": "consecutive_days", "required": 10}', 'epic'),
('hair_color', '虹色', 'rainbow', '{"type": "ranking", "rank": 3, "category": "days"}', 'legendary');
