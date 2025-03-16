/**
 * 字符收集器类
 */
export class CharCollector {
  constructor() {
    this.chars = new Set()
  }

  /**
   * 收集文本中的所有字符
   * @param {string} text - 要收集字符的文本
   */
  collectFromText(text) {
    Array.from(text).forEach(char => this.chars.add(char))
  }

  /**
   * 收集节点中的所有字符
   * @param {any} node - 要处理的节点
   */
  collectFromNode(node) {
    if (typeof node === 'string') {
      this.collectFromText(node)
      return
    }

    // 处理文本节点
    if (node.type === 'text' && node.value) {
      this.collectFromText(node.value)
      return
    }

    // 处理子节点
    if (node.children) {
      node.children.forEach(child => this.collectFromNode(child))
    }
  }

  /**
   * 获取收集到的字符集合
   * @returns {Set<string>}
   */
  getChars() {
    return this.chars
  }
}

// 导出一个全局实例用于收集诗词字符
export const poemCharCollector = new CharCollector()
