#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -d "${ROOT_DIR}/apps/api" && -d "${ROOT_DIR}/apps/web" ]]; then
  API_DIR="${ROOT_DIR}/apps/api"
  WEB_DIR="${ROOT_DIR}/apps/web"
elif [[ -d "${ROOT_DIR}/api" && -d "${ROOT_DIR}/web" ]]; then
  API_DIR="${ROOT_DIR}/api"
  WEB_DIR="${ROOT_DIR}/web"
else
  echo "No encuentro apps/api + apps/web ni api + web en ${ROOT_DIR}" >&2
  exit 1
fi

echo "Iniciando API en ${API_DIR}"
( cd "${API_DIR}" && npm run dev ) &
API_PID=$!

echo "Iniciando Web en ${WEB_DIR}"
( cd "${WEB_DIR}" && npm run dev ) &
WEB_PID=$!

cleanup() {
  echo "Deteniendo procesos..."
  kill ${API_PID} ${WEB_PID} 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM

wait ${API_PID} ${WEB_PID}
