#!/bin/sh
set -e

DOMAIN="${SERVER_NAME:-caleiro.online}"
EMAIL="${CERTBOT_EMAIL:-admin@caleiro.online}"
CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

if [ ! -f "$CERT" ]; then
    echo "==> Certificado SSL no encontrado. Obteniendo de Let's Encrypt para ${DOMAIN}..."

    # Arrancar Nginx con config HTTP-only para el challenge
    cp /etc/nginx/http-only.conf /etc/nginx/conf.d/default.conf
    nginx &
    NGINX_PID=$!
    sleep 2

    certbot certonly --webroot \
        -w /var/www/certbot \
        -d "${DOMAIN}" \
        -d "www.${DOMAIN}" \
        --email "${EMAIL}" \
        --agree-tos \
        --non-interactive \
        --quiet

    kill $NGINX_PID
    wait $NGINX_PID 2>/dev/null || true
    echo "==> Certificado obtenido. Iniciando con HTTPS..."
else
    echo "==> Certificado SSL encontrado. Iniciando con HTTPS..."
fi

# Generar config final con HTTPS
envsubst '${SERVER_NAME} ${API_UPSTREAM}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

# Renovación automática cada 12h
echo "0 */12 * * * certbot renew --quiet && nginx -s reload" | crontab -
crond

exec nginx -g 'daemon off;'
