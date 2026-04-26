#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
cd "$PROJECT_DIR"

echo "==> Directorio: $PROJECT_DIR"

# ── Docker ───────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "==> Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "${USER:-ubuntu}"
  newgrp docker
fi

# ── Swap (para instancias con poca RAM) ──────────────────────────────────────
if [ ! -f /swapfile ]; then
  echo "==> Creando 2 GB de swap..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# ── Limpieza y rebuild ───────────────────────────────────────────────────────
echo "==> Limpiando contenedores y volúmenes anteriores..."
docker compose down -v 2>/dev/null || true

echo "==> Construyendo imágenes (puede tardar 5-10 min)..."
docker compose build --no-cache

echo "==> Iniciando servicios..."
docker compose up -d

echo ""
docker compose ps

echo ""
echo "==> Esperando que el API arranque (90s)..."
sleep 90
docker compose logs --tail=20 api

echo ""
echo "================================================================="
echo "  Verifica: https://caleiro.online"
echo "  Logs completos: docker compose logs -f"
echo "================================================================="
