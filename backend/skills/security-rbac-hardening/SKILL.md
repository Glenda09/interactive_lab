# Endurecimiento De Seguridad RBAC

## Usa esta skill cuando

- implementes flujos de autenticacion o sesion,
- agregues o cambies endpoints protegidos,
- modifiques comportamiento de roles o permisos,
- revises exposicion de datos, auditoria o proteccion contra abuso.

## Resultado

Entregar un cambio backend que fortalezca autenticacion, autorizacion, auditabilidad y resistencia al abuso.

## Flujo de trabajo

1. Identificar el recurso protegido y la accion.
2. Definir que roles, permisos y reglas de propiedad aplican.
3. Validar la superficie de la solicitud:
   - headers
   - params
   - query
   - body
4. Definir limites de tasa y casos de mal uso.
5. Agregar o actualizar eventos de auditoria y manejo seguro de errores.

## Reglas

- Nunca confiar en pistas de rol provenientes del frontend sin verificacion en backend.
- Usar por defecto el principio de minimo privilegio.
- No exponer si un recurso protegido existe cuando quien llama no tiene acceso, salvo que el producto necesite explicitamente esa distincion.
- Evitar devolver metadatos operativos sensibles en respuestas de error.
- Rotar refresh tokens y revocarlos en logout o cambio de contrasena.

## Checklist de revision

- Que impide que un usuario de menor privilegio invoque esta ruta?
- Que previene fuerza bruta o spam en este endpoint?
- Que rastro de auditoria se genera?
- Que secretos o tokens podrian filtrarse aqui?
- Que datos deben redactarse en logs y respuestas?
