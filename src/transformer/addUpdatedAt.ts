/**
 * This transformer will add updatedAt field into Zod Object
 */
import * as ts from "typescript";
import { isZodObject } from "../helpers";

const createUpdatedAtProperty = (factory: ts.NodeFactory) => {
  return factory.createPropertyAssignment(
    factory.createIdentifier("updatedAt"),
    factory.createCallExpression(factory.createIdentifier("meta"), undefined, [
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("z"),
              factory.createIdentifier("number")
            ),
            undefined,
            []
          ),
          factory.createIdentifier("optional")
        ),
        undefined,
        []
      ),
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            factory.createIdentifier("description"),
            factory.createStringLiteral(
              "Update date of the order as javascript timestamp"
            )
          ),
        ],
        true
      ),
    ])
  );
};

const transformerProgram = (program: ts.Program) => {
  const typeChecker = program.getTypeChecker();

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        console.log(
          ts.isCallExpression(node) && isZodObject(node, typeChecker)
        );
        if (ts.isCallExpression(node) && isZodObject(node, typeChecker)) {
          console.log("here");
          // jump into the deep object
          const target = (
            (
              (node.arguments[0] as ts.CallExpression)
                .expression as ts.PropertyAccessExpression
            ).expression as ts.CallExpression
          ).arguments[0];
          if (ts.isObjectLiteralExpression(target)) {
            const factory = context.factory;
            return factory.updateObjectLiteralExpression(target, [
              ...target.properties,
              createUpdatedAtProperty(factory),
            ]);
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
  return transformer;
};

export default transformerProgram;
