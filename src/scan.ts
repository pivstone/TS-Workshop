import * as ts from "typescript";
import fs from "fs";
import path from "path";
import { isMetaFunction, isZodObject } from "./helpers";

process.env.PACKAGE_NAME = "'sample/dynamo-client'"
process.env.FUNCTION_NAME = 'meta';
const ROOT = '/Users/sample';


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
  const currentDirectoryFiles = await getFiles(ROOT);
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
