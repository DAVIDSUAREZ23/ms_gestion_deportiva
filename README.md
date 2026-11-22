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
| Partidos (GC-06) | `POST /matches`, `GET /matches`, `GET/PATCH/DELETE /matches/:id`, `PATCH /matches/:id/result`, `PATCH /matches/:id/cancel`, `GET /phases/:id/matches` |
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
- **Notificaciones** (partido nuevo, anotación y resultado): pasan por `NotificationsService`, que decide a quién avisar y le pide el envío al ms de notificaciones (`POST {MS_NOTIFICATIONS}/send-match-notification`, con la cabecera `X-Internal-Key`). El envío no espera respuesta y un fallo solo se registra en el log; nunca rompe la operación.
  - **Partido nuevo (GC-06):** aficionados activos con boleto vigente en partidos ya finalizados y anteriores donde jugó alguno de los dos equipos.
  - **Anotación y resultado (GC-07):** aficionados activos con boleto vigente o apuesta pagada para el partido.
  - Variables: `MS_NOTIFICATIONS` y `NOTIFICATIONS_INTERNAL_KEY` (la misma de ms-notificaciones).

### Apuestas y monedero (HU-GC-11)

| Recurso | Rutas |
|---|---|
| Métodos de pago | `GET/POST /payment-methods`, `GET/PATCH /payment-methods/:id`, `PATCH /payment-methods/:id/status` |
| Pasarelas | `GET/POST /payment-gateways`, `GET/PATCH /payment-gateways/:id`, `PATCH /payment-gateways/:id/status` |
| Monedero del aficionado | `POST/GET /fans/me/wallet`, `GET /fans/me/wallet/movements`, `POST /fans/me/wallet/recharges` |
| Monedero (administración) | `GET /fans/:fanId/wallet`, `POST /wallets/:id/adjustments`, `PATCH /wallets/:id/status`, `DELETE /wallets/:id` |
| Cuotas | `GET/POST/PUT /matches/:matchId/odds`, `PATCH /odds/:id` |
| Apuestas | `GET /bets/upcoming-matches`, `POST/GET /fans/me/bets`, `GET /fans/me/bets/:id`, `POST /fans/me/bets/:id/pay`, `GET /matches/:matchId/bets` |

Reglas principales del monedero:

- **Un monedero por aficionado:** se crea junto con el perfil; también se puede crear con `POST /fans/me/wallet`. La migración lo crea para los aficionados existentes.
- **Recargas:** entre 1.000 y 5.000.000 COP por operación. Se cobran con la pasarela simulada y el saldo solo se acredita si el pago se aprueba.
- **Ajustes:** solo el administrador, con motivo obligatorio y registrado en el historial. Un ajuste no puede dejar el saldo negativo.
- **Historial:** cada cambio de saldo genera un movimiento (`RECHARGE`, `BET_DEBIT`, `BET_WIN`, `BET_WIN_REVERSAL`, `BET_REFUND`, `ADJUSTMENT`). El monto es positivo si entra dinero y negativo si sale; `balanceAfter` guarda el saldo resultante.
- **Eliminar:** solo si el saldo es 0 y no tiene movimientos; si no, se desactiva. Un monedero inactivo no permite recargar, ajustar ni apostar.
- **Saldo negativo:** solo puede aparecer al revertir una ganancia ya gastada. `availableBalance` se muestra en 0 y no se puede apostar hasta recargar.

Reglas principales de apuestas:

- **Una apuesta viva por partido:** un aficionado no puede tener dos apuestas `PENDING_PAYMENT` o `ACTIVE` para el mismo partido. Si la anterior quedó `PAYMENT_FAILED` o `VOID`, puede apostar de nuevo.
- **Partido abierto:** solo se apuesta a partidos `SCHEDULED` con fecha futura.
- **Cuotas:** las define el administrador y solo se editan mientras el partido está programado. La cuota se congela al apostar; las apuestas existentes no cambian si luego se edita.
  - Se pueden enviar al crear el partido con el campo `odds` de `POST /matches`.
  - `PUT /matches/:matchId/odds` guarda el set completo: crea o actualiza las selecciones enviadas y desactiva las que no vengan.
  - `GET /matches` permite filtrar por `status`, `tournamentId` y `phaseId`, e incluye las cuotas de cada partido.
- **Monto:** entre 1.000 y 1.000.000 COP. La ganancia potencial (`amount * odds`) la calcula el servidor.
- **Pago:** se debita del monedero en la misma transacción que crea la apuesta. Si no hay saldo suficiente, responde 400 y la apuesta no se crea. Se registra con el método `WALLET` y la pasarela `NONE`.
- **Estados:** `ACTIVE` → `WON`/`LOST`; `VOID` cuando se cancela el partido. `PENDING_PAYMENT` y `PAYMENT_FAILED` solo existen en apuestas anteriores al monedero; el reintento de pago ahora cobra del monedero.
- **Liquidación:** al registrar o corregir el resultado, `MatchesService` llama a `BetsService.settleMatch`. Ganar acredita `potentialPayout`; corregir `WON` a `LOST` revierte la ganancia; `LOST` a `WON` la acredita; `WON` a `WON` no repite el abono.
- **Anulación:** al cancelar el partido, las apuestas `ACTIVE` pagadas con `WALLET` devuelven el monto al monedero.
- **Concurrencia:** el débito bloquea la fila del aficionado y la del monedero (`SELECT ... FOR UPDATE`), así dos apuestas simultáneas no pueden gastar el mismo saldo.
- **Notificaciones:** los avisos de anotación y resultado incluyen también a los apostadores con pago aprobado.

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

## Eventos en tiempo real (Socket.IO)

El microservicio expone un canal Socket.IO en el mismo puerto (8282), sin prefijo `/api`. Al crear o cancelar un partido, registrar su resultado o una anotación, `LiveEventsGateway` emite `new_notification` con `{ type, message, tournamentId, matchId }` a todos los clientes conectados. Los datos son públicos (marcadores y anotaciones). El `SecurityGuard` solo protege HTTP y deja pasar los eventos del gateway.

Cliente de prueba (Node): `io('http://localhost:8282', { transports: ['websocket'] }).on('new_notification', console.log)`.

## Reportes SQL

Las consultas de reporte viven en `repositories/` de cada módulo (`MatchAnnotationsRepository`, `TicketsRepository`) y usan `DataSource.query`; el CRUD sigue con `Repository<T>`. Reporte nuevo: `GET /api/tournaments/:id/top-scorers?limit=10`.
