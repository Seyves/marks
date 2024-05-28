import Entity from "./bin/definitions"
import { SYMBOLS, parseHr, parseSettext, parseUnorderedList } from "./bin/rules"

export interface StackItem {
    tag: Entity.Tag
    children: Stack
}

export type Stack = StackItem[]

function countIndent(input: string, start: number) {
    let indent = 0, i

    L: for (i = start; i < input.length; i++) {
        switch (input[i]) {
            case " ":
                indent++
                break
            case "/t":
                indent += 4
                break
            default:
                break L
        }
    }

    return [indent, i] as const
}

function processIndent(indent: number, stack: Stack, lineStack: Stack, isLazyConPossible: boolean) {
    let remainingIndent = indent

    const newNodes: Stack = []

    for (let i = 0; i < stack.length; i++) {
        if (lineStack[i]) {
            if (stack[i].tag.type !== lineStack[i].tag.type) {
                break
            }
            continue
        }

        const item = stack[i].tag

        if (item.type !== "list-item") continue

        if (item.indent > remainingIndent) break

        newNodes.push({
            tag: {
                architype: "block",
                type: "list",
            },
            children: []
        })

        newNodes.push({
            tag: {
                architype: "block",
                type: "list-item",
                indent: item.indent
            },
            children: []
        })

        remainingIndent -= item.indent
    }

    if (!isLazyConPossible && remainingIndent >= 4) {
        const indentCodeBlock: Entity.IndentCodeBlock = {
            architype: "leaf-block",
            type: "indent-code-block",
            content: " ".repeat(remainingIndent - 4)
        }

        newNodes.push({
            tag: indentCodeBlock,
            children: []
        })
    }

    return [newNodes, remainingIndent] as const
}

export function parseNewLine(input: string, start: number, stack: Stack, isLazyConPossible: boolean, isSetextHeadingPossible: boolean) {
    const lineStack: Stack = [{
        tag: {
            architype: "block",
            type: "document",
        },
        children: []
    }]

    let prevIndent = 0

    const listIndent: number[] = []
    const docContext = stack[stack.length - 1]?.tag

    let i

    for (i = start; i < input.length; i++) {
        const context = lineStack[lineStack.length - 1]?.tag

        let wasIndentSet = false

        const isBlockContext = !context || context.architype === "block"

        const char = input[i]

        if (char === "\n") {
            return [lineStack, i + 1, listIndent] as const
        }

        if (context && (context.type === "paragraph" || context.type === "indent-code-block" || context.type === "heading")) {
            context.content += char;
            continue;
        }

        console.log("Cycle, symbol ", char)

        switch (char) {
            //indent
            case "\t":
            case " ": {
                if (docContext && docContext.type === "code-block") {
                    break
                }

                const [indent, endOfIndent] = countIndent(input, i)


                let largestListIndent = 0

                for (let j = 1; j < stack.length; j++) {
                    const item = stack[j]

                    if (item.tag.type === "list-item") {
                        largestListIndent += indent
                    }
                }

                if (isBlockContext) {
                    const processed = processIndent(indent, stack, lineStack, isLazyConPossible)

                    prevIndent = processed[1]
                    wasIndentSet = true
                    console.log("Setting prev indent: ", prevIndent)

                    if (processed[0].length > 0) {
                        lineStack.push(...processed[0])

                    } else if (isLazyConPossible && indent >= 4) {
                        const paragraph: Entity.Paragraph = {
                            architype: "leaf-block",
                            type: "paragraph",
                            content: ""
                        }

                        lineStack.push({
                            tag: paragraph,
                            children: [],
                        })
                    }
                }

                i = endOfIndent - 1

                break
            }
            case "#": {
                let j

                for (j = 1; j + i < input.length; j++) {
                    if (input[i + j] !== "#") break
                }

                if (j > 6 || input.length <= i + j || input[i + j] !== " ") {
                    const paragraph: Entity.Paragraph = {
                        architype: "leaf-block",
                        type: "paragraph",
                        content: ""
                    }

                    lineStack.push({
                        tag: paragraph,
                        children: [],
                    })

                    i--

                    continue
                }

                const heading: Entity.Heading = {
                    architype: "leaf-block",
                    type: "heading",
                    content: "",
                    level: j
                }

                lineStack.push({
                    tag: heading,
                    children: []
                })

                i += j

                break
            }
            case ">": {
                if (input.length > i + 1 && input[i + 1] === " ") i++

                const blockquote: Entity.Blockquote = {
                    architype: "block",
                    type: "blockquote"
                }

                lineStack.push({
                    tag: blockquote,
                    children: []
                })

                break
            }
            case SYMBOLS.STAR:
                //chech for hr
                if (isBlockContext) {
                    const hrParseResult = parseHr(input, i, SYMBOLS.STAR)

                    if (hrParseResult) {
                        const [items, end] = hrParseResult

                        lineStack.push(...items)

                        i = end

                        break
                    }
                }

                if (input.length > i + 1 && input[i + 1] === " ") {
                    const [items, end] = parseUnorderedList(input, i, prevIndent)

                    lineStack.push(...items)

                    i = end
                } else {
                    lineStack.push({
                        tag: {
                            type: "paragraph",
                            architype: "leaf-block",
                            content: ""
                        },
                        children: []
                    })
                    i--
                }

                break
            case SYMBOLS.UNDERSCORE: {
                //chech for hr
                if (isBlockContext) {
                    const hrParseResult = parseHr(input, i, SYMBOLS.UNDERSCORE)

                    if (hrParseResult) {
                        const [items, end] = hrParseResult

                        lineStack.push(...items)

                        i = end

                        break
                    }
                }

                lineStack.push({
                    tag: {
                        type: "paragraph",
                        architype: "leaf-block",
                        content: ""
                    },
                    children: []
                })

                i--

                break
            }
            case SYMBOLS.EQUAL: {
                if (!isSetextHeadingPossible) {
                    lineStack.push({
                        tag: {
                            type: "paragraph",
                            architype: "leaf-block",
                            content: ""
                        },
                        children: []
                    })
                    i--
                    break
                }

                const setextParseResult = parseSettext(input, i, SYMBOLS.EQUAL)

                const stackContext = stack[stack.length - 1]

                if (setextParseResult && stackContext.tag.type === "paragraph") {
                    const content = stackContext.tag.content

                    const heading: Entity.Heading = {
                        architype: "leaf-block",
                        type: "heading",
                        content,
                        level: 1
                    }

                    stack[stack.length - 1] = {
                        tag: heading,
                        children: []
                    }

                    i = setextParseResult[1]
                } else {
                    lineStack.push({
                        tag: {
                            type: "paragraph",
                            architype: "leaf-block",
                            content: ""
                        },
                        children: []
                    })
                    i--
                }

                break
            }
            case SYMBOLS.MINUS: {
                //chech for hr
                if (isBlockContext) {
                    const hrParseResult = parseHr(input, i, SYMBOLS.MINUS)

                    if (hrParseResult) {
                        const [items, end] = hrParseResult

                        lineStack.push(...items)

                        i = end

                        break
                    }
                }

                if (input.length > i + 1 && input[i + 1] === " ") {
                    const [items, end] = parseUnorderedList(input, i, prevIndent)

                    lineStack.push(...items)

                    i = end
                } else {
                    lineStack.push({
                        tag: {
                            type: "paragraph",
                            architype: "leaf-block",
                            content: ""
                        },
                        children: []
                    })
                    i--
                }

                break
            }
            default: {
                const paragraph: Entity.Paragraph = {
                    architype: "leaf-block",
                    type: "paragraph",
                    content: char
                }

                lineStack.push({
                    tag: paragraph,
                    children: [],
                })
            }
        }

        if (!wasIndentSet) {
            prevIndent = 0
        }
    }

    return [lineStack, i + 1, listIndent] as const
}

