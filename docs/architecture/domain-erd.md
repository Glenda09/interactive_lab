# ERD Conceptual

```mermaid
erDiagram
  USER ||--o{ USER_ROLE : has
  ROLE ||--o{ USER_ROLE : assigns
  ROLE ||--o{ ROLE_PERMISSION : grants
  PERMISSION ||--o{ ROLE_PERMISSION : includes
  USER ||--o{ ENROLLMENT : owns
  COURSE ||--o{ ENROLLMENT : receives
  COURSE ||--o{ MODULE : contains
  MODULE ||--o{ LEARNING_RESOURCE : provides
  MODULE ||--o{ MODULE_SCENARIO : links
  SCENARIO_3D ||--o{ MODULE_SCENARIO : used_in
  MODULE ||--o{ ASSESSMENT : evaluates
  USER ||--o{ COURSE_PROGRESS : tracks
  USER ||--o{ MODULE_PROGRESS : tracks
  USER ||--o{ SIMULATION_SESSION : starts
  SCENARIO_3D ||--o{ SIMULATION_SESSION : runs
  SIMULATION_SESSION ||--o{ SIMULATION_ATTEMPT : contains
  SIMULATION_ATTEMPT ||--o{ SIMULATION_EVENT : emits
  ASSESSMENT ||--o{ ASSESSMENT_RESULT : produces
  USER ||--o{ ASSESSMENT_RESULT : receives
  USER ||--o{ AUDIT_LOG : performs
  USER ||--o{ NOTIFICATION : receives
  FILE_RESOURCE }o--|| SCENARIO_3D : supports
  FILE_RESOURCE }o--|| LEARNING_RESOURCE : stores

  USER {
    uuid id
    string email
    string status
    datetime last_login_at
  }

  ROLE {
    uuid id
    string code
    string name
  }

  PERMISSION {
    uuid id
    string code
    string resource
    string action
  }

  COURSE {
    uuid id
    string code
    string title
    string status
  }

  MODULE {
    uuid id
    uuid course_id
    string title
    int sort_order
  }

  SCENARIO_3D {
    uuid id
    string code
    string version
    string status
  }

  SIMULATION_SESSION {
    uuid id
    uuid user_id
    uuid scenario_id
    string status
    datetime started_at
  }

  ASSESSMENT {
    uuid id
    uuid module_id
    string type
    decimal pass_score
  }

  ASSESSMENT_RESULT {
    uuid id
    uuid assessment_id
    uuid user_id
    decimal score
    boolean passed
  }
```

## Notas

- El ERD es conceptual, no fisico.
- `SIMULATION_EVENT` puede terminar en almacenamiento relacional o documental segun volumen final.
- `FILE_RESOURCE` representa metadata; el binario debe vivir en object storage.
- `COURSE_PROGRESS` y `MODULE_PROGRESS` pueden ser tablas materializadas o vistas consolidadas, segun estrategia final.

