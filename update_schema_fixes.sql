-- Добавление полей для перков в таблицу profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_perk TEXT DEFAULT 'user';

-- Обновление представления public_profiles для включения информации о перках
DROP VIEW IF EXISTS public.public_profiles;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'display_name' as display_name,
  raw_user_meta_data->>'avatar' as avatar,
  COALESCE(raw_user_meta_data->>'role', 'user') as role,
  COALESCE(raw_user_meta_data->>'perks', '[]') as perks,
  COALESCE(raw_user_meta_data->>'active_perk', 'user') as active_perk,
  created_at,
  updated_at
FROM auth.users;

-- Обновление функции handle_new_user для сохранения перков
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar, role, perks, active_perk)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'perks', '[]')::jsonb,
    COALESCE(NEW.raw_user_meta_data->>'active_perk', 'user')
  );
  RETURN NEW;
END;
$$;

-- Обновление представления posts_with_metadata для включения всех необходимых полей
DROP VIEW IF EXISTS posts_with_metadata;
CREATE VIEW posts_with_metadata AS
SELECT 
  p.id,
  p.title,
  p.content,
  p.image_url,
  p.user_id,
  p.styling,
  p.poll_data,
  p.created_at,
  COALESCE(pr.display_name, pp.display_name) as author_name,
  COALESCE(pr.avatar, pp.avatar) as author_avatar,
  COALESCE(pr.perks, '[]'::jsonb) as author_perks,
  COALESCE(pr.active_perk, 'user') as author_active_perk,
  (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
  (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
FROM 
  posts p
LEFT JOIN 
  profiles pr ON p.user_id = pr.id
LEFT JOIN 
  public_profiles pp ON p.user_id = pp.id;

-- Создание таблицы для голосований в опросах, если её нет
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Включение RLS для таблицы poll_votes
ALTER TABLE IF EXISTS poll_votes ENABLE ROW LEVEL SECURITY;

-- Создание политик для poll_votes
CREATE POLICY IF NOT EXISTS "Все могут читать голоса" ON poll_votes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Авторизованные пользователи могут голосовать" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Пользователи могут обновлять свои голоса" ON poll_votes FOR UPDATE USING (auth.uid() = user_id); 