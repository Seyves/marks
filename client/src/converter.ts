import Definitions, {
    createBlockqoute,
    createCodeBlock,
    createDocument,
    createHeading,
    createIndentedCodeBlock,
    createList,
    createListItem,
    createParagraph,
} from "./bin/definitions"
import { SYMBOLS, parseBlockquote, parseHeading, parseThematicBreak, parseSettext, parseUnorderedList, parseCodeBlockEnd } from "./bin/rules"

export type Stack = Definitions.Tag[]

class NodeStack {
    constructor() {
        this.arr = [createDocument()]
    }

    closeUntil(idx: number) {
        for (let i = this.arr.length - 1; i >= idx; i--) {
            const parent = this.arr[i - 1]

            if (!("children" in parent)) throw new Error("Attempt to close node with no children")

            parent.children.push(this.arr[i])

            this.arr.pop()
        }
    }

    findBreakpoint(anotherStack: NodeStack, ignoreMergeble: boolean = false) {
        let i

        for (i = 1; i < Math.min(this.length(), anotherStack.length()); i++) {
            if (
                this.get(i).type !== anotherStack.get(i).type ||
                (!ignoreMergeble && !anotherStack.get(i).mergeable)
            ) {
                break
            }
        }

        if (anotherStack.length() === i) {
            for (; i < this.length(); i++) {
                if (this.get(i).type !== "list" && this.get(i).type !== "list-item") {
                    break
                }
            }
        }

        return i
    }

    length() {
        return this.arr.length
    }

    get(idx: number) {
        return this.arr[idx]
    }

    push(...nodes: Definitions.Tag[]) {
        this.arr.push(...nodes)
    }

    pop() {
        this.arr.pop()
    }

    context() {
        return this.arr[this.arr.length - 1]
    }

    arr: Definitions.Tag[]
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

    const nodes: Stack = []

    for (let i = 0; i < stack.arr.length; i++) {
        const stackTag = stack.get(i)
        const lineTag = lineStack.get(i)

        if (lineTag) {
            if (stackTag.type !== lineTag.type) {
                break
            }
            continue
        }

        if (stackTag.type !== "list-item") continue

        if (stackTag.indent > remainingIndent) break

        nodes.push(createList())
        nodes.push(createListItem(stackTag.indent, true))

        remainingIndent -= stackTag.indent
    }

    if (!isLazyConPossible && remainingIndent >= 4) {
        nodes.push(createIndentedCodeBlock(" ".repeat(remainingIndent - 4)))
    }

    return [nodes, remainingIndent] as const
}

