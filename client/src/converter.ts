import Entity from "./bin/definitions"

interface StackItem {
    tag: Entity.Tag
    children: StackItem[]
}

export function parse(input: string) {
    let buffer = ""
    let isLineStart = true
    let indentCount = 0

    const listIndent: number[] = []

    const stack: StackItem[] = [{
        tag: {
            architype: "block",
            type: "document",
        },
        children: [],
    }]

    let lineStack: StackItem[] = [{
        tag: {
            architype: "block",
            type: "document",
        },
        children: []
    }]

    for (let i = 0; i < input.length; i++) {
        const context = lineStack[lineStack.length - 1]?.tag

        const char = input[i]

        if (context && context.type === "indent-code-block") {
            if (char !== "\n") {
                context.content += char
                continue
            }
        }

        switch (char) {
            case ">": {
                if (context && context.type === "paragraph") {
                    context.content += char
                    break
                }

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
                    const listItem: Entity.ListItem = {
                        architype: "block",
                        type: "list-item"
                    }

                    lineStack.push({
                        tag: listItem,
                        children: []
                    })

                    let j 

                    for (j = i + 2; j < input.length && j < i + 6; j++) {
                        if (input[j] !== " ") break
                    }

                    if (j === 6) {
                        listIndent.push(2)
                        i += 1
                    } else {
                        listIndent.push(j)
                        i += j - 2
                    }

                    console.log(listIndent)
                } else {
                    buffer += char
                }

                break
            }
            case " ": {
                if (context && context.type === "paragraph") {
                    context.content += char
                    break
                }

                indentCount++

                if (indentCount === 4) {
                    const indentCodeBlock: Entity.IndentCodeBlock = {
                        architype: "leaf-block",
                        type: "indent-code-block",
                        content: ""
                    }

                    lineStack.push({
                        tag: indentCodeBlock,
                        children: []
                    })

                    indentCount = 0
                }

                break
            }
            case "\t": {
                if (context && context.type === "paragraph") {
                    context.content += char
                    break
                }

                const indentCodeBlock: Entity.IndentCodeBlock = {
                    architype: "leaf-block",
                    type: "indent-code-block",
                    content: ""
                }

                lineStack.push({
                    tag: indentCodeBlock,
                    children: []
                })

                indentCount = 0

                break
            }
            case "\n": {
                indentCount = 0

                let j

                for (j = 1; j < Math.min(stack.length, lineStack.length); j++) {
                    if (stack[j].tag.type !== lineStack[j].tag.type || lineStack[j].tag.architype === "leaf-block") {
                        break
                    }
                }

                for (let k = stack.length - 1; k >= j; k--) {
                    stack[k - 1].children.push(stack[k])
                    stack.pop()
                }

                for (let k = j; k < lineStack.length; k++) {
                    stack.push(lineStack[k])
                }

                lineStack = [{
                    tag: {
                        architype: "block",
                        type: "document",
                    },
                    children: []
                }]

                break
            }
            default: {
                if (context && context.type === "paragraph") {
                    context.content += char
                } else {
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

        if (char === "\n") {
            isLineStart = true
        } else {
            isLineStart = false
        }

        if (char !== " ") {
            indentCount = 0
        }
    }


    console.log(stack)
}
