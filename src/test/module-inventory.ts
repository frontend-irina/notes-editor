import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

export function editorModules(directory = 'src/editors'): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name).replaceAll('\\', '/')
    if (entry.isDirectory()) return editorModules(path)
    return /\.(ts|tsx)$/.test(path) && !/\.test\./.test(path) ? [path] : []
  })
}

export function isDeclarationOnly(path: string) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
  return source.statements.every(statement => ts.isTypeAliasDeclaration(statement)
    || ts.isInterfaceDeclaration(statement)
    || (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly)
    || (ts.isExportDeclaration(statement) && Boolean(statement.moduleSpecifier)))
}

export function missingTests(modules: string[], hasFile = existsSync) {
  return modules.filter(path => !hasFile(path.replace(/\.(ts|tsx)$/, '.test.$1')))
}
