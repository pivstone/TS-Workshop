
import * as ts from "typescript";

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
    if (importDeclaration.moduleSpecifier.getText() != process.env.PACKAGE_NAME) {
      return false;
    }
    let result = false;
    importDeclaration.importClause?.namedBindings?.forEachChild(n => {
      if (ts.isImportSpecifier(n)) {
        if (n.propertyName && n.propertyName.getText() === process.env.FUNCTION_NAME) {
          result = true;
        } else if (
          n.name.getText() === process.env.FUNCTION_NAME
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
  