export function parseNewLine(input: string, start: number, stack: NodeStack, isLazyConPossible: boolean, isSetextHeadingPossible: boolean) {
    const line = new NodeStack()

    let prevIndent = 0
    const listIndent: number[] = []

    let i: number

    for (i = start; i < input.length; i++) {
        //checking for opened code block
        if (
            stack.context().type === "code-block" &&
            stack.length() === line.length() + 1
        ) {
            const point = stack.findBreakpoint(line, true)

            if (point === line.length()) {
                const [indent, indEnd] = countIndent(input, i)

                //checking if we closing code block
                if (indent < 4) {
                    const [isEndOfCodeBlock, end] = parseCodeBlockEnd(input, indEnd)

                    if (isEndOfCodeBlock) {
                        i = end
                    } else {
                        line.push(createCodeBlock(""))
                    }
                } else {
                    //else content is a part of the code block
                    line.push(createCodeBlock(""))
                }
            }
        }

        const context = line.context()

        let wasIndentSet = false

        const isBlockContext = !context || Definitions.BLOCKTYPES.includes(context.type)

        const char = input[i]

        if (char === "\n") break

        if (context && Definitions.CONTENTTYPES.includes(context.type)) {
            if (!context.opening) context.content += char;
            continue;
        }

        console.log("Cycle, symbol ", char)

        const beforeSpace = input.length > i + 1 && input[i + 1] === " "

        let nodes: Stack = []
        let end = i

        switch (char) {
            //indent
            case SYMBOLS.TAB:
            case SYMBOLS.SPACE: {
                if (stack.context() && stack.context().type === "code-block") {
                    break
                }

                const [indent, endOfIndent] = countIndent(input, i)

                if (isBlockContext) {
                    const processed = processIndent(indent, stack, line, isLazyConPossible)

                    prevIndent = processed[1]
                    wasIndentSet = true

                    console.log("Setting prev indent: ", prevIndent)

                    if (processed[0].length > 0) {
                        nodes = processed[0]
                    } else if (isLazyConPossible && indent >= 4) {
                        nodes = [createParagraph("")]
                    }
                }

                end = endOfIndent - 1

                break
            }
            case SYMBOLS.BACKTICK: {
                if (input.length > i + 2 && input.slice(i, i + 3) === SYMBOLS.BACKTICK.repeat(3)) {
                    nodes = [createCodeBlock("", true)]
                    end = i + 2
                } else {
                    nodes = [createParagraph(char)]
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
                if (isBlockContext) {
                    const hrParseResult = parseThematicBreak(input, i, SYMBOLS.STAR)

                    if (hrParseResult) {
                        [nodes, end] = hrParseResult
                        break
                    }
                }

                //else we know it's probably list
                if (beforeSpace) {
                    [nodes, end] = parseUnorderedList(input, i, prevIndent)
                } else {
                    nodes = [createParagraph(char)]
                }

                break
            case SYMBOLS.UNDERSCORE: {
                //chech for hr
                if (isBlockContext) {
                    const hrParseResult = parseThematicBreak(input, i, SYMBOLS.UNDERSCORE)

                    if (hrParseResult) {
                        [nodes, end] = hrParseResult
                        break
                    }
                }

                nodes = [createParagraph(char)]
                break
            }
            case SYMBOLS.EQUAL: {
                if (!isSetextHeadingPossible) {
                    nodes = [createParagraph(char)]
                    break
                }

                const setextParseResult = parseSettext(input, i, SYMBOLS.EQUAL)

                const sContext = stack.context()

                if (setextParseResult && sContext.type === "paragraph") {
                    const content = sContext.content

                    stack.pop()

                    stack.push(createHeading(1, content))

                    end = setextParseResult[1]
                } else {
                    nodes = [createParagraph(char)]
                }

                break
            }
            case SYMBOLS.MINUS: {
                //chech for hr
                if (isBlockContext) {
                    const hrParseResult = parseThematicBreak(input, i, SYMBOLS.MINUS)

                    if (hrParseResult) {
                        [nodes, end] = hrParseResult
                        break
                    }
                }

                if (beforeSpace) {
                    [nodes, end] = parseUnorderedList(input, i, prevIndent)
                } else {
                    nodes = [createParagraph(char)]
                }

                break
            }
            default: {
                nodes = [createParagraph(char)]
            }
        }

        line.push(...nodes)
        i = end

        if (!wasIndentSet) {
            prevIndent = 0
        }
    }

    return [line, i + 1, listIndent] as const
}

export function parse(input: string) {
    const stack = new NodeStack()

    let cursor = 0

    let lazy = false
    let setext = false

    while (true) {
        const [line, endOfLine] = parseNewLine(input, cursor, stack, lazy, setext)

        console.log("result line", JSON.stringify(line))

        const j = stack.findBreakpoint(line)

        // let j
        //
        // for (j = 1; j < Math.min(stack.length(), line.length()); j++) {
        //     if (stack.get(j).type !== line.get(j).type || !line.get(j).mergeable) {
        //         break
        //     }
        // }
        //
        // if (line.length() === j) {
        //     for (; j < stack.length(); j++) {
        //         if (stack.get(j).type !== "list" && stack.get(j).type !== "list-item") {
        //             break
        //         }
        //     }
        // }

        const breakpoint = line.get(j)
        const stackBreakpoint = stack.get(j)

        if (stackBreakpoint?.type === "code-block" && breakpoint && breakpoint.type === "code-block") {
            stackBreakpoint.content += "\n" + breakpoint.content
            stackBreakpoint.opening = false
        }
        else if (stackBreakpoint?.type === "indent-code-block" && (!breakpoint || breakpoint.type === "indent-code-block")) {
            stackBreakpoint.content += "\n"

            if (breakpoint && breakpoint.type === "indent-code-block") {
                stackBreakpoint.content += breakpoint.content
            }
        } else if (lazy && breakpoint && breakpoint.type === "paragraph") {
            let context = stack.context()

            while ("children" in context && context.children.length > 0) {
                context = context.children[context.children.length - 1]
            }

            if (context.type === "paragraph") {
                context.content += " " + breakpoint.content
            }
        } else {
            stack.closeUntil(j)

            stack.push(...line.arr.slice(j))
        }

        cursor = endOfLine

        if (endOfLine > input.length - 1) break

        const isLastItemParagraph = line.context().type === "paragraph"

        lazy = line.length() > 0 && isLastItemParagraph
        setext = line.length() === 2 && isLastItemParagraph
    }

    stack.closeUntil(1)

    return stack
}
