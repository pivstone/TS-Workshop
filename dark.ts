import * as ts from "typescript";
import fs from "fs";
import path from "path";

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
    `/Users/xiaoleiwang/GitHub/choco-appsync`
  );
  const program: ts.Program = ts.createProgram(currentDirectoryFiles, {
    skipLibCheck: true,
  });
  const checker: ts.TypeChecker = program.getTypeChecker();

  const isMetaFunction = (node: ts.CallExpression): boolean => {
    const symbol = checker.getSymbolAtLocation(node.expression);
    if (!symbol) return false;
    const declarations = symbol.getDeclarations();
    if (!declarations) return false;
    if (declarations.length === 0) return false;

    const declaration = declarations[0];
    if (ts.isMethodDeclaration(declaration)) {
    }
    if (ts.isImportSpecifier(declaration)) {
      if (declaration.getText() === "meta") {
        return true;
      }
      // if import as alias, then the getText() is "meta as Alias"
      // and the node has a propertyName
      return declaration.propertyName?.escapedText === "meta";
    }

    return false;
  };

  const loop =
    (checker: ts.TypeChecker, sourceFile: ts.SourceFile) => (node: ts.Node) => {
      // only focus on the meta() call expression
      if (ts.isCallExpression(node) && isMetaFunction(node)) {
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
        if (
          typeName.startsWith("z.ZodObject") &&
          ts.isVariableDeclaration(node.parent)
        ) {
          console.log(
            sourceFile.getLineAndCharacterOfPosition(node.getStart()),
            sourceFile.fileName,
            node.parent.getFirstToken()?.getText()
          );
        }
      }

      ts.forEachChild(node, loop(checker, sourceFile));
    };
  program.getSourceFiles().forEach((sourceFile: ts.SourceFile) => {
    loop(checker, sourceFile)(sourceFile);
  });
})();
