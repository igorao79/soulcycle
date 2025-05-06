-- Создание таблицы для хранения информации о блокировках пользователей
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ban_type TEXT NOT NULL
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_is_active ON public.user_bans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_bans_created_at ON public.user_bans(created_at);

-- Добавление разрешений
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Добавление полей для хранения информации о блокировке в таблице профилей
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_end_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_admin_name TEXT;

-- Политики доступа

-- Функция для проверки администраторских прав
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'igoraor79@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND 
      (
        'admin' = ANY(perks) OR
        active_perk = 'admin'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Чтение информации о блокировках разрешено:
-- 1. Администраторам
-- 2. Самому пользователю для просмотра своих блокировок
CREATE POLICY "Admins can read all bans"
  ON public.user_bans FOR SELECT
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'igoraor79@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND 
      (
        'admin' = ANY(perks) OR
        active_perk = 'admin'
      )
    )
  );

CREATE POLICY "Users can view their own bans"
  ON public.user_bans FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Создание блокировок разрешено только администраторам
CREATE POLICY "Only admins can create bans"
  ON public.user_bans FOR INSERT
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'igoraor79@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND 
      (
        'admin' = ANY(perks) OR
        active_perk = 'admin'
      )
    )
  );

-- Обновление и удаление блокировок разрешено только администраторам
CREATE POLICY "Only admins can update bans"
  ON public.user_bans FOR UPDATE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'igoraor79@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND 
      (
        'admin' = ANY(perks) OR
        active_perk = 'admin'
      )
    )
  );

CREATE POLICY "Only admins can delete bans"
  ON public.user_bans FOR DELETE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'igoraor79@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND 
      (
        'admin' = ANY(perks) OR
        active_perk = 'admin'
      )
    )
  );

-- Добавление привилегий для анонимных пользователей чтения (для проверки бана при попытке входа)
GRANT SELECT ON public.user_bans TO anon;
GRANT SELECT ON public.profiles TO anon; 