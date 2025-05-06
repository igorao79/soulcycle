-- Создание таблицы профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем RLS для таблицы profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Создаем политики доступа для profiles
CREATE POLICY "Allow public read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Создаем триггер для автоматического создания профиля при регистрации пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.email),
    NULL,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматического создания профиля
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Заполняем профили для существующих пользователей (если есть)
INSERT INTO profiles (id, display_name, role)
SELECT id, email, 'user'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);

-- Обновляем posts для корректного отображения имен пользователей
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Создаем функцию для обновления автора поста
CREATE OR REPLACE FUNCTION update_post_author() RETURNS TRIGGER AS $$
BEGIN
  NEW.author_name := (SELECT display_name FROM profiles WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления имени автора при создании поста
CREATE OR REPLACE TRIGGER update_post_author_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE PROCEDURE update_post_author();

-- Обновим существующие посты, если они есть
UPDATE posts
SET author_name = (SELECT display_name FROM profiles WHERE profiles.id = posts.user_id)
WHERE author_name IS NULL; 