#!/usr/bin/env bash
# =============================================================================
#  deploy.sh  —  Despliegue completo de Coursite en EC2 para caleiro.online
#  Ejecutar como: bash deploy.sh
# =============================================================================
set -euo pipefail

PROJECT_DIR="/opt/coursite"
REPO_URL="${REPO_URL:-}"   # opcional: URL del repo git para clonar

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