export function parse(input: string) {
    const stack: StackItem[] = [{
        tag: {
            architype: "block",
            type: "document",
        },
        children: [],
    }]

    let cursor = 0
    let isLazyConPossible = false
    let isSetextHeadingPossible = false

    while (true) {
        const [line, endOfLine] = parseNewLine(input, cursor, stack, isLazyConPossible, isSetextHeadingPossible)

        console.log(JSON.stringify(line))

        let j

        for (j = 1; j < Math.min(stack.length, line.length); j++) {
            if (stack[j].tag.type !== line[j].tag.type || line[j].tag.architype === "leaf-block" || "nomerge" in line[j].tag) {
                break
            }
        }

        const lineBreakpoint = line[j]

        if (isLazyConPossible && lineBreakpoint && lineBreakpoint.tag.type === "paragraph") {
            let targetP: StackItem = stack[stack.length - 1]

            while (targetP.children.length > 0) {
                targetP = targetP.children[targetP.children.length - 1]
            }

            if (targetP.tag.type === "paragraph") {
                targetP.tag.content += " " + lineBreakpoint.tag.content
            }
        } else {
            for (let k = stack.length - 1; k >= j; k--) {
                stack[k - 1].children.push(stack[k])
                stack.pop()
            }

            for (let k = j; k < line.length; k++) {
                stack.push(line[k])
            }
        }

        cursor = endOfLine

        if (endOfLine > input.length - 1) break

        if (line.length > 0 && line[line.length - 1].tag.type === "paragraph") {
            isLazyConPossible = true
        } else {
            isLazyConPossible = false
        }

        if (line.length === 2 && line[line.length - 1].tag.type === "paragraph") {
            isSetextHeadingPossible = true
        } else {
            isSetextHeadingPossible = false
        }

    }

    for (let k = stack.length - 1; k > 0; k--) {
        stack[k - 1].children.push(stack[k])
        stack.pop()
    }

    return stack
}
