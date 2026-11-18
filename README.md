# Tizón Rojo Arcade — Demo visual jugable V1

Videojuego arcade de laberinto para el restaurante Tizón Rojo: sobrevive **180 segundos** con **una sola vida**.
100% frontend (Phaser 3 + TypeScript + Vite), sin backend, sin datos personales. Todo el arte y el audio se generan
proceduralmente (Canvas + Web Audio): no hay recursos externos en tiempo de ejecución.

## Ejecutar
```bash
npm install
npm run dev        # desarrollo (modo de pruebas disponible)
npm test           # pruebas unitarias (vitest)
npm run build      # compilación de producción en dist/
npm run preview    # servir dist/
```

## Controles
Móvil: deslizar / joystick virtual. Teclado: flechas o WASD, `P`/`Esc` pausa.

## Modo de pruebas (solo `npm run dev`)
Parámetros de URL: `?speed=10` (cronómetro x10), `?t=145` (empezar en el segundo 145), `?god=1` (invulnerable).
En producción este modo no existe y **nunca** genera premios. El descuento de la pantalla de victoria es solo visual.
Prueba de integración: `NODE_PATH=$(npm root -g) node scripts/e2e-smoke.cjs` (requiere `npm run dev` y Playwright).

## Configuración
- `src/config/difficulty.ts`: las 4 fases (velocidades, IA, duración de galleta, reaparición).
- `src/config/game.ts`: tiempos, puntajes, velocidad del jugador.
- `src/game/maze/layout.ts`: laberinto.

## GitHub Pages
`vite.config.ts` usa base `/TizonRojo/`. El workflow `.github/workflows/pages.yml` es manual (`workflow_dispatch`)
y requiere habilitar Pages con fuente "GitHub Actions".
