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
} as const

type ParsedResult = [Nodes.MarkNode[], number]
type BoolParsedResult = [boolean, number]

export function parseHeading(input: string, start: number): ParsedResult {
    let hashEndDelta

    for (hashEndDelta = 1; hashEndDelta + start < input.length; hashEndDelta++) {
        if (input[start + hashEndDelta] !== SYMBOLS.HASH) break
    }

    const hashEnd = start + hashEndDelta

    if (hashEndDelta <= 6 && input.length > hashEnd && input[hashEnd] === " ") {
        return [[new Nodes.Heading(hashEndDelta)], hashEnd]
    }

    return [[new Nodes.Paragraph()], start - 1]
}

export function parseBlockquote(input: string, start: number): ParsedResult {
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

export function parseUnorderedList(input: string, start: number, indentBefore: number): ParsedResult {
    let indentToMerge

    for (indentToMerge = start + 2; indentToMerge < input.length; indentToMerge++) {
        if (input[indentToMerge] !== " ") break
    }

    indentToMerge -= start

    let indent: number
    let end: number

    if (indentToMerge >= 6) {
        indent = 2
        end = start + 1
    } else {
        indent = indentToMerge
        end = start + indentToMerge - 2
    }

    return [
        [new Nodes.List(), new Nodes.ListItem(indent + indentBefore)],
        end + 1,
    ]
}

type ThematicBreakSymbol = typeof SYMBOLS.MINUS | typeof SYMBOLS.UNDERSCORE | typeof SYMBOLS.STAR

export function parseThematicBreak(
    input: string,
    start: number,
    symbol: ThematicBreakSymbol
): ParsedResult | null {
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
                return null
        }
    }

    if (symbolCount < 3) return null

    return [[new Nodes.ThematicBreak()], i - 1]
}

type SettextSymbol = typeof SYMBOLS.MINUS | typeof SYMBOLS.EQUAL

export function parseSettext(
    input: string,
    start: number,
    symbol: SettextSymbol
): [true, number] | false {
    let i
    let isBroken = false

    L: for (i = start + 1; i < input.length; i++) {
        switch (input[i]) {
            case symbol:
                if (isBroken) return false
                continue
            case " ":
            case "\t":
                isBroken = true
                continue
            case "\n":
                break L
            default:
                return false
        }
    }

    return [true, i]
}
