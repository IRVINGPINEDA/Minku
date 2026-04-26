# Despliegue en AWS — `caleiro.online`

## Arquitectura

```
Internet
   │
   ▼
Route 53  (caleiro.online  →  ALB DNS)
   │
   ▼
Application Load Balancer  (Puerto 443 HTTPS + 80 → redirect a HTTPS)
   │  TLS terminado con certificado ACM
   ▼
EC2 Ubuntu 22.04  (Security Group: sólo puerto 80 desde el ALB)
   │
   ├── web  (Nginx + React)  :80
   ├── api  (Spring Boot)    :8080 (interno)
   └── db   (MySQL 8)        :3306 (interno)
```

---

## Paso 1 — Crear la instancia EC2

1. Abre la consola de AWS → **EC2 → Launch Instance**.
2. Nombre: `coursite-prod`
3. AMI: **Ubuntu Server 22.04 LTS (64-bit x86)**
4. Tipo: `t3.small` (mínimo recomendado para el stack completo)
5. Key pair: crea o elige una existente para acceso SSH.
6. Security Group — crea uno llamado `sg-coursite-ec2`:
   - **Inbound**: TCP 80 desde el Security Group del ALB (no desde 0.0.0.0/0)
   - **Inbound**: TCP 22 desde tu IP (para administración)
   - **Outbound**: todo
7. Storage: 20 GB gp3 (suficiente para Docker + base de datos inicial).
8. Lanza la instancia y toma nota de la **IP privada**.

---

## Paso 2 — Elastic IP

1. EC2 → **Elastic IPs → Allocate**.
2. **Associate** la IP a la instancia `coursite-prod`.
3. Toma nota de la IP pública asignada.

---

## Paso 3 — Certificado TLS con ACM

1. Abre **ACM (Certificate Manager)** → **Request certificate**.
2. Tipo: **Public certificate**.
3. Domain names:
   - `caleiro.online`
   - `www.caleiro.online`
4. Validación: **DNS validation** (recomendado).
5. ACM te dará registros CNAME para agregar en tu DNS.
6. Agrega los CNAMEs en Route 53 (o en tu proveedor DNS).
7. Espera hasta que el estado sea **Issued** (puede tardar 5-10 min).

---

## Paso 4 — Application Load Balancer

1. EC2 → **Load Balancers → Create → Application Load Balancer**.
2. Nombre: `alb-coursite`
3. Scheme: **Internet-facing**
4. IP type: IPv4
5. VPC: la misma que tu EC2
6. Subnets: selecciona **al menos 2 subnets en distintas AZs**
7. Security Group — crea uno llamado `sg-coursite-alb`:
   - **Inbound**: TCP 80 desde `0.0.0.0/0, ::/0`
   - **Inbound**: TCP 443 desde `0.0.0.0/0, ::/0`
   - **Outbound**: todo

### Listeners y Target Groups

**Target Group** (para el listener HTTPS):
- Nombre: `tg-coursite`
- Target type: **Instances**
- Protocol: HTTP, Puerto: **80**
- Health check path: `/healthz`
- Healthy threshold: 2, Interval: 30s
- Registra la instancia EC2 en el target group.

**Listener HTTP (puerto 80)**:
- Acción: **Redirect** → HTTPS, puerto 443, código 301.

**Listener HTTPS (puerto 443)**:
- Certificado: selecciona el de ACM (`caleiro.online`).
- Acción: **Forward** al target group `tg-coursite`.

---

## Paso 5 — DNS en Route 53

1. Abre **Route 53 → Hosted zones**.
2. Si `caleiro.online` no tiene hosted zone, crea una (**Create hosted zone**).
3. Agrega un registro **A — Alias**:
   - Name: `caleiro.online`
   - Type: A
   - Alias: sí
   - Alias target: **Application Load Balancer** → selecciona `alb-coursite`
4. Agrega otro registro **A — Alias** para `www.caleiro.online` apuntando al mismo ALB.
5. Si tu dominio está registrado fuera de AWS, actualiza los nameservers de `caleiro.online`
   en tu registrador para usar los nameservers de Route 53 que aparecen en la hosted zone.

---

