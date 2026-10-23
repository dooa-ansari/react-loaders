// Auto-registers every loader in this folder, along with its raw source for the "copy" buttons.
const components = import.meta.glob('./*.jsx', { eager: true })
const jsx = import.meta.glob('./*.jsx', { eager: true, query: '?raw', import: 'default' })
const css = import.meta.glob('./*.css', { eager: true, query: '?raw', import: 'default' })

const toTitle = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2')

export const loaders = Object.keys(components).map((path) => {
  const name = path.slice(2, -4)
  return {
    name,
    title: toTitle(name),
    Component: components[path].default,
    jsx: jsx[path],
    css: css[`./${name}.css`] ?? '',
  }
})
