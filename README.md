# GW2-Daily

Guild Wars 2 daily progress tracker web application.

## Features

- Track daily tasks and progress
- Event tracking and timers
- Progress history
- Responsive web interface

## Getting Started

### Frontend
```bash
cd frontend
npm install  # ou yarn
npm start
```

### Backend (API + MongoDB opcional)
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
copy ..\.env.example .env  # depois edite MONGODB_URI se for usar Atlas
python server.py
```

Se estiver usando MongoDB Atlas, ajuste em `.env` (na raiz do projeto ou exporte no painel da Vercel):
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.exemplo.mongodb.net/?retryWrites=true&w=majority&appName=GW2Daily
MONGODB_DB=gw2_daily_public
```

Endpoints úteis:
- GET /api/ -> info da API
- GET /api/health -> status da API
- GET /api/mongo_health -> status do Mongo
- PUT /api/progress -> grava progresso (requer Mongo configurado)
- GET /api/progress/{userName} -> histórico

Sem `MONGODB_URI` a API responde mas retorna `MongoDB não configurado` nos endpoints de progresso.

### Variáveis de Ambiente (Vercel)
```
FRONTEND_URL=https://<seu-deployment>.vercel.app
MONGODB_URI=... (se usar Atlas)
MONGODB_DB=gw2_daily_public
REACT_APP_BACKEND_URL= (pode deixar vazio para usar /api relativo)
```

### Índices Recomendados Mongo
Após primeiros inserts:
```js
db.daily_progress.createIndex({ userName: 1 })
```

### Desenvolvimento Full (dois terminais)
```bash
# Terminal 1
cd backend
python server.py

# Terminal 2
cd frontend
yarn start
```

## License

MIT
