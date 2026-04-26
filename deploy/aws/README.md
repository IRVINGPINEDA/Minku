# Despliegue en AWS - `caleiro.online`

## Arquitectura

```text
Internet
   |
   v
Route 53  (caleiro.online -> ALB DNS)
   |
   v
Application Load Balancer  (443 HTTPS + 80 -> redirect a HTTPS)
   |  TLS terminado con certificado ACM
   v
EC2 Ubuntu 22.04  (solo puerto 80 desde el ALB)
   |
   |-- web  (Nginx + React)  :80
   |-- api  (Spring Boot)    :8080 interno
   `-- db   (MySQL 8)        :3306 interno
```

---

## Paso 1 - Crear la instancia EC2

1. Abre AWS -> `EC2 -> Launch Instance`.
2. Nombre: `coursite-prod`.
3. AMI: `Ubuntu Server 22.04 LTS (64-bit x86)`.
4. Tipo:
   `t3.medium` es lo recomendado.
   `t3.small` solo es razonable si dejas swap habilitado durante el build.
5. Key pair: crea o elige una existente para acceso SSH.
6. Security Group `sg-coursite-ec2`:
   - Inbound TCP 80 solo desde el Security Group del ALB.
   - Inbound TCP 22 solo desde tu IP.
   - Outbound todo.
7. Storage: `20 GB gp3`.
8. Lanza la instancia y anota su IP privada.

---

## Paso 2 - Elastic IP

1. Ve a `EC2 -> Elastic IPs -> Allocate`.
2. Asocia la IP a `coursite-prod`.
3. Anota la IP publica.

---

## Paso 3 - Certificado TLS con ACM

1. Abre `ACM -> Request certificate`.
2. Tipo: `Public certificate`.
3. Domains:
   - `caleiro.online`
   - `www.caleiro.online`
4. Validacion: `DNS validation`.
5. Agrega los CNAMEs que te entregue ACM en tu DNS.
6. Espera a que el estado sea `Issued`.

---

## Paso 4 - Application Load Balancer

1. Ve a `EC2 -> Load Balancers -> Create -> Application Load Balancer`.
2. Nombre: `alb-coursite`.
3. Scheme: `Internet-facing`.
4. IP type: `IPv4`.
5. VPC: la misma que la instancia EC2.
6. Subnets: al menos 2 en distintas AZs.
7. Security Group `sg-coursite-alb`:
   - Inbound TCP 80 desde `0.0.0.0/0` y `::/0`.
   - Inbound TCP 443 desde `0.0.0.0/0` y `::/0`.
   - Outbound todo.

### Target Group

- Nombre: `tg-coursite`
- Target type: `Instances`
- Protocol: `HTTP`
- Port: `80`
- Health check path: `/healthz`
- Healthy threshold: `2`
- Interval: `30s`

Registra la instancia EC2 dentro del target group.

### Listeners

- HTTP `:80` -> Redirect a HTTPS `:443` con codigo `301`.
- HTTPS `:443` -> Forward a `tg-coursite` usando el certificado de ACM.

---

## Paso 5 - DNS en Route 53

1. Abre `Route 53 -> Hosted zones`.
2. Si `caleiro.online` no tiene hosted zone, creala.
3. Agrega un registro `A - Alias` para `caleiro.online` apuntando al ALB.
4. Agrega otro `A - Alias` para `www.caleiro.online` al mismo ALB.
5. Si el dominio esta fuera de AWS, cambia los nameservers en tu registrador.

---

## Paso 6 - Preparar el servidor EC2

Conectate por SSH:

```bash
ssh -i tu-key.pem ubuntu@TU-ELASTIC-IP
```

Sube el codigo al servidor:

```bash
# Opcion A: clonar el repo
git clone https://github.com/TU-USUARIO/coursite.git /opt/coursite
cd /opt/coursite
bash deploy/aws/ec2-bootstrap.sh

# Opcion B: copiar desde tu PC
scp -i tu-key.pem -r /ruta/a/coursite-main ubuntu@TU-ELASTIC-IP:/opt/coursite
```

Si usaste `scp`, entra por SSH y ejecuta:

```bash
cd /opt/coursite
bash deploy/aws/ec2-bootstrap.sh
```

Ese script instala Docker, Docker Compose y crea swap automaticamente si la instancia tiene poca RAM y aun no tiene swap.

---

## Paso 7 - Configurar variables de entorno

```bash
cd /opt/coursite
cp .env.example .env
nano .env
```

Valores obligatorios:

```env
SERVER_NAME=caleiro.online
APP_URL=https://caleiro.online
APP_CORS_ALLOWED_ORIGINS=https://caleiro.online,https://www.caleiro.online

DB_PASSWORD=TU_PASSWORD_SEGURA
MYSQL_ROOT_PASSWORD=TU_ROOT_PASSWORD_SEGURA
JWT_SECRET=TU_JWT_SECRET_MUY_LARGO_Y_ALEATORIO

REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...

SENDGRID_API_KEY=TU_SENDGRID_KEY
SENDGRID_EMAIL=no-reply@caleiro.online

ADMIN_EMAIL=irvingpineda684@gmail.com
ADMIN_PASSWORD=admin123!
ADMIN_NAME=Irving
ADMIN_LASTNAME=Pineda
```

Valores de build que ya vienen afinados para EC2 chicas:

```env
API_BUILD_MAX_HEAP_MB=384
WEB_BUILD_MAX_OLD_SPACE_SIZE=1024
WEB_BUILD_GENERATE_SOURCEMAP=false
```

---

## Paso 8 - Ejecutar el despliegue

```bash
cd /opt/coursite
bash deploy/aws/deploy.sh
```

El script:

1. Instala Docker si aun no existe.
2. Verifica RAM y crea swap si la instancia no tiene suficiente memoria.
3. Construye las imagenes en serie: `api` y luego `web`.
4. Levanta los contenedores con `docker compose up -d`.
5. Verifica que `/healthz` responda.

---

## Paso 9 - Verificar HTTPS

```bash
curl -I https://caleiro.online/healthz
curl -I http://caleiro.online
```

Resultados esperados:

- `https://caleiro.online/healthz` -> `HTTP/2 200`
- `http://caleiro.online` -> `301` hacia `https://caleiro.online/`

---

## Comandos utiles

```bash
docker compose logs -f
docker compose logs -f api
docker compose restart api

git pull
docker compose build --no-cache api
docker compose build --no-cache web
docker compose up -d

docker compose ps
docker compose exec db mysql -ucoursite -p coursite
```

---

## Seguridad minima recomendada

| Recurso | Regla |
|---|---|
| ALB Security Group | Inbound 80 y 443 desde `0.0.0.0/0` |
| EC2 Security Group | Inbound 80 solo desde el SG del ALB |
| EC2 Security Group | Inbound 22 solo desde tu IP |
| EC2 | Nunca expongas 3306 ni 8080 a internet |
| `.env` | No subir a git |

---

## Persistencia de datos

El volumen `mysql-data` persiste en el EBS de la instancia.

Si luego migras la base de datos a RDS:

1. Crea una instancia RDS MySQL 8.
2. Exporta:
   `docker compose exec db mysqldump -ucoursite -p coursite > backup.sql`
3. Importa en RDS:
   `mysql -h RDS_ENDPOINT -ucoursite -p coursite < backup.sql`
4. Actualiza `.env` con `DB_HOST=TU_RDS_ENDPOINT` y elimina el servicio `db` del `docker-compose.yml`.

---

## Renovacion de TLS

Los certificados de ACM se renuevan automaticamente.
