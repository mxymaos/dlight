import { type DLNode, DLNodeType } from "../DLNode"
import {
  appendNodesWithIndex,
  deleteNodesDeps,
  removeNodes,
  getFlowIndexFromNodes,
  getFlowIndexFromParentNode,
  arraysEqual
} from "../utils"
import { type CustomNode } from "../CustomNode"
import { type HtmlNode } from "../HtmlNode"
import { MutableNode } from "./MutableNode"

export class ForNode extends MutableNode {
  keys: any[] = []
  array: any[] = []

  _$nodess: DLNode[][] = []
  // ---- 有deps
  nodeFunc?: (key: any, idx: number, forNode: any) => DLNode[]
  keyFunc?: () => any[]
  arrayFunc?: () => any[]
  dlScope?: CustomNode
  listenDeps?: string[]

  // ---- 没有依赖
  nodesFunc?: () => DLNode[][]

  constructor() {
    super(DLNodeType.For)
  }

  duplicatedOrNoKey = false

  _$getItem(key: any, idx: number) {
    // ---- 重复key了就默认用index
    const index = this.duplicatedOrNoKey ? idx : this.keys.indexOf(key)
    return this.array[index]
  }

  /**
     * @methodGroup - 只有有deps的时候才需要用各种func
     */
  _$addNodeFunc(nodeFunc: (key: any, idx: number, forNode: any) => DLNode[]) {
    this.nodeFunc = nodeFunc
  }

  _$addKeyFunc(keyFunc: (() => any[])) {
    this.keyFunc = keyFunc
  }

  _$addArrayFunc(dlScope: CustomNode, arrayFunc: any | (() => any), listenDeps: string[]) {
    this.dlScope = dlScope
    this.arrayFunc = arrayFunc
    this.listenDeps = listenDeps
  }

  /**
     * @methodGroup - 无deps的时候直接加nodes
     */
  _$addNodess(nodesFunc: () => DLNode[][]) {
    this.nodesFunc = nodesFunc
  }

  setArray() {
    this.array = [...this.arrayFunc!()]
  }

  setKeys() {
    if (!this.keyFunc) {
      this.duplicatedOrNoKey = true
      return
    }
    const newKeys = [...this.keyFunc()]
    // ---- 没有重复
    if (newKeys.length === [...new Set(newKeys)].length) {
      this.keys = newKeys
      return
    }
    this.keys = [...Array(this.array.length).keys()]

    // TODO 报错重复key
    console.warn("Duplicated Key")
    this.duplicatedOrNoKey = true
  }

  _$init() {
    if (!this.listenDeps) {
      this._$nodess = this.nodesFunc!()
      this._$nodes = this._$nodess.flat(1)
      this._$bindNodes()
      return
    }
    // ---- 找到HTMLNode作为parentNode，因为它是有真实el的
    let parentNode: DLNode | undefined = this._$parentNode
    while (parentNode && parentNode._$nodeType !== DLNodeType.HTML) {
      parentNode = parentNode._$parentNode
    }

    if (!parentNode) return
    // ---* 必须放在上面，不然按顺序run dep会导致初始化的nodes的deps删不掉
    const update = this.keyFunc
      ? () => { this.updateWithKey(parentNode as HtmlNode) }
      : () => { this.updateWithOutKey(parentNode as HtmlNode) }

    // ---- 加deps
    this.dlScope!._$addDeps(this.listenDeps, update, this)

    this.setArray()
    this.setKeys()
    if (this.duplicatedOrNoKey) {
      for (const idx of this.array.keys()) {
        this._$nodess.push(this.nodeFunc!(null, idx, this))
      }
    } else {
      for (const [idx, key] of this.keys.entries()) {
        this._$nodess.push(this.nodeFunc!(key, idx, this))
      }
    }
    this._$nodes = this._$nodess.flat(1)
    this._$bindNodes()
  }

  getNewNodes(key: any, idx: number) {
    const nodes = this.nodeFunc!(key, idx, this)
    this._$bindNewNodes(nodes)
    return nodes
  }

