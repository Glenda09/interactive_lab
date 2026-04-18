# Entrega De UI De Aprendizaje

## Usa esta skill cuando

- construyas dashboards, vistas de cursos, pantallas de progreso o flujos de evaluacion,
- agregues formularios y tablas para operaciones academicas o administrativas,
- definas UX para aprendices, instructores o supervisores.

## Resultado

Entregar una seccion frontend consistente, consciente de roles, testeable y alineada con el dominio de capacitacion.

## Flujo de trabajo

1. Identificar el actor:
   - aprendiz
   - instructor
   - supervisor
   - administrador
2. Identificar la decision principal que la pantalla ayuda a tomar al actor.
3. Definir el contrato de datos necesario desde la API.
4. Disenar los estados de exito, carga, vacio, error y permiso denegado.
5. Implementar queries, mutaciones, formularios y feedback de UI con acoplamiento minimo.

## Reglas

- Haz explicita la visibilidad por rol en la capa de UI, pero nunca la trates como frontera de seguridad.
- Prefiere indicadores de progreso claros sobre complejidad decorativa.
- Mantener tablas, filtros y formularios reutilizables entre modulos cuando tenga sentido.
- Evita ocultar datos operativamente importantes detras de demasiadas interacciones.
- Favorece etiquetas explicitas y redaccion apta para auditoria en acciones como publicar, aprobar, reasignar o sobrescribir.

## Checklist de revision

- La pantalla soporta la tarea principal del actor con friccion minima?
- Son claros los errores de validacion y a nivel de campo?
- Las acciones destructivas o sensibles requieren confirmacion?
- El modelo de estado es lo suficientemente simple para mantenerse?
- El contrato del backend puede evolucionar sin romper todos los componentes?
