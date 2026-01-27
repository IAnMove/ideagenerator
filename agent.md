# agent.md

## Objetivo
Crear una app web Node que genere ideas de aplicaciones y produzca un prompt tecnico reutilizable para iniciar el desarrollo, siguiendo Clean Architecture y Clean Code. La app debe permitir elegir idioma de salida (espanol/ingles) y generar 3 ideas con puntuacion y pros/cons.

## Principios de trabajo
- Prioriza claridad, simplicidad y separacion de responsabilidades.
- Sigue Clean Architecture: dominio puro, casos de uso en aplicacion, adaptadores en infraestructura, y entrada/salida en interfaz.
- Evita acoplamientos innecesarios y dependencias ciclicas.
- Usa tipado, validaciones y formatos de salida estables (preferible JSON).
- Implementa i18n desde el inicio (UI + respuestas LLM).

## Requisitos funcionales clave
- Generar ideas combinando: Sector x Publico x Problema x Tipo de producto x Canal.
- Para cada categoria, permitir 3 modos de seleccion:
  - manual: elegir una opcion de la lista o escribir una nueva.
  - aleatorio: elegir automaticamente de la lista.
  - sugiere: el LLM propone el valor.
- Plantillas de idea en 2 niveles:
  - Basica: titulo, one-liner, sector, publico, problema, solucion, diferenciador, MVP.
  - Avanzada: todo lo anterior + modelo de negocio, canal, riesgos/hipotesis, datos/inputs, integraciones, metrica principal, restricciones.
- Generar 3 ideas por solicitud.
- Cada idea debe incluir:
  - Puntuacion (1-10) y criterios breves.
  - Pros (min 3) y Contras (min 3).
- Generar un prompt tecnico con:
  - Introduccion corta de la app.
  - Requisitos funcionales/no funcionales.
  - Arquitectura limpia y guias de Clean Code.
  - Estructura de proyecto sugerida.
  - Tests minimos.
- Selector de idioma (espanol/ingles) para UI y salida LLM.
- Selector de lenguaje de programacion con:
  - lista editable,
  - modo aleatorio,
  - modo sugiere (LLM recomienda el mejor).

## Contrato de salida LLM (formato estable)
El LLM debe devolver JSON valido (sin markdown) para facilitar parsing.

Esquema de respuesta esperado:
{
  "language": "es" | "en",
  "ideas": [
    {
      "title": "...",
      "oneLiner": "...",
      "sector": "...",
      "audience": "...",
      "problem": "...",
      "solution": "...",
      "differentiator": "...",
      "mvp": ["..."],
      "score": {
        "value": 1-10,
        "reasons": ["..."]
      },
      "pros": ["..."],
      "cons": ["..."]
    }
  ],
  "prompt": {
    "intro": "...",
    "technical": "..."
  },
  "suggestedLanguage": "..." // solo si el modo es sugiere
}

## Calidad
- Validar inputs y salidas (schemas).
- Manejo robusto de errores del LLM.
- Tests unitarios para casos de uso y validaciones.
- Linting/formatting automatizado.

## Alcance tecnico inicial
- Node + API REST.
- UI web sencilla con selector de idioma y paneles para configuracion de plantilla/listas.
- Persistencia simple (archivo JSON o sqlite) para listas y configuraciones.

## No hacer
- No acoplar UI a proveedores LLM.
- No mezclar logica de generacion con infraestructura.
- No meter UI strings hardcodeados sin i18n.
