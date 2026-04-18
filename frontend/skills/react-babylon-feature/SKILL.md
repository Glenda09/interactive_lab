# Feature React Babylon

## Usa esta skill cuando

- implementes o refactorices features frontend orientadas a simulacion,
- integres escenas de Babylon.js con flujos de React,
- conectes eventos de simulacion con APIs backend,
- optimices el ciclo de vida de la escena o la carga de assets.

## Resultado

Entregar un feature frontend que mantenga claramente separadas las preocupaciones de renderizado, UI y reporte de eventos de dominio.

## Flujo de trabajo

1. Identificar el flujo de usuario que posee el punto de entrada a la simulacion.
2. Separar responsabilidades del shell de aplicacion y del runtime de Babylon.
3. Definir el contrato minimo entre la capa de escena y la capa de React:
   - parametros de arranque de la escena
   - eventos emitidos
   - payload de finalizacion
   - condiciones de error
4. Revisar la carga de assets, limpieza, reintentos y comportamiento ante fallos offline.
5. Asegurar que los payloads hacia backend se mapeen mediante un adaptador tipado en lugar de enviarlos ad hoc.

## Reglas

- No colocar logica de calificacion o autorizacion dentro del codigo de escena de Babylon.
- No permitir que componentes de pagina gestionen objetos de escena de bajo nivel directamente, salvo que el codigo sea muy pequeno y bien acotado.
- Emitir eventos estructurados como `checkpoint.completed`, `interaction.failed` o `simulation.finished`.
- Limpiar recursos del engine en unmount o al cambiar de escena.
- Preferir carga progresiva y feedback visible al usuario para assets pesados.

## Checklist de revision

- El ciclo de vida de la escena es explicito?
- La logica de negocio esta fuera de la capa de renderizado?
- Los payloads de API son tipados y reutilizables?
- Los errores y reintentos son visibles para el usuario?
- Existe una via para testear la logica sin renderizar la escena completa?
