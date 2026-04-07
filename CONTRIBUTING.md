# Guía de Contribución

¡Gracias por tu interés en contribuir a **Interactive Lab**! 🎉

## Prerrequisitos

- Node.js ≥ 18
- Docker ≥ 24
- Git

## Configuración del entorno local

```bash
# 1. Clona el repositorio
git clone https://github.com/Glenda09/interactive_lab.git
cd interactive_lab

# 2. Instala dependencias del backend
cd backend && cp .env.example .env && npm install && cd ..

# 3. Instala dependencias del frontend
cd frontend && cp .env.example .env && npm install && cd ..

# 4. Levanta MongoDB con Docker
docker compose up mongo -d

# 5. Inicia el backend (terminal 1)
cd backend && npm run dev

# 6. Inicia el frontend (terminal 2)
cd frontend && npm start
```

## Convenciones

### Branches
- `main` — código en producción, solo merge mediante PR
- `develop` — rama de integración
- `feat/<nombre>` — nueva funcionalidad
- `fix/<nombre>` — corrección de bug
- `docs/<nombre>` — cambios de documentación

### Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add 3D scene editor
fix: correct JWT expiry validation
docs: update API reference for results endpoint
chore: upgrade babel to 7.24
```

### Código
- **Frontend**: componentes en PascalCase (`SimulationCard.jsx`), hooks en camelCase con prefijo `use` (`useSimulations.js`), archivos de servicios en camelCase (`authService.js`).
- **Backend**: controladores en camelCase con sufijo `.controller.js`, rutas con sufijo `.routes.js`, modelos en PascalCase.

## Pull Requests

1. Crea tu branch desde `develop`.
2. Escribe tests para los cambios que introduzcas.
3. Asegúrate de que `npm run lint` pase sin errores.
4. Abre el PR con una descripción clara de qué cambia y por qué.
5. Un revisor aprobará antes de hacer merge.

## Reporte de bugs

Abre un issue con la etiqueta `bug` e incluye:
- Pasos para reproducir el problema
- Comportamiento esperado vs. actual
- Entorno (OS, versión de Node, navegador)
