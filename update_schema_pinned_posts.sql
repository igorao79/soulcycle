-- Добавляем колонку is_pinned в таблицу posts, если она еще не существует
ALTER TABLE IF EXISTS posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Обновляем представление posts_with_metadata, чтобы включить is_pinned
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
  p.is_pinned,
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

-- Создаем политики для закрепления/открепления постов (только для администраторов)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND (
        email = 'igoraor79@gmail.com' OR
        active_perk = 'admin' OR
        'admin' = ANY(perks)
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновление политик для таблицы posts, чтобы администраторы могли изменять статус закрепления
DROP POLICY IF EXISTS "Администраторы могут обновлять закрепление постов" ON posts;
CREATE POLICY "Администраторы могут обновлять закрепление постов" ON posts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (is_admin()); 