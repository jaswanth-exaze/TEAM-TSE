import { cp, copyFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const webRoot = resolve(repositoryRoot, 'apps/web')
const outputRoot = resolve(repositoryRoot, 'dist')

const rootFiles = [
  'index.html',
  'about.html',
  'team.html',
  'exaze-logo (1).png',
  'exaze-logo-light.png',
  'exaze-mark.png',
  'vectorink-vectorizer-result.svg',
  'Logo Morph v2 — T · S · E.html',
]

for (const file of rootFiles) {
  await copyFile(resolve(webRoot, file), resolve(outputRoot, file))
}

for (const directory of ['css', 'js', 'team']) {
  await cp(resolve(webRoot, directory), resolve(outputRoot, directory), { recursive: true })
}

for (const lab of ['linux-lab', 'sql-visual-lab']) {
  const target = resolve(outputRoot, 'courses', lab)
  await mkdir(dirname(target), { recursive: true })
  await cp(resolve(webRoot, 'courses', lab), target, { recursive: true })
}

await copyFile(resolve(webRoot, 'courses/favicon.svg'), resolve(outputRoot, 'courses/favicon.svg'))
await writeFile(resolve(outputRoot, '.nojekyll'), '')
