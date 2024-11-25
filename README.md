# 3D Node Visualizer

Это приложение для визуализации графа в 3D с использованием Three.js. Оно позволяет отображать узлы, их связи, выделять их и применять эффект свечения. Данные для визуализации загружаются с сервера Neo4j.

## Зависимости

Проект использует следующие основные зависимости:

- [Three.js](https://threejs.org/) — для 3D-визуализации.
- [Vite](https://vitejs.dev/) — для разработки и сборки фронтенда.
- [Neo4j](https://neo4j.com/) — графовая база данных для хранения данных узлов и связей.
- [Go](https://go.dev/) — серверная часть для работы с Neo4j.

## Установка

### 1. Установите Node.js

Убедитесь, что у вас установлен Node.js версии 16 или выше. Если он ещё не установлен, скачайте его с [официального сайта Node.js](https://nodejs.org/).

### 2. Установите Go

Убедитесь, что у вас установлен Go версии 1.22 или выше. Скачайте его с [официального сайта Go](https://go.dev/).

### 3. Клонируйте репозиторий

Клонируйте проект с сабмодулем:

```bash
git clone --recurse-submodules https://github.com/ZetoOfficial/3d-node-visualization
```

Если вы уже клонировали репозиторий без сабмодуля, выполните:

```bash
git submodule update --init --recursive
```

Перейдите в папку проекта:

```bash
cd 3d-node-visualizer
```

### 4. Установите зависимости

Установите зависимости для фронтенда:

```bash
npm install
```

## Запуск

### 1. Запуск сервера

Серверная часть находится в папке `neo4j-server`. Чтобы запустить сервер, выполните инструкции, указанные в [документации сервера](neo4j-server/readme.md).

### 2. Запуск фронтенда

Запустите фронтенд в режиме разработки:

```bash
npm run dev
```

После успешного запуска сервер разработки будет доступен по адресу:

```
http://localhost:5173
```
