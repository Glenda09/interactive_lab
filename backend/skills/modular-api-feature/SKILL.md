# Feature API Modular

## Usa esta skill cuando

- agregues un nuevo modulo backend,
- implementes un recurso REST,
- extiendas un servicio de dominio,
- disenes un feature que toque persistencia, validacion y chequeos de politicas.

## Resultado

Entregar un feature backend que encaje en un monolito modular y mantenga propiedad clara de reglas, datos y comportamiento de API.

## Flujo de trabajo

1. Definir el modulo propietario.
2. Escribir los casos de uso que el modulo debe soportar.
3. Identificar DTOs de entrada, DTOs de salida, servicios de dominio, repositorios y chequeos de politicas.
4. Definir eventos de auditoria y casos de error antes de escribir codigo de endpoints.
5. Agregar pruebas para reglas de dominio y rutas de integracion.

## Reglas

- Mantener los controllers delgados.
- Colocar la validacion cerca del punto de entrada.
- Colocar las reglas de negocio en servicios u objetos de politica, no en controllers.
- Ocultar detalles de persistencia detras de repositorios o adaptadores de acceso.
- Emitir eventos de auditoria para acciones sensibles de seguridad o criticas para el negocio.

## Checklist de revision

- La propiedad del modulo es clara?
- Los DTOs y los modelos de dominio estan separados?
- Los chequeos de permisos son explicitos?
- El manejo de errores es consistente?
- Se consideran indices y costos de consulta para los nuevos endpoints?
