import * as ts from "typescript";
import fs from "fs";
import path from "path";

const PACKAGE_NAME = "'./dynamo-client'"
const FUNCTION_NAME = 'meta';

/**
 * check if this node is the function named: 'meta'
 * @param node 
 * @param checker 
 * @returns 
 */
export const isMetaFunction = (node: ts.CallExpression, checker: ts.TypeChecker): boolean => {
  const symbol = checker.getSymbolAtLocation(node.expression);
  if (!symbol) return false;
  const declarations = symbol.getDeclarations();
  if (!declarations) return false;
  if (declarations.length === 0) return false;

  const declaration = declarations[0];
  if (!ts.isImportSpecifier(declaration)) return false;

  const importDeclaration = declaration.parent.parent.parent;
  if (!ts.isImportDeclaration(importDeclaration)) return false;
  if (importDeclaration.moduleSpecifier.getText() != PACKAGE_NAME) {
    return false;
  }
  let result = false;
  importDeclaration.importClause?.namedBindings?.forEachChild(n => {
    if (ts.isImportSpecifier(n)) {
      if (n.propertyName && n.propertyName.getText() === FUNCTION_NAME) {
        result = true;
      } else if (
        n.name.getText() === FUNCTION_NAME
      ) {
        result = true;
      }

    }
  })
  return result;

};

/**
 * check if the first of argument meta function is a z.ZodObject
 * and this node is a variable declaration (e.g: a = '1' )
 * @param node 
 * @param checker 
 * @returns 
 */
export const isZodObject = (node: ts.CallExpression, checker: ts.TypeChecker) => {
  const args = node.arguments;
  const firstArgs = args[0];
  const type = checker.getTypeAtLocation(firstArgs);
  const typeName = checker.typeToString(type, firstArgs);
  // the first arg must be a z.ZodObject
  // and it should be a variable declaration
  // const table = meta(z.Object({})),  matched
  // const table = meta(z.Object({
  //     identity: meta(z.Object()),   shouldn't matched
  // }))
  return (
    typeName.startsWith("z.ZodObject") &&
    ts.isVariableDeclaration(node.parent)
  )
}


async function getFiles(dir: string): Promise<any> {
  const folders = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    folders.map((folder) => {
      // ignore the "black hole" node_modules folder
      if (folder.name === "node_modules") return "";
      const res = path.resolve(dir, folder.name);
      return folder.isDirectory() ? getFiles(res) : res;
    })
  );
  // we only need to focus on "model" folder
  return files.flat().filter((s) => s.includes("model"));
}

(async () => {
  // get all the files
  const currentDirectoryFiles = await getFiles(
    `/Users/x/GitHub/appsync`
  );
  const program: ts.Program = ts.createProgram(currentDirectoryFiles, {
    skipLibCheck: true,
  });
  const checker: ts.TypeChecker = program.getTypeChecker();

  const loop =
    (checker: ts.TypeChecker, sourceFile: ts.SourceFile) => (node: ts.Node) => {
      // only focus on the meta() call expression
      if (ts.isCallExpression(node) && isMetaFunction(node, checker) && isZodObject(node, checker)) {
        console.log(
          sourceFile.getLineAndCharacterOfPosition(node.getStart()),
          sourceFile.fileName,
          node.parent.getFirstToken()?.getText()
        );
      }

      ts.forEachChild(node, loop(checker, sourceFile));
    };
  program.getSourceFiles().forEach((sourceFile: ts.SourceFile) => {
    loop(checker, sourceFile)(sourceFile);
  });
})();
