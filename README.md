# Mundos Perdidos 2026 · Río Paraná

Sitio web oficial de las Jornadas Mundos Perdidos 2026 del Museo de Ciencias Naturales A. Scasso.

URL prevista:

https://mundos-perdidos.museoscasso.com.ar/

## Estructura prolija

Separamos responsabilidades para no mezclar proyectos:

- Este repositorio contiene el sitio principal de las Jornadas.
- El repositorio `paleobar-mundos-perdidos` conserva el sitio original de Paleo-Bar.
- En cPanel, Paleo-Bar debe anidarse como segundo repositorio dentro de `public_html/mundos-perdidos/paleobar`.

Así queda publicado:

- Sitio principal: `https://mundos-perdidos.museoscasso.com.ar/`
- Paleo-Bar: `https://mundos-perdidos.museoscasso.com.ar/paleobar/`

## Archivos principales

- `index.html`: estructura y contenido del sitio principal.
- `style.css`: diseño visual responsive.
- `app.js`: menú móvil y animaciones suaves.
- `CNAME`: dominio personalizado.
- `.cpanel.yml`: despliegue automático a `$HOME/public_html/mundos-perdidos/`.

## cPanel

1. Crear subdominio `mundos-perdidos.museoscasso.com.ar`.
2. Apuntarlo a `public_html/mundos-perdidos`.
3. En Git Version Control, clonar este repo en una carpeta interna de repositorios.
4. Usar **Pull or Deploy** para copiar el sitio principal al subdominio.
5. Luego clonar el repo de Paleo-Bar en `public_html/mundos-perdidos/paleobar`.