## Paso 6 — Preparar el servidor EC2

Conéctate a la instancia por SSH:

```bash
ssh -i tu-key.pem ubuntu@TU-ELASTIC-IP
```

Sube el código al servidor (opción A: git clone, opción B: scp):

```bash
# Opción A — desde un repo
git clone https://github.com/TU-USUARIO/coursite.git /opt/coursite
cd /opt/coursite

# Opción B — copiar desde tu máquina local (ejecuta esto en tu PC)
scp -i tu-key.pem -r /ruta/a/coursite-main ubuntu@TU-ELASTIC-IP:/opt/coursite
```

---

## Paso 7 — Configurar variables de entorno

```bash
cd /opt/coursite
cp .env.example .env
nano .env
```

Valores **obligatorios** que debes completar:

```env
# Dominio
SERVER_NAME=caleiro.online
APP_URL=https://caleiro.online
APP_CORS_ALLOWED_ORIGINS=https://caleiro.online,https://www.caleiro.online

# Base de datos (elige contraseñas seguras)
DB_PASSWORD=TU_PASSWORD_SEGURA
MYSQL_ROOT_PASSWORD=TU_ROOT_PASSWORD_SEGURA

# JWT (genera una cadena aleatoria de 64+ caracteres)
JWT_SECRET=TU_JWT_SECRET_MUY_LARGO_Y_ALEATORIO

# Firebase (obtén estos valores en Firebase Console → Project settings)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...

# SendGrid (opcional, para notificaciones por correo)
SENDGRID_API_KEY=TU_SENDGRID_KEY
SENDGRID_EMAIL=no-reply@caleiro.online

# Cuenta de administrador (se crea automáticamente al primer arranque)
ADMIN_EMAIL=irvingpineda684@gmail.com
ADMIN_PASSWORD=admin123!
ADMIN_NAME=Irving
ADMIN_LASTNAME=Pineda
```

---

## Paso 8 — Ejecutar el despliegue

```bash
cd /opt/coursite
bash deploy/aws/deploy.sh
```

El script:
1. Instala Docker si no está instalado.
2. Construye las imágenes (`web`, `api`, `db`).
3. Levanta los contenedores con `docker compose up -d`.
4. Verifica que `/healthz` responda correctamente.

---

## Paso 9 — Verificar HTTPS

```bash
# Desde tu máquina local
curl -I https://caleiro.online/healthz
# Debe devolver: HTTP/2 200

curl -I http://caleiro.online
# Debe devolver: HTTP/1.1 301 Moved Permanently con Location: https://caleiro.online/
```

---

## Comandos útiles en producción

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver sólo logs del backend
docker compose logs -f api

# Reiniciar un servicio
docker compose restart api

# Actualizar la app (tras un git pull)
git pull
docker compose build --no-cache api
docker compose build --no-cache web
docker compose up -d

# Ver estado de los contenedores
docker compose ps

# Conectarse a la base de datos
docker compose exec db mysql -ucoursite -p coursite
```

---

## Seguridad mínima recomendada

| Recurso | Regla |
|---|---|
| ALB Security Group | Inbound 80 y 443 desde `0.0.0.0/0` |
| EC2 Security Group | Inbound 80 **sólo** desde el SG del ALB |
| EC2 Security Group | Inbound 22 **sólo** desde tu IP |
| EC2 | Puerto 3306 y 8080 **nunca** expuestos a internet |
| .env | **No** incluir en git (ya está en `.gitignore`) |

---

## Persistencia de datos

El volumen `mysql-data` persiste en el disco EBS de la instancia.

Para migrar la DB a **Amazon RDS** en el futuro:
1. Crea una instancia RDS MySQL 8.
2. Exporta: `docker compose exec db mysqldump -ucoursite -p coursite > backup.sql`
3. Importa en RDS: `mysql -h RDS_ENDPOINT -ucoursite -p coursite < backup.sql`
4. Actualiza `.env` con `DB_HOST=TU_RDS_ENDPOINT` y elimina el servicio `db` del `docker-compose.yml`.

---

## Renovación automática de TLS

Los certificados de ACM se renuevan automáticamente. No se requiere ninguna acción manual.
