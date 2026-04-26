#!/usr/bin/env bash
set -euo pipefail

SWAP_SIZE_GB="${SWAP_SIZE_GB:-2}"
SWAP_FILE="${SWAP_FILE:-/swapfile}"

ensure_swap() {
  local mem_mb swap_mb
  mem_mb="$(free -m | awk '/^Mem:/ {print $2}')"
  swap_mb="$(free -m | awk '/^Swap:/ {print $2}')"

  if [ "${swap_mb:-0}" -gt 0 ]; then
    echo "Swap ya configurado: $(free -h | awk '/^Swap:/ {print $2}')"
    return
  fi

  if [ "${mem_mb:-0}" -ge 3072 ]; then
    echo "RAM detectada: ${mem_mb} MB. No se crea swap automaticamente."
    return
  fi

  echo "Creando swap de ${SWAP_SIZE_GB}G para hosts con poca RAM..."
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

  echo "Swap activa: $(free -h | awk '/^Swap:/ {print $2}')"
}

sudo apt-get update
sudo apt-get install -y ca-certificates curl docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker

ensure_swap

if id ubuntu >/dev/null 2>&1; then
  sudo usermod -aG docker ubuntu
fi

echo "Docker, Docker Compose y la configuracion basica de memoria quedaron listos. Cierra y vuelve a abrir sesion antes de usar docker sin sudo."