  /**
   * 没有key这样是优化过的，非常快
   */
  updateWithOutKey(parentNode: HtmlNode) {
    const parentEl = parentNode._$el
    const preLength = this.array.length

    this.setArray()
    const currLength = this.array.length
    if (preLength === currLength) return
    if (preLength < currLength) {
      let newFlowIndex = getFlowIndexFromParentNode(parentNode, this)
      let length = parentEl.childNodes.length // 每次进去调用的话非常耗时
      for (let idx = 0; idx < currLength; idx++) {
        if (idx < preLength) {
          newFlowIndex += getFlowIndexFromNodes(this._$nodess[idx])
          continue
        }
        const newNodes = this.getNewNodes(null, idx);
        [newFlowIndex, length] = appendNodesWithIndex(newNodes, newFlowIndex, parentEl, length)
        this._$nodess.push(newNodes)
      }
      this._$nodes = this._$nodess.flat(1)
      return
    }

    for (let idx = currLength; idx < preLength; idx++) {
      deleteNodesDeps(this._$nodess[idx], this.dlScope!)
      removeNodes(parentNode._$el, this._$nodess[idx])
    }
    this._$nodess = this._$nodess.slice(0, currLength)
    this._$nodes = this._$nodess.flat(1)
  }

  /**
   * 有 key，三步走
   */
  updateWithKey(parentNode: HtmlNode) {
    // ---- 如果提供了key，唯一目的就是为了保证element的reference不变，这样会变慢
    const parentEl = parentNode._$el
    const flowIndex = getFlowIndexFromParentNode(parentNode, this)
    let prevKeys = this.keys
    const prevArray = [...this.array]
    const prevAllNodes = [...this._$nodess]
    const prevNodes = [...this._$nodes]

    this.setArray()
    this.setKeys()
    if (this.duplicatedOrNoKey) prevKeys = [...Array(prevArray.length).keys()]

    if (arraysEqual(prevKeys, this.keys)) return

    const newPrevKeys = []
    const newDlNodes = []

    // ---1 先删除，原来有现在没有的key
    const deletedIdx = []
    for (const [prevIdx, prevKey] of prevKeys.entries()) {
      if (this.keys.includes(prevKey)) {
        newPrevKeys.push(prevKey)
        newDlNodes.push(prevAllNodes[prevIdx])
        continue
      }
      deleteNodesDeps(prevAllNodes[prevIdx], this.dlScope!)
      removeNodes(parentNode._$el, prevAllNodes[prevIdx])

      // ---- 删了原来的key那个位置也要删除
      deletedIdx.push(prevIdx)
    }

    prevKeys = newPrevKeys

    // ---2 再添加
    let newFlowIndex = flowIndex
    let length = parentEl.childNodes.length // 每次进去调用的话非常耗时
    for (const [idx, key] of this.keys.entries()) {
      if (prevKeys.includes(key)) {
        // ---- 这些已经被替换了，但是要更新flowIndex的值
        newFlowIndex += getFlowIndexFromNodes(newDlNodes[prevKeys.indexOf(key)])
        continue
      }
      const newNodes = this.getNewNodes(key, idx);
      [newFlowIndex, length] = appendNodesWithIndex(newNodes, newFlowIndex, parentEl, length)
      newDlNodes.splice(idx, 0, newNodes)
      prevKeys.splice(idx, 0, key)
    }

    newFlowIndex = flowIndex

    const bufferNodes: Record<number, DLNode[]> = {}
    // ---3 再替换  -- Fisher-Yates 洗牌算法 优化
    for (const [idx, key] of this.keys.entries()) {
      const prevIdx = prevKeys.indexOf(key)
      if (bufferNodes[idx]) {
        const bufferedNode = bufferNodes[idx]
        ;[newFlowIndex, length] = appendNodesWithIndex(bufferedNode, newFlowIndex + getFlowIndexFromNodes(bufferedNode), parentEl, length)
        delete bufferNodes[idx]
      } else if (prevIdx === idx) {
        newFlowIndex += getFlowIndexFromNodes(newDlNodes[idx])
      } else {
        bufferNodes[this.keys.indexOf(prevKeys[idx])] = newDlNodes[idx]
        ;[newFlowIndex, length] = appendNodesWithIndex(newDlNodes[prevIdx], newFlowIndex, parentEl, length, true)
      }
      ;[newDlNodes[idx], newDlNodes[prevIdx]] = [newDlNodes[prevIdx], newDlNodes[idx]]
      ;[prevKeys[idx], prevKeys[prevIdx]] = [prevKeys[prevIdx], prevKeys[idx]]
    }

    this._$nodess = newDlNodes
    this._$nodes = this._$nodess.flat(1)

    this.onUpdateNodes(prevNodes, this._$nodes)
  }
}
