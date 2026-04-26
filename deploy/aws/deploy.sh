#!/usr/bin/env bash
# =============================================================================
#  deploy.sh  —  Despliegue completo de Coursite en EC2 para caleiro.online
#  Ejecutar como: bash deploy.sh
# =============================================================================
set -euo pipefail

PROJECT_DIR="/opt/coursite"
REPO_URL="${REPO_URL:-}"   # opcional: URL del repo git para clonar
SWAP_SIZE_GB="${SWAP_SIZE_GB:-2}"
SWAP_FILE="${SWAP_FILE:-/swapfile}"

ensure_swap() {
  local mem_mb swap_mb
  mem_mb="$(free -m | awk '/^Mem:/ {print $2}')"
  swap_mb="$(free -m | awk '/^Swap:/ {print $2}')"

  echo "==> Memoria detectada: $(free -h | awk '/^Mem:/ {print $2}') RAM, $(free -h | awk '/^Swap:/ {print $2}') swap"

  if [ "${swap_mb:-0}" -gt 0 ]; then
    echo "==> Swap ya disponible."
    return
  fi

  if [ "${mem_mb:-0}" -ge 3072 ]; then
    echo "==> RAM suficiente y sin swap. Continuando sin crear swap."
    return
  fi

  echo "==> Creando swap de ${SWAP_SIZE_GB}G para evitar fallos por memoria durante los builds..."
  if [ ! -f "$SWAP_FILE" ]; then
    sudo fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" || \
      sudo dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024))
  fi

  sudo chmod 600 "$SWAP_FILE"
  sudo mkswap "$SWAP_FILE" >/dev/null
  sudo swapon "$SWAP_FILE"

  if ! sudo grep -qF "$SWAP_FILE none swap sw 0 0" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
  fi

  echo "==> Swap activa: $(free -h | awk '/^Swap:/ {print $2}')"
}

# --------------------------------------------------------------------------
# 1. Dependencias del sistema
# --------------------------------------------------------------------------
echo "==> Instalando dependencias del sistema..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git

# Docker
if ! command -v docker &>/dev/null; then
  echo "==> Instalando Docker..."
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker "${USER:-ubuntu}"
else
  echo "==> Docker ya instalado: $(docker --version)"
fi

# --------------------------------------------------------------------------
# 2. Código fuente
# --------------------------------------------------------------------------
if [ -n "$REPO_URL" ]; then
  if [ -d "$PROJECT_DIR/.git" ]; then
    echo "==> Actualizando repositorio..."
    sudo git -C "$PROJECT_DIR" pull
  else
    echo "==> Clonando repositorio..."
    sudo git clone "$REPO_URL" "$PROJECT_DIR"
  fi
  sudo chown -R "${USER:-ubuntu}:${USER:-ubuntu}" "$PROJECT_DIR"
else
  echo "==> REPO_URL no definida. Asegúrate de que el código esté en $PROJECT_DIR"
  mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# --------------------------------------------------------------------------
# 3. Archivo .env
# --------------------------------------------------------------------------
if [ ! -f ".env" ]; then
  echo "==> Creando .env desde .env.example..."
  cp .env.example .env
  echo ""
  echo "  ⚠️  IMPORTANTE: edita el archivo .env y llena los valores reales:"
  echo "    nano $PROJECT_DIR/.env"
  echo ""
  echo "  Valores mínimos a completar:"
  echo "    DB_PASSWORD, MYSQL_ROOT_PASSWORD, JWT_SECRET"
  echo "    REACT_APP_FIREBASE_* (todos los campos de Firebase)"
  echo "    SENDGRID_API_KEY (si usas notificaciones por correo)"
  echo ""
  echo "  Luego vuelve a ejecutar: bash deploy.sh"
  exit 0
fi

ensure_swap

# --------------------------------------------------------------------------
# 4. Construir y levantar contenedores
# --------------------------------------------------------------------------
echo "==> Construyendo imágenes Docker..."
docker compose build --no-cache api
docker compose build --no-cache web

echo "==> Levantando servicios..."
docker compose up -d

echo "==> Estado de los contenedores:"
docker compose ps

# --------------------------------------------------------------------------
# 5. Health check
# --------------------------------------------------------------------------
echo "==> Esperando que el servicio responda en /healthz..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1/healthz &>/dev/null; then
    echo "    ✅ Servicio OK"
    break
  fi
  echo "    Intento $i/30..."
  sleep 5
done

echo ""
echo "==================================================================="
echo "  ✅ Despliegue completado"
echo "  App corriendo en: http://$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'TU-IP-PUBLICA')"
echo "  Recuerda configurar el ALB y Route53 para HTTPS en caleiro.online"
echo "==================================================================="
