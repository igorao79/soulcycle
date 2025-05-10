# SoulCycle React App

Приложение SoulCycle на React с интеграцией Firebase для аутентификации и API бэкенда для работы с данными.

## О проекте

SoulCycle - это социальная платформа, которая позволяет пользователям делиться контентом, общаться и участвовать в обсуждениях через посты и комментарии.

## Технологии

- **Frontend**: React 19, Vite, CSS
- **Аутентификация**: Firebase Authentication
- **State Management**: React Hooks и Context API
- **Deployment**: GitHub Pages
- **Backend API**: https://scapi-dj82ynavq-igors-projects-f86e1b8f.vercel.app

## Система автоматического обновления кэша

Приложение включает механизм автоматического обновления кэша у пользователей при выпуске новой версии:

1. Каждый деплой автоматически обновляет файл `version.json` с номером версии и временной меткой
2. При загрузке приложения компонент `VersionChecker` сравнивает версию из `version.json` с сохраненной локально
3. Если версии отличаются, происходит автоматическая очистка кэша в браузере и localStorage
4. Страница перезагружается для применения новой версии

Это позволяет пользователям всегда получать актуальную версию сайта без необходимости вручную очищать кэш браузера.

### Работа с версиями

Для обновления версии используйте:

```bash
# Обновление патч-версии (1.0.0 -> 1.0.1)
npm run update-version

# Обновление минорной версии (1.0.0 -> 1.1.0)
npm run update-version:minor

# Обновление мажорной версии (1.0.0 -> 2.0.0)
npm run update-version:major
```

Деплой автоматически запускает обновление версии:

```bash
# Деплой с автоматическим обновлением версии
npm run deploy
```

## Миграция с Firestore на API

Проект был мигрирован с прямого использования Firebase Firestore на взаимодействие через API backend. Основные изменения:

1. Создан сервис `api.js` с методами для работы с постами, комментариями, лайками и пользователями
2. Все прямые обращения к Firestore заменены на вызовы API
3. Firebase Authentication по-прежнему используется на фронтенде для аутентификации
4. Токены Firebase используются для аутентификации запросов к API

## Настройка проекта

### Переменные среды

Создайте файл `.env` на основе `.env.example` и добавьте свои ключи Firebase:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
VITE_API_URL=https://scapi-dj82ynavq-igors-projects-f86e1b8f.vercel.app
```

### Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Деплой на GitHub Pages
npm run deploy
```

## Структура API сервиса

Сервис API предоставляет следующие методы:

### Посты
- `getPosts(options)` - получение списка постов с пагинацией и сортировкой
- `getPost(postId)` - получение конкретного поста
- `createPost(postData)` - создание нового поста
- `updatePost(postId, postData)` - обновление поста
- `deletePost(postId)` - удаление поста

### Комментарии
- `getComments(postId, options)` - получение комментариев к посту
- `createComment(postId, content)` - создание комментария
- `updateComment(postId, commentId, content)` - обновление комментария
- `deleteComment(postId, commentId)` - удаление комментария

### Лайки
- `likePost(postId)` - поставить лайк посту
- `unlikePost(postId)` - убрать лайк с поста
- `isPostLiked(postId)` - проверить, лайкнул ли пользователь пост
- `getPostLikers(postId, options)` - получить список пользователей, лайкнувших пост

### Пользователи
- `getUser(userId)` - получить данные пользователя
- `getMe()` - получить данные текущего пользователя
- `updateUser(userData)` - обновить данные пользователя
- `syncUser()` - синхронизировать данные пользователя после входа

## Установка и запуск проекта

### Предварительные требования
- Node.js (версия 14 или выше)
- npm или yarn

### Установка
1. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-username/reactbook.git
cd reactbook
```

2. Установите зависимости:
```bash
npm install
# или
yarn install
```

3. Создайте файл `.env` в корневой директории проекта со следующими переменными:
```
VITE_FIREBASE_API_KEY=ваш_api_key
VITE_FIREBASE_AUTH_DOMAIN=ваш_auth_domain
VITE_FIREBASE_PROJECT_ID=ваш_project_id
VITE_FIREBASE_STORAGE_BUCKET=ваш_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_messaging_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id
VITE_FIREBASE_MEASUREMENT_ID=ваш_measurement_id
```

4. Запустите проект в режиме разработки:
```bash
npm run dev
# или
yarn dev
```

### Сборка для продакшена
```bash
npm run build
# или
yarn build
```

## Развертывание на хостинге

### Firebase Hosting
1. Установите Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Войдите в свой аккаунт Firebase:
```bash
firebase login
```

3. Инициализируйте проект Firebase:
```bash
firebase init
```

4. Выберите Hosting и укажите директорию сборки (обычно `dist`)

5. Разверните проект:
```bash
firebase deploy
```

## Обновления

⭐ Апдейт 5.6:

• Добавлена система автоматического обновления кэша у пользователей
• Добавлена улучшенная система кэширования данных

⭐ Апдейт 5.5:

• Небольшие оптимизационные изменения

⭐ Апдейт 5:

• Добавлена ночная тема

• Добавлен новый раздел (пока в процессе разработки)

⭐ Апдейт 4:

• Визуальное улучшение проекта

• Добавление основной странички сайта

⭐ Апдейт 3:

• Визуальное улучшение проекта

• Разделение лора по страницам + переключение внутри модального окна

• Оптимизация проекта


⭐ Апдейт 2:

• Добавлено модальное окно для чтения лора


⭐ Апдейт 1:

• Добавлены карточки персонажей

• Добавлена возможность переключения карточек

## Архитектура приложения

### Фронтенд
- React с хуками
- Firebase Authentication для аутентификации
- Vite для сборки
- React Router для маршрутизации
- Взаимодействие с API через fetch

### Бэкенд
Бэкенд выделен в отдельный проект и размещен на Vercel по адресу:
- https://scapi-dj82ynavq-igors-projects-f86e1b8f.vercel.app

Бэкенд реализован с использованием:
- Flask (Python)
- Firebase Admin SDK
- Firestore для хранения данных

## Структура проекта
- `/src` - исходные файлы React приложения
- `/public` - статические файлы
- `/dist` - сборка проекта (генерируется автоматически)
