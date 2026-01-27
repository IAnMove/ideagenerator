# architecture.md

## Vision
Aplicacion web Node para generar ideas de apps y prompts tecnicos. Combina listas configurables con modos manual/aleatorio/LLM y devuelve 3 ideas puntuadas con pros/cons, mas un prompt tecnico con Clean Architecture y Clean Code.

## Componentes
- UI Web
  - Selector de idioma (espanol/ingles)
  - Editor de listas (sector, publico, problema, tipo, canal, lenguajes)
  - Selector de modos (manual/aleatorio/sugiere)
  - Generacion y visualizacion de 3 ideas + prompt
- API Node
  - Endpoint de generacion
  - Endpoints CRUD para listas y plantillas
  - Endpoints de idiomas
- LLM Gateway
  - Proveedor abstracto (DeepSeek, OpenAI, Ollama)
  - Reintentos, timeouts, y validacion de JSON
- Persistencia
  - JSON local o sqlite (configurable)

## Clean Architecture (capas)
- domain
  - Entidades: Idea, Template, OptionList, LanguageProfile
  - Value Objects: SelectionMode, Score
  - Reglas de negocio (combinatoria, validaciones)
- application
  - Casos de uso: GenerateIdeas, UpdateLists, SetLanguage, BuildPrompt
  - DTOs y mapeos
- infrastructure
  - LLM providers (adapters)
  - Repositorios (json/sqlite)
  - Logging/metrics
- interface
  - API REST (controllers, request/response)
  - Web UI (client)

## Modelo de datos (conceptual)
### OptionList
- id
- name (sector/publico/problema/tipo/canal/lenguajes)
- items: string[]

### SelectionConfig
- mode: manual | random | llm
- value?: string (cuando manual)

### TemplateLevel
- basic | advanced

### IdeaRequest
- language: es | en
- templateLevel: basic | advanced
- selections:
  - sector: SelectionConfig
  - audience: SelectionConfig
  - problem: SelectionConfig
  - productType: SelectionConfig
  - channel: SelectionConfig
- programmingLanguage: SelectionConfig
- extraNotes?: string

### IdeaResponse
- ideas: 3 items (score + pros/cons)
- prompt: intro + technical
- suggestedLanguage?: string

## Flujo principal
1) UI construye IdeaRequest con modos de seleccion.
2) API resuelve inputs:
   - manual: usa value
   - random: elige de OptionList
   - llm: pide al LLM valores sugeridos
3) Genera prompt base en el idioma elegido y nivel de plantilla.
4) Llama al LLM para ideas + prompt tecnico (JSON estricto).
5) Valida schema y devuelve respuesta a UI.

## Prompting (LLM)
- Instruir respuesta JSON estricta, sin markdown.
- Incluir reglas de Clean Architecture y Clean Code.
- Forzar 3 ideas con puntuacion y pros/cons.
- Si language = es, responder en espanol; si en, responder en ingles.

## i18n
- UI strings en archivos de traduccion.
- API debe reenviar idioma a LLM para salida coherente.
- Idiomas editables: se puede anadir nuevos idiomas y traducciones basicas.

## Observabilidad
- Logs estructurados por requestId.
- Captura de tiempo de respuesta y errores LLM.

## Seguridad basica
- Limites de rate (por IP).
- Sanitizacion de inputs y size limits.

## Versionado de API
- /api/v1/...

## Decisiones iniciales
- Node con REST simple.
- Persistencia sencilla (json/sqlite) para rapidez.
- Provider LLM intercambiable.
