---
title: 为你的 Fuwari 博客添加自定义渲染节点 —— 以自定义诗词卡片为例
published: 2025-03-16
description: '为你的Fuwari博客添加自定义渲染节点——以自定义诗词卡片为例'
image: "https://image.rainafter.cn/i/2025/03/17/67d83b2697c22.jpg"
tags: ["技术","前端"]
category: "代码人生"
draft: false 
lang: 'ZH' 
---

## 一、起因
### 1.1 背景
不久前，记得那天是周五，下午休息的时候习惯性的打开[阮一峰老师的周刊](https://www.ruanyifeng.com/blog/2025/03/weekly-issue-341.html)，发现周刊的优秀项目中推荐了一款十分清秀的手写字体，并且还进行了开源，不由得引起我的注意。

::github{repo="Chenyu-otf/chenyuluoyan_thin"}

因本人的习惯和爱好，不时会饶有兴趣的写一些偏向散文的随笔或者诗词，这次看到如此清秀的手写字体，不由得产生了使用这种字体为我的诗词进行展示的想法。

当然，由于 Fuwari 博客使用 Markdown 渲染博客页面的原因，使用特殊字体渲染诗词的最佳实践应是自定义渲染节点

:::note
事实上，上方Fuwari博客自带的 Github 仓库展示语法就是一种自定义渲染节点，本文的这词要实现的东西便是定义一种类似于这种效果的节点对诗词进行渲染
:::

说干就干，经过一通查找 mdast 语法分析树的资料和编写代码，成功实现了自定义 Markdown 渲染节点的效果，首先展示一下成品

### 1.2 现代诗渲染效果
1. 输入
```tsx
:::poem{title="《爲什麼》" author="席慕蓉"}
我可以鎖住筆慮什麼，
卻鎖不住愛和憂傷。
在長長的一生裏願什麼，
款樂總是乍現就雕落，
走得最急的都是最美的時光。
:::
```
2. 输出
:::poem{title="《爲什麼》" author="席慕蓉"}
我可以鎖住筆慮什麼，
卻鎖不住愛和憂傷。
在長長的一生裏願什麼，
款樂總是乍現就雕落，
走得最急的都是最美的時光。
:::


### 1.3 诗词渲染效果
1. 输入
```tsx
:::poem{title="《苏幕遮 • 咏梅》" author="宇文Teacher"}
梅凝枝，香氛沁。飛雪玉花，獨綻寒中韻。額點壽陽妝未褪，歲晚燈籠，焰影映春信。

百劫身，千古印。逋老孤山，鶴子梅妻問。素心不共羣芳燼，待折梅枝，寄取春風訊。
:::
```
2. 输出
:::poem{title="《苏幕遮 • 咏梅》" author="宇文Teacher"}
梅凝枝，香氛沁。飛雪玉花，獨綻寒中韻。額點壽陽妝未褪，歲晚燈籠，焰影映春信。

百劫身，千古印。逋老孤山，鶴子梅妻問。素心不共羣芳燼，待折梅枝，寄取春風訊。
:::

## 二、自定义渲染节点
### 2.1 新建诗词卡片节点
1. 首先我们在 **/src/plugins** 目录下新建文件 **rehype-component-poem-card.mjs**
2. 在 **rehype-component-poem-card.mjs** 文件内新增
```js
/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * 处理诗词内容节点
 * @param {import('mdast').Content} child 要处理的节点
 * @returns {import('mdast').Element[]} 处理后的元素数组
 */
function processContentNode(child) {
  if (child.type === "paragraph" || (child.type === "element" && child.tagName === "p")) {
    const text = extractTextContent(child).trim();
    return [createPoemParagraph(splitIntoLines(text))];
  }

  if (child.type === "element" && child.children?.length > 0) {
    // 如果是p元素，需要特殊处理
    if (child.tagName === "p") {
      const text = extractTextContent(child).trim();
      return [createPoemParagraph(splitIntoLines(text))];
    }

    const processedChildren = child.children.flatMap((grandchild) => {
      if (grandchild.type === "text") {
        return [createPoemParagraph(splitIntoLines(grandchild.value))];
      }
      return processContentNode(grandchild);
    });
    return [h("div", { class: "poem-paragraph" }, processedChildren)];
  }

  if (child.type === "text" && child.value) {
    return [createPoemParagraph(splitIntoLines(child.value))];
  }

  return [child];
}

/**
 * 创建一个古风诗词卡片组件
 * @param {Object} properties 组件属性
 * @param {string} [properties.title] 诗词标题
 * @param {string} [properties.author] 作者
 * @param {import('mdast').Content[]} children 诗词内容
 * @returns {import('mdast').Element} 创建的诗词卡片组件
 */
export function PoemCardComponent(properties, children) {
  if (!Array.isArray(children) || children.length === 0) {
    return h("div", { class: "hidden" }, "无效的诗词指令。(需要包含诗词内容)");
  }

  // 创建标题和作者
  const header = h(
    "div",
    { class: "poem-header" },
    [
      properties.title && h("span", { class: "poem-title" }, properties.title),
      properties.author && h("span", { class: "poem-author" }, `/ ${properties.author}`),
    ].filter(Boolean)
  );

  // 处理诗词内容
  const processedChildren = children.flatMap(processContentNode);

  // 创建诗词内容容器
  const content = h("div", { class: "poem-content" }, processedChildren);

  // 返回整个卡片容器
  return h("div", { class: "poem-card" }, [header, content]);
}
```
3. 在 **/src/styles** 目录下新增诗词卡片的样式文件 **poem-card.css**

:::note
注意：在 **/src/styles** 目录下的样式文件会自动引入Astro全局
:::

```css
@font-face {
  /* 上文提到的开源字体： 辰宇落雁體，可自行前往Github仓库下载，并重命名放在项目根目录下的 /fonts 目录内*/
  font-family: "ChenYuluoyan";
  src: url("/fonts/ChenYuluoyan.ttf") format("ttf");
  font-display: swap;
}

.poem-card {
  @apply relative my-6 rounded-xl p-10;
  /* 请在项目根目录下的 /public/poem-card 目录下新增两个图片，用作日间模式和黑暗模式状态下诗词卡片的背景 */
  @apply bg-[url('/poem-card/light.jpg')] bg-cover bg-top bg-no-repeat;
  @apply dark:bg-[url('/poem-card/dark.jpg')] dark:bg-center dark:before:bg-black/30;
  @apply before:absolute before:inset-0 before:rounded-xl;
  @apply before:backdrop-blur-[12px];
  @apply isolate;
  /* 添加背景缩放和过渡效果 */
  @apply bg-[length:105%_auto] hover:bg-[length:115%_auto];
  @apply transition-[background-size] duration-500;
  /* 添加模糊效果的过渡 */
  @apply before:transition-[backdrop-filter] before:duration-500;
  @apply hover:before:backdrop-blur-[16px];
  /* 卡片阴影 */
  box-shadow: 1.1px 1.1px 1.4px rgba(0, 0, 0, 0.008), 2.7px 2.7px 3.3px rgba(0, 0, 0, 0.012),
    5px 5px 6.3px rgba(0, 0, 0, 0.015), 8.9px 8.9px 11.2px rgba(0, 0, 0, 0.018),
    16.7px 16.7px 20.9px rgba(0, 0, 0, 0.022), 40px 40px 50px rgba(0, 0, 0, 0.03);
}

.poem-header,
.poem-content {
  @apply relative z-10;
}

.poem-header {
  @apply font-serif;
  font-family: serif;
}

.poem-title {
  @apply mr-3 text-2xl font-bold;
  @apply text-gray-800 dark:text-gray-100;
}

.poem-author {
  @apply text-lg;
  @apply text-gray-600 dark:text-gray-300;
}

/* 诗词内容基础样式 */
.poem-content {
  @apply flex w-full flex-col;
  font-family: "ChenYuluoyan", serif;
  @apply text-4xl leading-relaxed;
  @apply text-gray-800 dark:text-gray-100;
  white-space: pre-wrap;
}

.poem-paragraph {
  @apply mb-2 last:mb-0; /* 段落间距 */
  white-space: pre-wrap;
}

.poem-line {
  @apply my-2 block w-fit max-w-full tracking-wider; /* 行间距保持不变 */
  white-space: pre-wrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .poem-card {
    @apply p-6;
  }

  .poem-content {
    @apply text-3xl;
  }

  .poem-title {
    @apply text-xl;
  }

  .poem-author {
    @apply text-base;
  }
}
```
4. 上文提到的开源字体： 辰宇落雁體，可自行前往Github仓库下载，并重命名放在项目根目录下的 /fonts 目录内
5. 请在项目根目录下的 /public/poem-card 目录下新增两个图片，用作日间模式和黑暗模式状态下诗词卡片的背景图片
   

此时，我们已经完成诗词卡片的创建

### 2.2 在Astro中导入本诗词卡片，用于自定义节点的渲染
打开 **/astro.config.mjs** 文件：
1. 新增诗词卡片的导入，在 **/astro.config.mjs** 文件的上方区域（含有大量import语句的区域），新增如下代码：
```js
import { poemChars } from './src/plugins/rehype-component-poem-card.mjs'
```
2. 在 **/astro.config.mjs** 文件中查找 rehypePlugins，在其中的 rehypeComponents 后的对象中插入如下代码：
```js
poem: PoemCardComponent,
```

#### 示例
1. 原始：
```js
[
    rehypeComponents,
    {
        components: {
        github: GithubCardComponent,
        note: (x, y) => AdmonitionComponent(x, y, "note"),
        tip: (x, y) => AdmonitionComponent(x, y, "tip"),
        important: (x, y) => AdmonitionComponent(x, y, "important"),
        caution: (x, y) => AdmonitionComponent(x, y, "caution"),
        warning: (x, y) => AdmonitionComponent(x, y, "warning"),
        },
    },
],
```
2. 修改后：
```js
[
    rehypeComponents,
    {
        components: {
        github: GithubCardComponent,
        poem: PoemCardComponent,
        note: (x, y) => AdmonitionComponent(x, y, "note"),
        tip: (x, y) => AdmonitionComponent(x, y, "tip"),
        important: (x, y) => AdmonitionComponent(x, y, "important"),
        caution: (x, y) => AdmonitionComponent(x, y, "caution"),
        warning: (x, y) => AdmonitionComponent(x, y, "warning"),
        },
    },
],
```

### 2.3 大功告成（暂时的）
此时，我们已经初步完成了自定义渲染节点——诗词卡片的创建以及导入，使用下方示例的特定语法即可成功渲染出诗词卡片。

#### 示例
```tsx
:::poem{title="标题" author="作者"}
这里填写正文
注意：
1. 正常输入文本敲击回车后即可正常渲染出单行
2. 若需要进行分段，可以在段与段中间保留空行，会自动渲染出段落
:::
```

此时自定义渲染节点——诗词卡片已经完全可用，若非对引入字体过大，减慢了页面加载速度而介意，则不必要继续进行下方的优化操作。

## 三、优化操作（非必要）
这里我在博客站点引入了[辰宇落雁體](https://github.com/Chenyu-otf/chenyuluoyan_thin)，大小有9M，本站点使用的是一台带宽仅有8M的服务器，若不对字体进行处理，则在该字体经网络传输完毕前不会正常显示，而是会使用系统默认字体替代。

作为一名前端工程师，自然对这种因为网络加载而使得页面元素发生跳动的情况不能容忍。

### 3.1 尝试使用woff2压缩ttf字体
常见的思路是将ttf字体转换为woff2字体，但是该手写字体在经过压缩后仍然有4M的大小，依然不能满足页面点击后即可快速加载完成的需求。
![将ttf字体转换为woff2字体](https://image.rainafter.cn/i/2025/03/16/67d6f0582dee4.png)

### 3.2 使用工具将字体进行子集化处理
这里我们使用百度出品的 [**fontmin**](https://www.npmjs.com/package/fontmin) 包，在项目构建时（开发环境构建 和 生产环境构建时）对诗词卡片渲染节点中的所使用到的文字进行子集化处理，这样可以使得引入的字体中仅包含所有的 **.md文件** 中诗词卡片所用到的字，可以极大的压缩字体的体积。

1. 首先在项目根目录打开终端，安装npm包
```bash
pnpm i fontmin // 使用 npm、yarn、pnpm均可
```
2. 在 **/src/plugins** 目录下新建文件 **vite-plugin-font-subset.mjs** 作为Astro的Vite收集诗词所用字符的插件
```js
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
```
3. 在 **/src/utils** 目录下新增文件 **char-collector.mjs**
```js
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
```
4. 修改 **/src/plugins** 目录下的文件 **rehype-component-poem-card.mjs**
新增收集诗词所用字符的代码
```js
/// <reference types="mdast" />
import { h } from 'hastscript'
import { poemCharCollector } from '../utils/char-collector.mjs'

// 导出字符集合以保持兼容性
export const poemChars = poemCharCollector.getChars()

/**
 * 将文本内容按行分割并过滤空行
 * @param {string} text 要处理的文本
 * @returns {string[]} 处理后的行数组
 */
function splitIntoLines(text) {
  return text.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

/**
 * 递归提取节点中的所有文本内容
 * @param {import('mdast').Content} node 要处理的节点
 * @returns {string} 提取的文本内容
 */
function extractTextContent(node) {
  if (!node) return ''
  if (node.type === 'text' || node.value) return node.value || ''
  if (node.children?.length > 0) {
    return node.children.map(extractTextContent).join('')
  }
  return ''
}

/**
 * 创建诗行容器
 * @param {string[]} lines 诗句数组
 * @returns {import('mdast').Element} 诗行容器元素
 */
function createPoemParagraph(lines) {
  return h(
    'div',
    { class: 'poem-paragraph' },
    lines.map(line => h('div', { class: 'poem-line' }, line))
  )
}

/**
 * 处理诗词内容节点
 * @param {import('mdast').Content} child 要处理的节点
 * @returns {import('mdast').Element[]} 处理后的元素数组
 */
function processContentNode(child) {
  // 收集字符
  poemCharCollector.collectFromNode(child)

  if (child.type === 'paragraph' || (child.type === 'element' && child.tagName === 'p')) {
    const text = extractTextContent(child).trim()
    return [createPoemParagraph(splitIntoLines(text))]
  }

  if (child.type === 'element' && child.children?.length > 0) {
    // 如果是p元素，需要特殊处理
    if (child.tagName === 'p') {
      const text = extractTextContent(child).trim()
      return [createPoemParagraph(splitIntoLines(text))]
    }
    
    const processedChildren = child.children.flatMap(grandchild => {
      if (grandchild.type === 'text') {
        return [createPoemParagraph(splitIntoLines(grandchild.value))]
      }
      return processContentNode(grandchild)
    })
    return [h('div', { class: 'poem-paragraph' }, processedChildren)]
  }

  if (child.type === 'text' && child.value) {
    return [createPoemParagraph(splitIntoLines(child.value))]
  }

  return [child]
}

/**
 * 创建一个古风诗词卡片组件
 * @param {Object} properties 组件属性
 * @param {string} [properties.title] 诗词标题
 * @param {string} [properties.author] 作者
 * @param {import('mdast').Content[]} children 诗词内容
 * @returns {import('mdast').Element} 创建的诗词卡片组件
 */
export function PoemCardComponent(properties, children) {
  if (!Array.isArray(children) || children.length === 0) {
    return h('div', { class: 'hidden' }, '无效的诗词指令。(需要包含诗词内容)')
  }

  // 收集标题和作者的字符
  if (properties.title) poemCharCollector.collectFromText(properties.title)
  if (properties.author) poemCharCollector.collectFromText(properties.author)

  // 处理诗词内容
  const processedChildren = children.flatMap(processContentNode)

  // 创建标题和作者
  const header = h('div', { class: 'poem-header' }, [
    properties.title && h('span', { class: 'poem-title' }, properties.title),
    properties.author && h('span', { class: 'poem-author' }, `/ ${properties.author}`),
  ].filter(Boolean))

  // 创建诗词内容容器
  const content = h('div', { class: 'poem-content' }, processedChildren)

  // 返回整个卡片容器
  return h('div', { class: 'poem-card' }, [header, content])
}
```
5. 修改 **/astro.config.mjs** Astro文件
新增诗词字体子集化插件的导入，在 **/astro.config.mjs** 文件的上方区域（含有大量import语句的区域），新增如下代码：
```js
import { createFontSubsetPlugin } from './src/plugins/vite-plugin-font-subset.mjs'
```
并修改 **vite** 配置，新增如下代码：
```js
vite: {
    plugins: [
      createFontSubsetPlugin(poemChars, {
        srcFont: 'public/fonts/ChenYuluoyan.ttf',
        destDir: 'dist/fonts'
      })
    ],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // temporarily suppress this warning
          if (
            warning.message.includes("is dynamically imported by") &&
            warning.message.includes("but also statically imported by")
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
```

最后，重新构建项目，即可发现 **dist/fonts** 目录下新增了 **ChenYuluoyan.woff2** 文件，且页面中诗词卡片渲染时，字体已经变为 **ChenYuluoyan.woff2** 字体，此时由于字体仅包含了诗词卡片所用到的字符，因此字体体积非常小。
![网络加载](https://image.rainafter.cn/i/2025/03/17/67d837e9cf619.png)

## 四、总结
通过上述操作，我们已经成功将诗词卡片渲染节点中的字体进行了子集化处理，这样在页面加载时，诗词卡片渲染节点中的字体将会优先使用 **ChenYuluoyan.woff2** 字体，从而使得页面加载速度更快。

事实上，在完成了第二步后，就已经可以正常使用诗词卡片组件了，第三步的优化操作只是为了在页面加载时，诗词卡片渲染节点中的字体能够更快地加载完成，从而使得页面加载速度更快。

## 五、踩坑
在进行字体子集化处理时，我最初使用的是 [**font-spider（字蛛）**](https://github.com/aui/font-spider) 包，我遇到了一个非常棘手的问题，那就是由于font-spider需要将收集到的字体放在一个临时的 **.html** 文件中，再进行子集化处理。但是Astro在构建时会自动将 **public** 目录下的文件复制到 **dist** 目录下，导致找不到创建的临时 **.html** 文件，从而导致字体子集化处理失败。

因此，我放弃了使用font-spider，转而使用 [**fontmin**](https://www.npmjs.com/package/fontmin) 包，这样我就可以将收集到的字体放在 **public** 目录下，从而避免了上述问题。

当然，此处使用font-spider时也可能是我使用不当，如果大家有更好的方法，欢迎在评论区留言。

## 六、参考文献
- [fontmin](https://www.npmjs.com/package/fontmin)
- [辰宇落雁體](https://github.com/Chenyu-otf/chenyuluoyan_thin)
- [Astro](https://astro.build/)
- [Vite](https://vitejs.dev/)
- [rehype](https://rehype.js.org/)
- [remark](https://remark.js.org/)
