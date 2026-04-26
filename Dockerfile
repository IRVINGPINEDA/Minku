FROM node:18-bullseye AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY public ./public
COPY src ./src
COPY config-overrides.js ./

ARG WEB_BUILD_MAX_OLD_SPACE_SIZE=1024
ARG WEB_BUILD_GENERATE_SOURCEMAP=false
ARG REACT_APP_API_URL=/api
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID

ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_FIREBASE_API_KEY=${REACT_APP_FIREBASE_API_KEY}
ENV REACT_APP_FIREBASE_AUTH_DOMAIN=${REACT_APP_FIREBASE_AUTH_DOMAIN}
ENV REACT_APP_FIREBASE_PROJECT_ID=${REACT_APP_FIREBASE_PROJECT_ID}
ENV REACT_APP_FIREBASE_STORAGE_BUCKET=${REACT_APP_FIREBASE_STORAGE_BUCKET}
ENV REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${REACT_APP_FIREBASE_MESSAGING_SENDER_ID}
ENV REACT_APP_FIREBASE_APP_ID=${REACT_APP_FIREBASE_APP_ID}
ENV NODE_OPTIONS=--max_old_space_size=${WEB_BUILD_MAX_OLD_SPACE_SIZE}
ENV GENERATE_SOURCEMAP=${WEB_BUILD_GENERATE_SOURCEMAP}

RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache certbot openssl dcron

ENV API_UPSTREAM=http://api:8080
ENV SERVER_NAME=caleiro.online
ENV CERTBOT_EMAIL=admin@caleiro.online

COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/nginx/http-only.conf /etc/nginx/http-only.conf
COPY docker/nginx/entrypoint.sh /entrypoint.sh
COPY --from=build /app/build /usr/share/nginx/html

RUN chmod +x /entrypoint.sh && mkdir -p /var/www/certbot

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --retries=5 --start-period=60s \
    CMD wget -q -O - http://127.0.0.1/healthz || exit 1

ENTRYPOINT ["/entrypoint.sh"]
