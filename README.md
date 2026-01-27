# App Generator (Idea Forge)

Generador de ideas de apps y prompts tecnicos con seleccion manual/aleatoria/LLM, 3 ideas puntuadas y salida bilingue (es/en).

## Requisitos
- Node.js 20+
- npm

## Instalacion
```bash
npm install
```

## Configuracion
1) Copia el archivo de entorno de la API:
```bash
copy apps\api\.env.example apps\api\.env
```
2) Edita `apps/api/.env` y completa tus credenciales.

Variables principales:
- `USE_LLM=true`
- `LLM_PROVIDER=deepseek` o `openai`
- `HOST=0.0.0.0` (o tu IP local)

### DeepSeek
- `DEEPSEEK_BASE_URL=https://api.deepseek.com`
- `DEEPSEEK_MODEL=deepseek-chat`

### OpenAI
- `OPENAI_BASE_URL=https://api.openai.com/v1`
- `OPENAI_MODEL=gpt-4o-mini`

### Si necesitas evitar localhost (VPN)
La UI y la API pueden servirse por IP local.

1) Averigua tu IP local:
```bash
ipconfig
```
2) Copia el archivo de entorno del frontend:
```bash
copy apps\web\.env.example apps\web\.env
```
3) Edita `apps/web/.env` y cambia la IP:
```
VITE_API_PROXY_TARGET=http://TU_IP_LOCAL:3001
```

## Ejecutar en desarrollo
En dos terminales:
```bash
npm run dev -w apps/api
```
```bash
npm run dev -w apps/web
```

### Ejecutar en una sola terminal (bash)
```bash
bash scripts/dev.sh
```

Abre la UI en:
- `http://TU_IP_LOCAL:3000`

La API corre en:
- `http://TU_IP_LOCAL:3001`

## Despliegue en VPS (Ubuntu/Debian) paso a paso
### 1) Instalar dependencias del sistema
```bash
sudo apt update
sudo apt install -y git curl build-essential
```

### 2) Instalar Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3) Clonar el repo
```bash
git clone TU_REPO.git
cd app_generator
```

### 4) Instalar dependencias y construir
```bash
npm install
npm run build -w apps/api
npm run build -w apps/web
```

### 5) Configurar la API
```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```
Valores recomendados:
```
HOST=0.0.0.0
PORT=3001
USE_LLM=true
LLM_PROVIDER=deepseek
```

### 6) Ejecutar la API con systemd
Crea el servicio:
```bash
sudo nano /etc/systemd/system/app-generator-api.service
```
Contenido:
```
[Unit]
Description=App Generator API
After=network.target

[Service]
Type=simple
WorkingDirectory=/ruta/a/app_generator/apps/api
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activa el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now app-generator-api
sudo systemctl status app-generator-api
```

### 7) Configurar Nginx (servir web + proxy /api)
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/app-generator
```
Contenido:
```
server {
  listen 80;
  server_name TU_DOMINIO_O_IP;

  root /ruta/a/app_generator/apps/web/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Habilita el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/app-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8) HTTPS (recomendado por seguridad de API keys)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d TU_DOMINIO
```

## API keys desde la UI (recomendado)
Las API keys se introducen en la UI (no se guardan).  
Se envian en el header `x-llm-api-key` solo en la peticion.
Las keys en `.env` **no se usan**.

**Seguridad:** en produccion debes usar HTTPS (por ejemplo con un reverse proxy).  
En local/lan es HTTP, asi que evita usar la key en redes no confiables.

## Seleccion de modelo/LLM
En la UI puedes:
- Desactivar LLM (modo local rapido)
- Elegir proveedor: DeepSeek u OpenAI
- Indicar un modelo especifico
- Opcionalmente cambiar la Base URL

## Build
```bash
npm run build -w apps/api
npm run build -w apps/web
```

## Endpoints
- `GET /health`
- `GET /api/v1/lists`
- `PUT /api/v1/lists`
- `GET /api/v1/languages`
- `PUT /api/v1/languages`
- `POST /api/v1/ideas`
- `POST /api/v1/codex-prompt`

## Ejemplo de request (POST /api/v1/ideas)
```json
{
  "language": "es",
  "templateLevel": "basic",
  "selections": {
    "sector": { "mode": "random" },
    "audience": { "mode": "llm" },
    "problem": { "mode": "random" },
    "productType": { "mode": "random" },
    "channel": { "mode": "random" }
  },
  "extraNotes": "prioriza MVP simple",
  "constraints": {
    "time": "2-4 semanas",
    "effort": "1 persona, 10h/semana",
    "budget": "< 500 USD"
  },
  "llm": {
    "enabled": true,
    "provider": "deepseek",
    "model": "deepseek-chat"
  }
}
```

## Ejemplo de request (POST /api/v1/codex-prompt)
```json
{
  "language": "es",
  "templateLevel": "advanced",
  "idea": {
    "title": "Idea",
    "oneLiner": "Resumen",
    "sector": "productividad",
    "audience": "equipos remotos",
    "problem": "planificacion",
    "solution": "solucion",
    "differentiator": "diferenciador",
    "mvp": ["feature 1", "feature 2", "feature 3"],
    "score": { "value": 8, "reasons": ["razon 1", "razon 2", "razon 3"] },
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2", "con 3"],
    "painFrequency": "dolor alto y recurrente",
    "willingnessToPay": "paga el responsable del area",
    "alternatives": "usan herramientas generalistas",
    "roiImpact": "ahorra tiempo",
    "adoptionFriction": "onboarding guiado",
    "acquisition": "comunidades",
    "retention": "uso recurrente semanal",
    "risks": "dependencia de integraciones"
  },
  "extraNotes": "notas opcionales",
  "constraints": {
    "time": "2-4 semanas",
    "effort": "1 persona, 10h/semana",
    "budget": "< 500 USD"
  },
  "llm": {
    "enabled": true,
    "provider": "deepseek",
    "model": "deepseek-chat"
  }
}
```

## Datos
Las listas configurables se guardan en `apps/api/data/store.json`.

## Notas
- Modo `manual`: usa el valor seleccionado.
- Modo `random`: elige aleatoriamente desde la lista.
- Modo `llm`: el LLM sugiere valores y genera las ideas/prompt.
