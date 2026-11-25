# Identidades y secretos de la factory

Qué credenciales existen, para qué sirven y cómo se crean y rotan. Este documento nunca contiene valores. Crear o rotar credenciales es siempre un paso manual de la persona operadora: ningún agente las crea ni las ve.

## Qué existe

Todo vive en el repositorio de la factory (`jordin-garcia/software-factory`), como secreto o variable de Actions.

| Nombre | Tipo | Qué puede hacer | Qué trabajos lo usan | Cómo se rota |
|---|---|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Secreto | Autentica las peticiones al modelo con la suscripción. No da acceso a GitHub. | Trabajos de agente (planificador, implementador, revisor). También se copia a los repos de producto. | Cada año: repetir `claude setup-token` y reemplazar el secreto. |
| `FACTORY_APP_PRIVATE_KEY` | Secreto | Firma el token de la aplicación de la factory (Contents, Issues, Pull requests, Checks y Commit statuses en lectura y escritura; Metadata y Actions en lectura). Sin Administration, sin Workflows. | Solo trabajos de publicación y reconciliación. Nunca los de agente. Se copia a los repos de producto. | Generar una clave nueva en la aplicación, actualizar el secreto, borrar la clave vieja. |
| `FACTORY_ADMIN_TOKEN` | Secreto | PAT de grano fino de la cuenta personal: Administration, Contents, Secrets, Variables, Workflows y Pages en escritura; Metadata en lectura. Crea repositorios, protege ramas y escribe secretos. | `nuevo-proyecto.yml` (Tarea 7) y los experimentos de la Tarea 3. | Caduca (máximo de los tokens de grano fino): crear uno nuevo antes de la fecha y reemplazar el secreto. |
| `FACTORY_TABLERO_TOKEN` | Secreto | PAT clásico solo con el alcance `project`. Sincroniza el tablero (Projects v2 de la cuenta). | `tablero.yml` (Tarea 8). | Elegir una caducidad al crearlo; renovarlo antes y reemplazar el secreto. |
| `FACTORY_APP_ID` | Variable | Identifica la aplicación. No es secreto. | Trabajos de publicación; repos de producto. | Solo cambia si se recrea la aplicación. |
| `FACTORY_APP_LOGIN` | Variable | Login del bot, formato `<slug>[bot]`. Se usa para comprobar el autor de los marcadores ocultos. | Todos los que leen marcadores; repos de producto. | Solo cambia si se recrea la aplicación. |
| `FACTORY_ACTIVA` | Variable | Interruptor general: `true` o `false`. | Todos los flujos. | No rota. Valor inicial `true`. |
| `FACTORY_HORARIO` | Variable | Franja horaria de trabajo. | Planificación y reconciliación. | No rota. Valor inicial `00-24`. |
| `FACTORY_ZONA_HORARIA` | Variable | Zona de `FACTORY_HORARIO`. | Igual que la anterior. | No rota. Valor inicial `UTC`. |

Referencias adelantadas, aún sin crear:

- `FACTORY_TABLERO`: número del proyecto (tablero). Se fija en la Tarea 8.
- `FACTORY_APROBACION_DELEGADA`: `false` al inicio. Se fija en cada repo de producto en la Tarea 7.

## Cómo crear cada credencial

Prerrequisitos: `gh` instalado y con sesión iniciada (`gh auth status`) como `jordin-garcia`. En los comandos `gh secret set NOMBRE -R ...` sin `--body`, `gh` muestra un aviso con la entrada enmascarada: pega el valor y pulsa Enter. No pegues valores en el comando ni en el historial. También puedes usar la web: repositorio → Settings → Secrets and variables → Actions → New repository secret.

### 1. Aplicación de GitHub (`FACTORY_APP_ID`, `FACTORY_APP_LOGIN`, `FACTORY_APP_PRIVATE_KEY`)

