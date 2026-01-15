---
description: Workflow de Git para subir cambios al repositorio PlantillaWeb
---

# Git Workflow - PlantillaWeb

## Repositorio
- **URL**: https://github.com/Lucas23-IECI/PlantillaWeb
- **Referencia de estilo**: https://github.com/Lucas23-IECI/ProyectoOpticaDanniels

## Estructura de Ramas

```
main              <- Rama principal estable (produccion)
  ^
  |
test              <- Rama de pruebas/QA
  ^
  |
develop           <- Desarrollo integrado
  ^
  |
feat/nombre       <- Features individuales
fix/nombre        <- Correcciones individuales
```

### Flujo Completo

```
1. Crear rama desde develop:
   feat/mi-feature  o  fix/mi-fix
          |
          v
2. Trabajar y hacer commits
          |
          v
3. Push a la rama
          |
          v
4. Merge a develop (PR o manual)
          |
          v
5. Cuando develop esta listo -> merge a test
          |
          v
6. Probar en test, si todo OK -> merge a main
          |
          v
7. main = version estable en produccion
```

## Convención de Commits (EN ESPAÑOL)

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `ADD:` | Agregar algo nuevo | `ADD: Configuracion deploy con Vite` |
| `MOD:` | Modificar algo existente | `MOD: Estilos de la pagina de productos` |
| `FIX:` | Corregir un bug | `FIX: Ruta del frontend en deploy` |

### Ejemplos reales del proyecto:
- `ADD: configuracion deploy con Vite y Github Actions`
- `MOD: BUILD con cambios en App.jsx`
- `MOD: Ubicacion deploy`
- `FIX: ruta del frontend en deploy`
- `FIX: Pagina de productos y producto individual`

## Comandos del Flujo

### 1. Crear rama para trabajar
```bash
git checkout develop
git pull origin develop
git checkout -b feat/nombre-del-feature
```

### 2. Hacer cambios y commit
```bash
git add .
git commit -m "ADD: Descripcion del cambio"
```

### 3. Push de la rama
```bash
git push -u origin feat/nombre-del-feature
```

### 4. Merge a develop
```bash
git checkout develop
git merge feat/nombre-del-feature
git push origin develop
```

### 5. Merge develop a test (para QA)
```bash
git checkout test
git merge develop
git push origin test
```

### 6. Merge test a main (release a produccion)
```bash
git checkout main
git merge test
git push origin main
```

## Antes de Subir - Verificar

// turbo-all

1. **Revisar `.gitignore`**: Asegurarse que no se suban:
   - `node_modules/`
   - `.env` y archivos de credenciales
   - Archivos del IDE
   - Archivos del sistema

2. **Revisar cambios**: `git status` y `git diff --stat`

3. **No subir archivos problematicos** como `nul` (nombre reservado en Windows)

## Ramas Especiales

| Rama | Proposito |
|------|-----------|
| `main` | Produccion estable |
| `develop` | Desarrollo activo |
| `test` | Pruebas/QA |
| `gh-pages` | Deploy GitHub Pages |
| `feat/*` | Nuevas funcionalidades |
| `feature/*` | Alternativa para features |
| `fix/*` | Correcciones de bugs |
