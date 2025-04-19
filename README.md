⭐ Сайт визитка книги "Цикл Душ"!

⭐ Ссылка на телеграм группу: [Присоединиться к группе](https://t.me/+yFsUa_nD88piNjg6)

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
