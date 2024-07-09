import * as Nodes from "./bin/definitions"
import {
    SYMBOLS,
    parseBlockquote,
    parseHeading,
    parseThematicBreak,
    parseSettext,
    parseUnorderedList,
    parseCodeBlockContinuation,
    parseOrderedList,
} from "./bin/rules"

export class NodeStack {
    constructor() {
        this.arr = [new Nodes.MarkDocument()]
    }

    closeUntil(idx: number) {
        for (let i = this.arr.length - 1; i >= idx; i--) {
            const parent = this.arr[i - 1]

            if (!(parent instanceof Nodes.ParentMarkNode))
                throw new Error("Attempt to close node with no children")

            parent.children.push(this.arr[i])

            this.arr.pop()
        }
    }

    findBreak(anotherStack: NodeStack, ignoreMergeble: boolean = false) {
        let i

        for (i = 1; i < Math.min(this.length(), anotherStack.length()); i++) {
            const a = this.get(i)
            const b = anotherStack.get(i)

            if (
                a.constructor !== b.constructor ||
                (!ignoreMergeble && !b.mergeable) ||
                (a instanceof Nodes.OrderedList &&
                    b instanceof Nodes.OrderedList &&
                    a.delimiter !== b.delimiter)
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
    let indent = 0,
        i

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
): [Nodes.MarkNode[], number] {
    let remainingIndent = indent

    const result: Nodes.MarkNode[] = []

    const point = stack.findBreak(lineStack, true)

    if (point === lineStack.length()) {
        let listContext: Nodes.OrderedList | Nodes.UnorderedList | undefined

        for (let i = point; i < stack.arr.length; i++) {
            const node = stack.get(i)

            if (node instanceof Nodes.UnorderedList || node instanceof Nodes.OrderedList) {
                listContext = node
                continue
            }

            if (!(node instanceof Nodes.ListItem)) break

            if (node.indent > remainingIndent) break

            result.push(
                listContext instanceof Nodes.OrderedList
                    ? new Nodes.OrderedList(0, listContext.delimiter)
                    : new Nodes.UnorderedList()
            )
            result.push(new Nodes.ListItem(node.indent, true))

            remainingIndent -= node.indent
        }
    }

    if (remainingIndent >= 4) {
        if (isLazyConPossible) {
            return [[new Nodes.Paragraph()], 0]
        } else {
            result.push(new Nodes.IndentedCodeBlock(" ".repeat(remainingIndent - 4)))
        }
    }

    return [result, remainingIndent]
}

export function parseNewLine(
    input: string,
    start: number,
    stack: NodeStack,
    isLazyConPossible: boolean,
    isSetextHeadingPossible: boolean
) {
    const line = new NodeStack()

    let indentBefore = 0

    let i: number

    for (i = start; i < input.length; i++) {
        const stackContext = stack.context()

        if (stackContext instanceof Nodes.CodeBlock && stack.length() === line.length() + 1) {
            const point = stack.findBreak(line, true)

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
                    line.push(
                        new Nodes.CodeBlock(stackContext.symbol, stackContext.length, "", false)
                    )
                }
            }
        }

        let wasIndentBeforeSet = false

        const context = line.context()

        let char = input[i]

        if (char === "\n") break

        if (context instanceof Nodes.ContentMarkNode) {
            if (context instanceof Nodes.CodeBlock) {
                if (!context.opening) context.content += char
            } else {
                context.content += char
            }

            continue
        }

        if (char === SYMBOLS.ESCAPE) {
            line.push(new Nodes.Paragraph())
            continue
        }

        console.log("Cycle, symbol ", char)

        const beforeSpace = input.length > i + 1 && input[i + 1] === SYMBOLS.SPACE
        const beforeNewLine = input.length > i + 1 && input[i + 1] === SYMBOLS.NEWLINE

        let nodes: Nodes.MarkNode[] = []
        let end = i

        if (!isNaN(parseInt(char))) {
            const [newNodes, end] = parseOrderedList(
                input,
                i,
                indentBefore,
                line,
                isLazyConPossible
            )

            line.push(...newNodes)
            i = end
            if (!wasIndentBeforeSet) {
                indentBefore = 0
            }
            continue
        }

        switch (char) {
            //indent
            case SYMBOLS.TAB:
            case SYMBOLS.SPACE: {
                const [indent, endOfIndent] = countIndent(input, i)

                if (context instanceof Nodes.ParentMarkNode) {
                    ;[nodes, indentBefore] = processIndent(indent, stack, line, isLazyConPossible)

                    wasIndentBeforeSet = true

                    console.log("Setting prev indent: ", indentBefore)
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
                ;[nodes, end] = parseHeading(input, i)
                break
            }
            case SYMBOLS.GREATER: {
                ;[nodes, end] = parseBlockquote(input, i)

                if (beforeSpace) {
                    end++
                    break
                }

                break
            }
            case SYMBOLS.STAR:
                //chech for thematic break
                if (context instanceof Nodes.ParentMarkNode) {
                    ;[nodes, end] = parseThematicBreak(input, i, SYMBOLS.STAR)

                    if (nodes.length > 0) break
                }

                //else we know it's probably list
                if (beforeSpace || beforeNewLine) {
                    ;[nodes, end] = parseUnorderedList(input, i, indentBefore)
                } else {
                    nodes = [new Nodes.Paragraph(char)]
                }

                break
            case SYMBOLS.UNDERSCORE: {
                //chech for hr
                if (context instanceof Nodes.ParentMarkNode) {
                    ;[nodes, end] = parseThematicBreak(input, i, SYMBOLS.UNDERSCORE)

                    if (nodes.length > 0) break
                }

                nodes = [new Nodes.Paragraph(char)]
                break
            }
            case SYMBOLS.EQUAL: {
                if (!isSetextHeadingPossible) {
                    nodes = [new Nodes.Paragraph(char)]
                    break
                }

                if (stackContext instanceof Nodes.Paragraph) {
                    const [parsingResult, j] = parseSettext(
                        input,
                        i,
                        SYMBOLS.EQUAL,
                        stackContext.content
                    )

                    if (parsingResult.length > 0) {
                        stack.pop()
                        stack.push(...parsingResult)
                        end = j
                        break
                    }
                }

                nodes = [new Nodes.Paragraph(char)]

                break
            }
            case SYMBOLS.MINUS: {
                //check for settext
                if (isSetextHeadingPossible && stackContext instanceof Nodes.Paragraph) {
                    const [parsingResult, j] = parseSettext(
                        input,
                        i,
                        SYMBOLS.MINUS,
                        stackContext.content
                    )

                    if (parsingResult.length > 0) {
                        stack.pop()
                        stack.push(...parsingResult)
                        end = j
                        break
                    }
                }
                //chech for hr
                if (context instanceof Nodes.ParentMarkNode) {
                    ;[nodes, end] = parseThematicBreak(input, i, SYMBOLS.MINUS)

                    if (nodes.length > 0) break
                }
                //check for list
                if (beforeSpace || beforeNewLine) {
                    ;[nodes, end] = parseUnorderedList(input, i, indentBefore)
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

        let j = stack.findBreak(line)

        if (line.length() === j) {
            for (; j < stack.length(); j++) {
                if (
                    !(stack.get(j) instanceof Nodes.UnorderedList) &&
                    !(stack.get(j) instanceof Nodes.OrderedList) &&
                    !(stack.get(j) instanceof Nodes.ListItem)
                ) {
                    break
                }
            }
        }

        const lineBreak = line.get(j)
        const stackBreak = stack.get(j)

        //merging code blocks
        if (
            stackBreak instanceof Nodes.CodeBlock &&
            (!lineBreak || lineBreak instanceof Nodes.CodeBlock)
        ) {
            stackBreak.content += "\n"
            if (lineBreak) {
                stackBreak.content += lineBreak.content
            }
            stackBreak.opening = false
            //merging indent code blocks
        } else if (
            stackBreak instanceof Nodes.IndentedCodeBlock &&
            (!lineBreak || lineBreak instanceof Nodes.IndentedCodeBlock)
        ) {
            stackBreak.content += "\n"

            if (lineBreak instanceof Nodes.IndentedCodeBlock) {
                stackBreak.content += lineBreak.content
            }
            //merging lazy continuation
        } else if (lazy && lineBreak instanceof Nodes.Paragraph) {
            let context = stack.context()

            while (context instanceof Nodes.ParentMarkNode && context.children.length > 0) {
                context = context.children[context.children.length - 1]
            }

            if (context instanceof Nodes.Paragraph) {
                context.content += " " + lineBreak.content
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

    const doc = stack.get(0)

    if (doc instanceof Nodes.MarkDocument) {
        trim(doc)
    }

    return stack
}

function trim(head: Nodes.ParentMarkNode) {
    for (const child of head.children) {
        if (child instanceof Nodes.ParentMarkNode) {
            trim(child)
            continue
        }

        if (child instanceof Nodes.Paragraph) {
            child.content = child.content.trim()
            continue
        }

        if (child instanceof Nodes.Heading) {
            child.content = child.content.trim()

            for (let i = child.content.length - 1; i >= 0; i--) {
                if (i === 0) {
                    child.content = ""
                }

                if (child.content[i] === SYMBOLS.HASH) continue

                if (child.content[i] === SYMBOLS.ESCAPE) {
                    child.content =
                        child.content.slice(0, i) + child.content.slice(i + 1, child.content.length)
                    break
                }

                child.content = child.content.slice(0, i + 1).trim()
                break
            }
        }
    }
}
