import * as t from "@babel/types"

export function resolveState(node: t.ClassProperty, classBodyNode: t.ClassBody) {
  const propertyName = (node.key as t.Identifier).name;
  (node.key as t.Identifier).name = `_$$${propertyName}`
  const propertyIdx = classBodyNode.body.indexOf(node)

  /**
   * _$${propertyName}Deps = new Set()
   */
  const depsNode = t.classProperty(
    t.identifier(`_$$${propertyName}Deps`),
    t.newExpression(t.identifier("Set"), [])
  )

  /**
   * get ${propertyName}() {
   *    return this._$$${propertyName}
   * }
   */
  const getterNode = t.classMethod("get", t.identifier(propertyName), [],
    t.blockStatement([
      t.returnStatement(
        t.memberExpression(
          t.thisExpression(),
          t.identifier(`_$$${propertyName}`)
        )
      )
    ])
  )
  /**
   * set ${propertyName}(value) {
   *   this._$updateProperty("${propertyName}", value)
   * }
   */
  const setterNode = t.classMethod("set", t.identifier(propertyName), [
    t.identifier("value")
  ],
  t.blockStatement([
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.thisExpression(),
          t.identifier("_$updateProperty")
        ), [
          t.stringLiteral(propertyName),
          t.identifier("value")
        ]
      )
    )
  ])
  )

  classBodyNode.body.splice(propertyIdx + 1, 0, depsNode, getterNode, setterNode)
}

export function resolveProp(node: t.ClassProperty, classBodyNode: t.ClassBody, decoratorName: "Prop" | "Env", propertyName: string) {
  const propertyIdx = classBodyNode.body.indexOf(node)
  const tag: string = decoratorName.toLowerCase()
  /**
   * _$$$${propertyName} = "prop"
   */
  const derivedStatusKey = t.classProperty(
    t.identifier(`_$$$${propertyName}`),
    t.stringLiteral(tag)
  )
  classBodyNode.body.splice(propertyIdx, 0, derivedStatusKey)
}

export function resolveContent(node: t.ClassProperty, classBodyNode: t.ClassBody, propertyName: string) {
  if (classBodyNode.body.find(n => t.isClassProperty(n) && (n.key as t.Identifier).name === "_$defaultProp")) return
  const propertyIdx = classBodyNode.body.indexOf(node)
  /**
   * _$defaultProp = "propertyName"
   */
  const derivedStatusKey = t.classProperty(
    t.identifier("_$defaultProp"),
    t.stringLiteral(propertyName)
  )
  classBodyNode.body.splice(propertyIdx, 0, derivedStatusKey)
}

export function resolveChildren(node: t.ClassProperty, classBodyNode: t.ClassBody, propertyName: string) {
  const propertyIdx = classBodyNode.body.indexOf(node)
  /**
   * get ${propertyName}() {
   *  return this._$childrenFuncs()
   * }
   */
  const getterNode = t.classMethod("get", t.identifier(propertyName), [],
    t.blockStatement([
      t.returnStatement(
        t.callExpression(
          t.memberExpression(
            t.thisExpression(),
            t.identifier("_$childrenFuncs")
          ), []
        )
      )
    ])
  )
  classBodyNode.body.splice(propertyIdx, 1, getterNode)
}

export function resolveWatch(node: t.ClassMethod, classBodyNode: t.ClassBody, key: string) {
  const propertyIdx = classBodyNode.body.indexOf(node)
  /**
   * _$$${propertyName} = "Watcher"
   */
  const watcherNode = t.classProperty(
    t.identifier(`_$$${key}`),
    t.stringLiteral("Watcher")
  )
  classBodyNode.body.splice(propertyIdx, 0, watcherNode)
}
