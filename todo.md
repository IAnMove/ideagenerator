# todo.md

## 0) Descubrimiento rapido
- Definir stack base (framework web, db simple, ui kit o custom)
- Confirmar proveedor LLM inicial (DeepSeek vs OpenAI vs Ollama)
- Definir formato final de respuesta JSON y reglas de parsing

## 1) Bootstrap del repo
- Inicializar proyecto Node
- Configurar lint/format
- Configurar tests
- Crear estructura Clean Architecture

## 2) Dominio y casos de uso
- Modelos: Idea, Template, OptionList, Score, SelectionMode
- Validaciones de input y output
- Caso de uso: GenerateIdeas
- Caso de uso: BuildPrompt

## 3) Persistencia
- Repositorio JSON o sqlite
- CRUD de listas (sector, publico, problema, tipo, canal, lenguajes)
- CRUD de plantillas

## 4) LLM Gateway
- Interfaz de proveedor
- Adapter DeepSeek
- Adapter OpenAI
- Adapter Ollama
- Parser de JSON estricto con reintento

## 5) API REST
- POST /api/v1/ideas
- GET/PUT /api/v1/lists
- GET/PUT /api/v1/templates
- GET/PUT /api/v1/languages

## 6) UI Web
- Selector idioma (es/en)
- Editor listas y modos (manual/aleatorio/sugiere)
- Selector nivel plantilla (basica/avanzada)
- Vista de resultados (3 ideas + score + pros/cons)
- Vista del prompt tecnico (intro + technical)

## 7) i18n
- Archivos de traduccion para es/en
- Estrategia para nuevos idiomas (add + fallback)

## 8) Calidad
- Tests unitarios para casos de uso
- Test de contrato JSON
- E2E basico para endpoint principal

## 9) Entrega
- README con como correr local
- Ejemplos de request/response

## 10) Post-MVP
- Guardado de ideas favoritas
- Historico de generaciones
- Export a markdown
