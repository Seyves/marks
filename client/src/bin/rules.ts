import { NodeStack } from "../converter.ts"
import * as Nodes from "./definitions.tsx"

export const SYMBOLS = {
    SPACE: " ",
    TAB: "\t",
    NEWLINE: "\n",

    STAR: "*",
    HASH: "#",
    GREATER: ">",
    UNDERSCORE: "_",
    MINUS: "-",
    PLUS: "+",
    EQUAL: "=",
    BACKTICK: "`",
    TILDA: "~",
    ESCAPE: "\\",
} as const

type ParsedResult = [Nodes.MarkNode[], number]

export function parseHeading(input: string, start: number): ParsedResult {
    let i

    for (i = 1; i + start < input.length; i++) {
        if (input[start + i] !== SYMBOLS.HASH) break
    }

    const hashEnd = start + i

    if (i <= 6 && input.length > hashEnd) {
        if (input[hashEnd] === SYMBOLS.SPACE) {
            return [[new Nodes.Heading(i)], hashEnd]
        }
        if (input[hashEnd] === SYMBOLS.NEWLINE) {
            return [[new Nodes.Heading(i)], hashEnd - 1]
        }
    }

    return [[new Nodes.Paragraph()], start - 1]
}

export function parseBlockquote(_: string, start: number): ParsedResult {
    return [[new Nodes.Blockquote()], start]
}

export function parseCodeBlockContinuation(
    input: string,
    start: number,
    symbol: Nodes.CodeBlockSymbol,
    length: number
): ParsedResult {
    const nodes = [new Nodes.CodeBlock(symbol, length, "", false)]

    if (input.slice(start, start + length) !== symbol.repeat(length)) {
        return [nodes, start]
    }

    let isBroken = false

    for (let i = start + length; i < input.length; i++) {
        switch (input[i]) {
            case symbol:
                if (isBroken) return [nodes, start]
                break
            case SYMBOLS.TAB:
            case SYMBOLS.SPACE:
                isBroken = true
                break
            case SYMBOLS.NEWLINE:
                return [[], i]
            default:
                return [nodes, start]
        }
    }

    return [[], input.length]
}

export function parseUnorderedList(
    input: string,
    start: number,
    indentBefore: number
): ParsedResult {
    let i: number

    L: for (i = start + 1; i < input.length; i++) {
        switch (input[i]) {
            case SYMBOLS.NEWLINE: {
                return [[new Nodes.UnorderedList(), new Nodes.ListItem(2 + indentBefore)], i - 1]
            }
            case SYMBOLS.SPACE:
                continue
            default:
                break L
        }
    }

    const delta = i - start

    const indent = delta >= 6 ? 2 : delta

    return [
        [new Nodes.UnorderedList(), new Nodes.ListItem(indent + indentBefore)],
        start + indent - 1,
    ]
}

export function parseOrderedList(
    input: string,
    start: number,
    indentBefore: number,
    line: NodeStack,
    isLazyConPossible: boolean
): ParsedResult {
    let stringifiedStart = input[start]
    let delimiter: ")" | "." = ")"
    let j: number, k: number

    for (j = start + 1; j < input.length; j++) {
        const numeric = parseInt(input[j])

        if (input[j] === ")") {
            delimiter = ")"
            break
        }

        if (input[j] === ".") {
            delimiter = "."
            break
        }

        if (isNaN(numeric)) {
            return [[new Nodes.Paragraph()], start - 1]
        }

        if (j - start === 9) {
            return [[new Nodes.Paragraph()], start - 1]
        }

        stringifiedStart += input[j]
    }

    if (input.length <= j || input[j + 1] !== " ") {
        return [[new Nodes.Paragraph()], start - 1]
    }

    const num = parseInt(stringifiedStart)

    for (k = j + 1; k < input.length; k++) {
        if (input[k] !== " ") break
    }

    if (line.length() === 1 && isLazyConPossible && num !== 1) {
        return [[new Nodes.Paragraph()], start - 1]
    }

    const indentAfter = k - j

    let indent: number
    let end: number

    if (indentAfter >= 4) {
        indent = j - start + 2
        end = j
    } else {
        indent = j - start + indentAfter
        end = k - 2
    }

    return [
        [new Nodes.OrderedList(num, delimiter), new Nodes.ListItem(indent + indentBefore)],
        end + 1,
    ]
}

type ThematicBreakSymbol = typeof SYMBOLS.MINUS | typeof SYMBOLS.UNDERSCORE | typeof SYMBOLS.STAR

export function parseThematicBreak(
    input: string,
    start: number,
    symbol: ThematicBreakSymbol
): ParsedResult {
    let symbolCount = 1

    let i

    L: for (i = start + 1; i < input.length; i++) {
        switch (input[i]) {
            case symbol:
                symbolCount++
                break
            case " ":
            case "\t":
                continue
            case "\n":
                break L
            default:
                return [[], start]
        }
    }

    if (symbolCount < 3) return [[], start]

    return [[new Nodes.ThematicBreak()], i - 1]
}

type SettextSymbol = typeof SYMBOLS.MINUS | typeof SYMBOLS.EQUAL

export function parseSettext(
    input: string,
    start: number,
    symbol: SettextSymbol,
    content: string
): ParsedResult {
    let i: number,
        isBroken = false

    L: for (i = start + 1; i < input.length; i++) {
        switch (input[i]) {
            case symbol:
                if (isBroken) return [[], start]
                continue
            case " ":
            case "\t":
                isBroken = true
                continue
            case "\n":
                break L
            default:
                return [[], start]
        }
    }

    return [[new Nodes.Heading(1, content)], i - 1]
}
