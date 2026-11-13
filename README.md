# ms_gestion_deportiva

Microservicio NestJS del **Módulo Gestión Deportiva** (HU-GD-01 a HU-GD-08). Gestiona deportes y subdeportes, equipos, jugadores y habilidades, además de las relaciones entre ellos: equipo–deporte, contratos jugador–equipo con historial de traspasos y jugador–habilidad. También arma el perfil deportivo de cada jugador.

Sigue la estructura del ejemplo del curso (`backend-ucaldas/ms-cinema`): TypeORM con MySQL, migraciones y un `SecurityGuard` global que delega la autorización en `segurity_ms_Depor`.

## Requisitos

- **Node.js 24.9 o superior.** NestJS 12 se distribuye solo como ESM.
- MySQL 8.
- `segurity_ms_Depor` corriendo, porque valida el JWT y los permisos.

## Cómo ejecutarlo

```bash
cp .env.example .env        # y completar DB_* y MS_SECURITY
npm install
npm run migration:run       # crea las tablas
npm run start:dev           # http://localhost:8282/api
```

Otros comandos:

```bash
npm test                    # pruebas unitarias de las reglas de negocio
npm run lint
npm run migration:generate -- ./src/migrations/NombreDelCambio
```

## Seguridad

Cada petición pasa por `src/common/guards/security.guard.ts`. El guard envía el JWT a `POST {MS_SECURITY}/api/internal/security/permissions-validation` con `{ url, method }` y solo deja pasar la petición si la respuesta es `{ allowed: true }`.

Los permisos se registran en el ms de seguridad (`DatabaseSeeder`) con el formato `/api/sports/{id}`. Los roles `ADMIN` y `ADMIN_DEPORTIVO` los reciben todos. Las rutas públicas se marcan con `@Public()`; por ahora solo `GET /api/health`.

## Estructura

```
src/
  common/            guard, @Public, filtro de errores, pipe de validación, utilidades
  sports/ teams/ players/ skills/            catálogos (HU-GD-01, 02, 04, 06)
  team-sports/ player-contracts/ player-skills/   asociaciones (HU-GD-03, 05, 07)
  player-profiles/   perfil deportivo del jugador (HU-GD-08)
  migrations/
```

Cada recurso tiene `dto/`, `entities/`, `mappers/`, controlador, servicio y módulo:

- **Controladores:** solo reciben la petición y delegan.
- **Servicios:** contienen las reglas de negocio.
- **Mappers:** convierten entidad ↔ DTO; las entidades nunca salen por la API.

## Endpoints (prefijo `/api`)

| Recurso | Rutas |
|---|---|
| Deportes | `GET/POST /sports`, `GET/PATCH/DELETE /sports/:id`, `PATCH /sports/:id/status` |
| Equipos | `GET/POST /teams`, `GET/PATCH/DELETE /teams/:id`, `PATCH /teams/:id/status` |
| Jugadores | `GET/POST /players`, `GET/PATCH/DELETE /players/:id`, `PATCH /players/:id/status` |
| Habilidades | `GET/POST /skills`, `GET/PATCH/DELETE /skills/:id`, `PATCH /skills/:id/status` |
| Equipo–deporte | `POST /team-sports`, `DELETE /team-sports/:teamId/:sportId`, `GET /teams/:id/sports`, `GET /sports/:id/teams` |
| Contratos | `POST /player-contracts`, `PATCH /player-contracts/:id/release`, `GET /teams/:id/players`, `GET /players/:id/contracts` |
| Jugador–habilidad | `POST /player-skills`, `DELETE /player-skills/:playerId/:skillId`, `GET /players/:id/skills`, `GET /skills/:id/players` |
| Perfil | `GET /players/:id/profile` |

### Módulo Gestión de Competencias (HU-GC-01 a HU-GC-08)

| Recurso | Rutas |
|---|---|
| Escenarios | `GET/POST /venues`, `GET/PATCH/DELETE /venues/:id`, `PATCH /venues/:id/status` |
| Torneos (GC-01) | `GET/POST /tournaments`, `GET/PATCH/DELETE /tournaments/:id`, `PATCH /tournaments/:id/status` |
| Inscripciones (GC-02) | `POST /tournament-registrations`, `DELETE /tournament-registrations/:tournamentId/:teamId`, `GET /tournaments/:id/teams`, `GET /teams/:id/tournaments` |
| Fases (GC-03 y GC-05) | `POST /phases`, `GET/PATCH/DELETE /phases/:id`, `GET /tournaments/:id/phases` |
| Grupos (GC-04) | `POST /groups`, `GET/PATCH/DELETE /groups/:id`, `GET /phases/:id/groups`, `POST /group-teams`, `DELETE /group-teams/:groupId/:teamId` |
| Partidos (GC-06) | `POST /matches`, `GET/PATCH/DELETE /matches/:id`, `PATCH /matches/:id/result`, `PATCH /matches/:id/cancel`, `GET /phases/:id/matches` |
| Anotaciones (GC-07) | `POST /match-annotations`, `PATCH/DELETE /match-annotations/:id`, `GET /matches/:id/annotations` |
| Desarrollo (GC-08) | `GET /tournaments/:id/overview` |

Reglas principales de competencias:

- **Inscripciones:** el equipo debe practicar el deporte del torneo. Solo se inscribe o retira hasta el cierre de inscripciones y antes del inicio.
- **Fases:** de grupos (`GROUP_STAGE`) o finales (`KNOCKOUT`), con un orden único dentro del torneo.
- **Grupos:** solo admiten equipos inscritos, y un equipo no puede estar en dos grupos de la misma fase.
- **Partidos:**
  - Local y visitante deben ser distintos y estar inscritos, y la fecha debe caer dentro del torneo.
  - En fase de grupos, ambos equipos deben ser del mismo grupo. En fase final, cada partido ocupa una posición única en la llave y no puede terminar empatado.
- **Anotaciones:** el jugador debe tener contrato con uno de los dos equipos en la fecha del partido.
- **Tabla de posiciones:** 3 puntos por victoria y 1 por empate. Desempata la diferencia de gol, luego los goles a favor.
- **Notificaciones** (partido nuevo, anotación y resultado): pasan por `NotificationsService`. Por ahora solo se registran en el log, porque los destinatarios llegarán con boletos y apuestas (HU-GC-11).

## Reglas principales

- **Unicidad:** los nombres de deportes, equipos y habilidades no se repiten, sin importar mayúsculas. El documento del jugador también es único.
- **Activar o desactivar:** siempre se puede.
- **Eliminar:** solo si el registro no tiene información asociada; si la tiene, responde 409 y sugiere desactivarlo.
- **Subdeportes:** solo se permite un nivel.
- **Contratos:**
  - Un jugador tiene un solo contrato vigente.
  - Retirarlo guarda `releasedAt` y conserva el contrato como historial de traspasos.
- **Asociaciones:** exigen que los dos registros existan y estén activos, y no permiten duplicados.
- **Errores:** todos usan el mismo formato que el ms de seguridad: `{ timestamp, status, error, message, details? }`.
