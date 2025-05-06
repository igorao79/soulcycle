-- Создание таблицы для постов
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  styling JSONB DEFAULT NULL,
  poll_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание таблицы для лайков
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Уникальный индекс чтобы пользователь мог поставить только один лайк посту
  UNIQUE(post_id, user_id)
);

-- Создание таблицы для комментариев
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание таблицы для профилей пользователей
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание триггера для создания профиля при регистрации пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Пользователь'),
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер, который срабатывает после вставки нового пользователя
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Настройка политик безопасности Row Level Security (RLS)

-- Включаем RLS для всех таблиц
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы posts
CREATE POLICY "Все могут читать посты" ON posts FOR SELECT USING (true);
CREATE POLICY "Авторизованные пользователи могут создавать посты" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Пользователи могут редактировать свои посты" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Пользователи могут удалять свои посты" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Политики для таблицы post_likes
CREATE POLICY "Все могут читать лайки" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Авторизованные пользователи могут ставить лайки" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Пользователи могут удалять свои лайки" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Политики для таблицы post_comments
CREATE POLICY "Все могут читать комментарии" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Авторизованные пользователи могут создавать комментарии" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Пользователи могут редактировать свои комментарии" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Пользователи могут удалять свои комментарии" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Политики для таблицы profiles
CREATE POLICY "Все могут просматривать профили" ON profiles FOR SELECT USING (true);
CREATE POLICY "Пользователи могут обновлять свои профили" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Создание представлений для удобного доступа к данным

-- Представление с постами, включая инфо об авторе и количестве лайков/комментариев
CREATE VIEW posts_with_metadata AS
SELECT 
  p.id,
  p.content,
  p.image_url,
  p.user_id,
  p.created_at,
  pr.display_name as author_name,
  pr.avatar as author_avatar,
  (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
  (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
FROM 
  posts p
JOIN 
  profiles pr ON p.user_id = pr.id; 