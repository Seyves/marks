import * as Nodes from "./bin/definitions"
import { SYMBOLS, parseBlockquote, parseHeading, parseThematicBreak, parseSettext, parseUnorderedList, parseCodeBlockContinuation } from "./bin/rules"

class NodeStack {
    constructor() {
        this.arr = [new Nodes.MarkDocument()]
    }

    closeUntil(idx: number) {
        for (let i = this.arr.length - 1; i >= idx; i--) {
            const parent = this.arr[i - 1]

            if (!(parent instanceof Nodes.ParentMarkNode)) throw new Error("Attempt to close node with no children")

            parent.children.push(this.arr[i])

            this.arr.pop()
        }
    }

    findBreakpoint(anotherStack: NodeStack, ignoreMergeble: boolean = false) {
        let i

        for (i = 1; i < Math.min(this.length(), anotherStack.length()); i++) {
            if (
                this.get(i).constructor !== anotherStack.get(i).constructor ||
                (!ignoreMergeble && !anotherStack.get(i).mergeable)
            ) {
                break
            }
        }

        return i
    }

    find<K extends Nodes.MarkNode>(cl: new (...args: any) => K): K | undefined {
        return this.arr.find((node) => node instanceof cl) as K | undefined
    }

    length() {
        return this.arr.length
    }

    get(idx: number) {
        return this.arr[idx]
    }

    push(...nodes: Nodes.MarkNode[]) {
        this.arr.push(...nodes)
    }

    pop() {
        this.arr.pop()
    }

    context() {
        return this.arr[this.arr.length - 1]
    }

    arr: Nodes.MarkNode[]
}

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

function processIndent(
    indent: number,
    stack: NodeStack,
    lineStack: NodeStack,
    isLazyConPossible: boolean
) {
    let remainingIndent = indent

    const result: Nodes.MarkNode[] = []

    const point = stack.findBreakpoint(lineStack, true)

    if (point === lineStack.length()) {
        for (let i = point; i < stack.arr.length; i++) {
            const node = stack.get(i)

            if (node instanceof Nodes.List) continue

            if (!(node instanceof Nodes.ListItem)) break

            if (node.indent > remainingIndent) break

            result.push(new Nodes.List())
            result.push(new Nodes.ListItem(node.indent, true))

            remainingIndent -= node.indent
        }
    }

    if (!isLazyConPossible && remainingIndent >= 4) {
        result.push(new Nodes.IndentedCodeBlock(" ".repeat(remainingIndent - 4)))
    }

    return [result, remainingIndent] as const
}

