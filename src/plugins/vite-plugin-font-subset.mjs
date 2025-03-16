import path from 'path'
import { fileURLToPath } from 'url'
import Fontmin from 'fontmin'
import fs from 'fs/promises'

/**
 * 创建字体子集化插件
 * @param {Set<string>} charsSet - 需要保留的字符集
 * @param {Object} options - 插件配置选项
 * @param {string} options.srcFont - 源字体文件路径
 * @param {string} options.destDir - 输出目录路径
 * @returns {import('vite').Plugin}
 */
export function createFontSubsetPlugin(charsSet, options = {}) {
  return {
    name: 'vite-plugin-font-subset',
    async buildStart() {
      // 添加一些基本标点符号和常用字符
      const basicChars = '，。！？；：""\'\'（）【】《》、…—'
      basicChars.split('').forEach(char => charsSet.add(char))

      const __dirname = path.dirname(fileURLToPath(import.meta.url))
      const srcFontPath =
        options.srcFont ||
        path.join(__dirname, '../../public/fonts/ChenYuluoyan.ttf')
      const destFontPath =
        options.destDir || path.join(__dirname, '../../dist/fonts')

      // 确保输出目录存在
      await fs.mkdir(destFontPath, { recursive: true })

      // 获取所有收集到的字符
      const chars = Array.from(charsSet).join('')
      console.log('收集到的字符数量:', chars.length)
      console.log('字符列表:', chars)

      // 创建 Fontmin 实例
      const fontmin = new Fontmin()
        .src(srcFontPath)
        .dest(destFontPath)
        .use(
          Fontmin.glyph({
            text: chars,
            hinting: false,
          }),
        )
        // 添加 ttf2woff2 转换
        .use(Fontmin.ttf2woff2())

      // 执行字体子集化
      await new Promise((resolve, reject) => {
        fontmin.run((err, files) => {
          if (err) {
            console.error('字体子集化失败:', err)
            reject(err)
            return
          }
          console.log('字体子集化完成')
          resolve(files)
        })
      })

      // 删除生成的 ttf 文件，只保留 woff2
      const ttfFile = path.join(destFontPath, 'ChenYuluoyan.ttf')
      try {
        await fs.unlink(ttfFile)
      } catch (err) {
        // 忽略文件不存在的错误
        if (err.code !== 'ENOENT') {
          console.error('删除 TTF 文件失败:', err)
        }
      }
    },
  }
}
