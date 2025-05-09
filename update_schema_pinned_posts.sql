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

-- Удаляем существующую функцию, чтобы избежать ошибки изменения типа возвращаемого значения
DROP FUNCTION IF EXISTS pin_post(UUID);

-- Создаем хранимую процедуру для закрепления поста
-- Эта процедура сначала открепляет все посты, а затем закрепляет указанный пост
CREATE OR REPLACE FUNCTION pin_post(post_id_to_pin UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pinned_post JSON;
  post_exists BOOLEAN;
BEGIN
  -- Проверяем, существует ли указанный пост
  SELECT EXISTS(SELECT 1 FROM posts WHERE id = post_id_to_pin) INTO post_exists;
  
  IF NOT post_exists THEN
    RAISE EXCEPTION 'Пост с указанным ID не найден: %', post_id_to_pin;
  END IF;

  -- Проверяем, является ли пользователь администратором
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Только администраторы могут закреплять посты';
  END IF;

  -- Открепляем все посты в рамках транзакции
  UPDATE posts SET is_pinned = false WHERE is_pinned = true;
  
  -- Закрепляем указанный пост
  UPDATE posts SET is_pinned = true WHERE id = post_id_to_pin;
  
  -- Возвращаем обновленный пост
  SELECT row_to_json(p) INTO pinned_post
  FROM (
    SELECT id, title, content, image_url, user_id, created_at, is_pinned
    FROM posts
    WHERE id = post_id_to_pin
  ) p;
  
  RETURN pinned_post;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Ошибка при закреплении поста: %', SQLERRM;
END;
$$; 