export function parseNewLine(input: string, start: number, stack: NodeStack, isLazyConPossible: boolean, isSetextHeadingPossible: boolean) {
    const line = new NodeStack()

    let indentBefore = 0

    let i: number

    for (i = start; i < input.length; i++) {
        const stackContext = stack.context()

        if (
            stackContext instanceof Nodes.CodeBlock &&
            stack.length() === line.length() + 1
        ) {
            const point = stack.findBreakpoint(line, true)

            if (point === line.length()) {
                const [indent, indEnd] = countIndent(input, i)

                if (indent < 4) {
                    const [parsedNodes, end] = parseCodeBlockContinuation(
                        input,
                        indEnd,
                        stackContext.symbol,
                        stackContext.length
                    )
                    line.push(...parsedNodes)
                    i = end
                } else {
                    line.push(new Nodes.CodeBlock(
                        stackContext.symbol,
                        stackContext.length,
                        "",
                        false
                    ))
                }
            }
        }

        let wasIndentBeforeSet = false

        const context = line.context()

        const char = input[i]

        if (char === "\n") break

        if (context instanceof Nodes.ContentMarkNode) {
            if (context instanceof Nodes.CodeBlock) {
                if (!context.opening) context.content += char
            } else {
                context.content += char
            }

            continue;
        }

        console.log("Cycle, symbol ", char)

        const beforeSpace = input.length > i + 1 && input[i + 1] === " "

        let nodes: Nodes.MarkNode[] = []
        let end = i

        switch (char) {
            //indent
            case SYMBOLS.TAB:
            case SYMBOLS.SPACE: {
                if (stack.context() instanceof Nodes.CodeBlock) break

                const [indent, endOfIndent] = countIndent(input, i)

                if (Nodes.isBlockNode(context)) {
                    [nodes, indentBefore] = processIndent(indent, stack, line, isLazyConPossible)

                    wasIndentBeforeSet = true

                    console.log("Setting prev indent: ", indentBefore)

                    if (nodes.length === 0 && isLazyConPossible && indent >= 4) {
                        nodes = [new Nodes.Paragraph()]
                    }
                }

                end = endOfIndent - 1

                break
            }
            case SYMBOLS.TILDA: {
                let j: number

                for (j = i + 1; j < input.length; j++) {
                    if (input[j] !== SYMBOLS.TILDA) break
                }

                if (j - i > 2) {
                    nodes = [new Nodes.CodeBlock(SYMBOLS.TILDA, j - i, "", true)]
                    end = j - 1
                } else {
                    nodes = [new Nodes.Paragraph(char)]
                }
                break
            }
            case SYMBOLS.BACKTICK: {
                let j: number

                for (j = i + 1; j < input.length; j++) {
                    if (input[j] !== SYMBOLS.BACKTICK) break
                }

                if (j - i > 2) {
                    nodes = [new Nodes.CodeBlock(SYMBOLS.BACKTICK, j - i, "", true)]
                    end = j - 1
                } else {
                    nodes = [new Nodes.Paragraph(char)]
                }
                break
            }
            case SYMBOLS.HASH: {
                [nodes, end] = parseHeading(input, i)
                break
            }
            case SYMBOLS.GREATER: {
                [nodes, end] = parseBlockquote(input, i)

                if (beforeSpace) {
                    end++
                    break
                }

                break
            }
            case SYMBOLS.STAR:
                //chech for thematic break
                if (Nodes.isBlockNode(context)) {
                    const hrParseResult = parseThematicBreak(input, i, SYMBOLS.STAR)

                    if (hrParseResult) {
                        [nodes, end] = hrParseResult
                        break
                    }
                }

                //else we know it's probably list
                if (beforeSpace) {
                    [nodes, end] = parseUnorderedList(input, i, indentBefore)
                } else {
                    nodes = [new Nodes.Paragraph(char)]
                }

                break
            case SYMBOLS.UNDERSCORE: {
                //chech for hr
                if (Nodes.isBlockNode(context)) {
                    const hrParseResult = parseThematicBreak(input, i, SYMBOLS.UNDERSCORE)

                    if (hrParseResult) {
                        [nodes, end] = hrParseResult
                        break
                    }
                }

                nodes = [new Nodes.Paragraph(char)]
                break
            }
            case SYMBOLS.EQUAL: {
                if (!isSetextHeadingPossible) {
                    nodes = [new Nodes.Paragraph(char)]
                    break
                }

                const setextParseResult = parseSettext(input, i, SYMBOLS.EQUAL)

                if (setextParseResult && stackContext instanceof Nodes.Paragraph) {
                    const content = stackContext.content

                    stack.pop()

                    stack.push(new Nodes.Heading(1, content))

                    end = setextParseResult[1]
                } else {
                    nodes = [new Nodes.Paragraph(char)]
                }

                break
            }
            case SYMBOLS.MINUS: {
                //check for settext
                if (isSetextHeadingPossible) {
                    const setextParseResult = parseSettext(input, i, SYMBOLS.MINUS)

                    if (setextParseResult && stackContext instanceof Nodes.Paragraph) {
                        const content = stackContext.content

                        stack.pop()

                        stack.push(new Nodes.Heading(1, content))

                        end = setextParseResult[1]

                        break
                    }
                }
                //chech for hr
                if (Nodes.isBlockNode(context)) {
                    const hrParseResult = parseThematicBreak(input, i, SYMBOLS.MINUS)

                    if (hrParseResult) {
                        [nodes, end] = hrParseResult
                        break
                    }
                }
                //check for list
                if (beforeSpace) {
                    [nodes, end] = parseUnorderedList(input, i, indentBefore)
                } else {
                    nodes = [new Nodes.Paragraph(char)]
                }

                break
            }
            default: {
                nodes = [new Nodes.Paragraph(char)]
            }
        }

        line.push(...nodes)
        i = end

        if (!wasIndentBeforeSet) {
            indentBefore = 0
        }
    }

    return [line, i + 1] as const
}

export function parse(input: string) {
    const stack = new NodeStack()

    let cursor = 0

    let lazy = false
    let setext = false

    while (true) {
        const [line, endOfLine] = parseNewLine(input, cursor, stack, lazy, setext)

        console.log("result line", JSON.stringify(line))

        let j = stack.findBreakpoint(line)

        if (line.length() === j) {
            for (; j < stack.length(); j++) {
                if (!(stack.get(j) instanceof Nodes.List) && !(stack.get(j) instanceof Nodes.ListItem)) {
                    break
                }
            }
        }

        const lPoint = line.get(j)
        const sPoint = stack.get(j)

        //merging code blocks
        if (sPoint instanceof Nodes.CodeBlock && lPoint instanceof Nodes.CodeBlock) {
            sPoint.content += "\n" + lPoint.content
            sPoint.opening = false
            //merging indent code blocks
        } else if (sPoint instanceof Nodes.IndentedCodeBlock && !sPoint || sPoint instanceof Nodes.IndentedCodeBlock) {
            sPoint.content += "\n"

            if (lPoint instanceof Nodes.IndentedCodeBlock) {
                sPoint.content += lPoint.content
            }
            //merging lazy continuation
        } else if (lazy && lPoint instanceof Nodes.Paragraph) {
            let context = stack.context()

            while (context instanceof Nodes.ParentMarkNode && context.children.length > 0) {
                context = context.children[context.children.length - 1]
            }

            if (context instanceof Nodes.Paragraph) {
                context.content += " " + lPoint.content
            }
        } else {
            stack.closeUntil(j)

            stack.push(...line.arr.slice(j))
        }

        cursor = endOfLine

        if (endOfLine > input.length - 1) break

        const isLastItemParagraph = line.context() instanceof Nodes.Paragraph

        lazy = line.length() > 0 && isLastItemParagraph
        setext = line.length() === 2 && isLastItemParagraph
    }

    stack.closeUntil(1)

    return stack
}
