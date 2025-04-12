/// <reference types="mdast" />
import { h } from "hastscript";
import { poemCharCollector } from "../utils/char-collector.mjs";

// 导出字符集合以保持兼容性
export const poemChars = poemCharCollector.getChars();

/**
 * 将文本内容按行分割并过滤空行
 * @param {string} text 要处理的文本
 * @returns {string[]} 处理后的行数组
 */
function splitIntoLines(text) {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

/**
 * 递归提取节点中的所有文本内容
 * @param {import('mdast').Content} node 要处理的节点
 * @returns {string} 提取的文本内容
 */
function extractTextContent(node) {
	if (!node) return "";
	if (node.type === "text" || node.value) return node.value || "";
	if (node.children?.length > 0) {
		return node.children.map(extractTextContent).join("");
	}
	return "";
}

/**
 * 创建诗行容器
 * @param {string[]} lines 诗句数组
 * @returns {import('mdast').Element} 诗行容器元素
 */
function createPoemParagraph(lines) {
	return h(
		"div",
		{ class: "poem-paragraph" },
		lines.map((line) => h("div", { class: "poem-line" }, line)),
	);
}

/**
 * 处理诗词内容节点
 * @param {import('mdast').Content} child 要处理的节点
 * @returns {import('mdast').Element[]} 处理后的元素数组
 */
function processContentNode(child) {
	// 收集字符
	poemCharCollector.collectFromNode(child);

	if (
		child.type === "paragraph" ||
		(child.type === "element" && child.tagName === "p")
	) {
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

	// 收集标题和作者的字符
	if (properties.title) poemCharCollector.collectFromText(properties.title);
	if (properties.author) poemCharCollector.collectFromText(properties.author);

	// 处理诗词内容
	const processedChildren = children.flatMap(processContentNode);

	// 创建标题和作者
	const header = h(
		"div",
		{ class: "poem-header" },
		[
			properties.title && h("span", { class: "poem-title" }, properties.title),
			properties.author &&
				h("span", { class: "poem-author" }, `/ ${properties.author}`),
		].filter(Boolean),
	);

	// 创建诗词内容容器
	const content = h("div", { class: "poem-content" }, processedChildren);

	// 返回整个卡片容器
	return h("div", { class: "poem-card" }, [header, content]);
}
