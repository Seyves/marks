import Entity from "./bin/definitions"

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

function processIndent(indent: number, stack: Stack, lineStack: Stack) {
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

        if (item.type !== "list") continue

        if (item.indent > remainingIndent) break

        newNodes.push({
            tag: {
                architype: "block",
                type: "list",
                indent: item.indent
            },
            children: []
        })

        newNodes.push({
            tag: {
                architype: "block",
                type: "list-item",
            },
            children: []
        })

        remainingIndent -= item.indent
    }

    if (remainingIndent >= 4) {
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

    return newNodes
}

export function parseNewLine(input: string, start: number, stack: Stack) {
    const lineStack: Stack = [{
        tag: {
            architype: "block",
            type: "document",
        },
        children: []
    }]

    const listIndent: number[] = []

    const docContext = stack[stack.length - 1]?.tag

    let i

    for (i = start; i < input.length; i++) {
        const context = lineStack[lineStack.length - 1]?.tag

        const char = input[i]

        if (char === "\n") {
            return [lineStack, i + 1, listIndent] as const
        }

        if (context && (context.type === "paragraph" || context.type === "indent-code-block" || context.type === "heading")) {
            context.content += char;
            continue;
        }

        switch (char) {
            //indent
            case "\t":
            case " ": {
                if (docContext && docContext.type === "code-block") {
                    break
                }

                if (!context || context.architype === "block") {
                    const [indent, endOfIndent] = countIndent(input, i)

                    i = endOfIndent - 1

                    lineStack.push(...processIndent(
                        indent,
                        stack,
                        lineStack,
                    ))
                }

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
            case "-": {
                if (input.length > i + 1 && input[i + 1] === " ") {
                    let j

                    for (j = i + 2; j < input.length; j++) {
                        if (input[j] !== " ") break
                    }

                    let indent: number

                    j -= i

                    if (j >= 6) {
                        indent = 2
                        i += 1
                    } else {
                        indent = j
                        i += j - 2
                    }

                    const list: Entity.List = {
                        architype: "block",
                        type: "list",
                        indent
                    }

                    const listItem: Entity.ListItem = {
                        architype: "block",
                        type: "list-item",
                        nomerge: true
                    }

                    lineStack.push({
                        tag: list,
                        children: []
                    })

                    lineStack.push({
                        tag: listItem,
                        children: []
                    })
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

    while (true) {
        const [line, endOfLine] = parseNewLine(input, cursor, stack)

        let j

        for (j = 1; j < Math.min(stack.length, line.length); j++) {
            if (stack[j].tag.type !== line[j].tag.type || line[j].tag.architype === "leaf-block" || "nomerge" in line[j].tag) {
                break
            }
        }

        for (let k = stack.length - 1; k >= j; k--) {
            stack[k - 1].children.push(stack[k])
            stack.pop()
        }

        for (let k = j; k < line.length; k++) {
            stack.push(line[k])
        }

        cursor = endOfLine

        if (endOfLine > input.length - 1) break
    }

    return stack
}