1. Settings (de tu cuenta) → Developer settings → GitHub Apps → New GitHub App.
2. Nombre: elige uno único (su slug será el login). Homepage URL: la URL del repo de la factory.
3. Webhook: desmarca Active (sin webhooks).
4. Repository permissions: Contents, Issues, Pull requests, Checks y Commit statuses en Read and write; Metadata y Actions en Read-only. Deja todo lo demás en No access (en especial Administration y Workflows). No pidas permisos de cuenta ni de organización.
5. Where can this GitHub App be installed: Only on this account. Create GitHub App.
6. En la página de la aplicación: copia el App ID. El slug aparece en la URL pública (`github.com/apps/<slug>`); el login es `<slug>[bot]`.
7. Install App (menú lateral) → tu cuenta → All repositories → Install.
8. De vuelta en la aplicación: Private keys → Generate a private key. Se descarga un `.pem`.
9. Guarda los tres valores:
   ```
   gh variable set FACTORY_APP_ID -R jordin-garcia/software-factory
   gh variable set FACTORY_APP_LOGIN -R jordin-garcia/software-factory
   ```
   La clave privada, en PowerShell:
   ```
   Get-Content -Raw ruta\al\archivo.pem | gh secret set FACTORY_APP_PRIVATE_KEY -R jordin-garcia/software-factory
   ```
   (Solo en bash: `gh secret set FACTORY_APP_PRIVATE_KEY -R jordin-garcia/software-factory < ruta/al/archivo.pem`.)
   (Sin `--body`, `gh variable set` pide el valor por consola.)
10. Borra el `.pem` del disco cuando el secreto esté guardado.

### 2. `CLAUDE_CODE_OAUTH_TOKEN`

1. En tu máquina local, con tu suscripción activa, ejecuta `claude setup-token` y sigue el flujo del navegador. Imprime un token de un año.
2. `gh secret set CLAUDE_CODE_OAUTH_TOKEN -R jordin-garcia/software-factory` y pega el token.

Avisos documentados:

- Autentica solo las peticiones al modelo, y funciona con Pro.
- Si `ANTHROPIC_API_KEY` existe en el entorno, tiene prioridad sobre el token. No la definas nunca, ni como secreto ni como variable.
- El modo `--bare` no lee el token OAuth: no se usa en los flujos.

### 3. `FACTORY_ADMIN_TOKEN` (grano fino)

1. Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Resource owner: tu cuenta personal. Expiration: la máxima permitida; anota la fecha.
3. Repository access: All repositories (un repo creado después debe quedar cubierto).
4. Repository permissions, en Read and write: Administration, Contents, Secrets, Variables, Workflows, Pages. Metadata en Read-only. Si aparece el permiso de crear repositorios, concédelo.
5. Generate token y guárdalo: `gh secret set FACTORY_ADMIN_TOKEN -R jordin-garcia/software-factory`.

### 4. `FACTORY_TABLERO_TOKEN` (clásico, solo `project`)

Motivo: según la documentación de GitHub, los tokens de grano fino no acceden a Projects v2 de una cuenta personal, y las GitHub Apps solo tienen el permiso `organization_projects`. Por eso este token es aparte y mínimo.

1. Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic).
2. Marca únicamente el alcance `project`. Elige una caducidad y anótala.
3. `gh secret set FACTORY_TABLERO_TOKEN -R jordin-garcia/software-factory`.

### 5. Variables de control

```
gh variable set FACTORY_ACTIVA -R jordin-garcia/software-factory --body true
gh variable set FACTORY_HORARIO -R jordin-garcia/software-factory --body 00-24
gh variable set FACTORY_ZONA_HORARIA -R jordin-garcia/software-factory --body UTC
```

### 6. Comprobar

`gh secret list -R jordin-garcia/software-factory` y `gh variable list -R jordin-garcia/software-factory` muestran nombres, nunca valores. Deben aparecer los de la tabla.

## Reglas

- Ninguna credencial se imprime en los logs: ni secretos, ni variables de entorno, ni salidas completas.
- Ningún trabajo de agente recibe `FACTORY_ADMIN_TOKEN` ni `FACTORY_TABLERO_TOKEN`, ni un token de GitHub con escritura. Estos dos viven solo en el repo de la factory y no salen de él.
- Los repos de producto reciben únicamente `CLAUDE_CODE_OAUTH_TOKEN`, `FACTORY_APP_PRIVATE_KEY`, `FACTORY_APP_ID` y `FACTORY_APP_LOGIN`.
- La aplicación no tiene Workflows a propósito: los agentes no pueden cambiar `.github/**`.
- Calendario de rotación: el token de grano fino y el del tablero caducan en su fecha; `claude setup-token` caduca al año. Anota las tres fechas al crearlos y renueva antes.
- Nunca se escribe un valor real en este documento, en issues ni en commits.
