#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y ca-certificates curl docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker

if id ubuntu >/dev/null 2>&1; then
  sudo usermod -aG docker ubuntu
fi

echo "Docker y Docker Compose quedaron instalados. Cierra y vuelve a abrir sesión antes de usar docker sin sudo."
