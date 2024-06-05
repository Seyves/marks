import { Stack } from "../converter"
import {
    createBlockqoute,
    createHeading,
    createList,
    createListItem,
    createParagraph,
    createThematicBreak,
} from "./definitions"

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
} as const

type ParsedResult = [Stack, number]
type BoolParsedResult = [boolean, number]

export function parseHeading(input: string, start: number): ParsedResult {
    let hashEndDelta

    for (hashEndDelta = 1; hashEndDelta + start < input.length; hashEndDelta++) {
        if (input[start + hashEndDelta] !== SYMBOLS.HASH) break
    }

    const hashEnd = start + hashEndDelta

    if (hashEndDelta <= 6 && input.length > hashEnd && input[hashEnd] === " ") {
        return [[createHeading(hashEndDelta, "")], hashEnd]
    }

    return [[createParagraph("")], start - 1]
}

export function parseBlockquote(input: string, start: number): ParsedResult {
    return [[createBlockqoute()], start]
}

export function parseCodeBlockEnd(input: string, start: number): BoolParsedResult {
    if (input.length < start + 2) return [false, start]

    if (input.slice(start, start + 3) !== SYMBOLS.BACKTICK.repeat(3)) return [false, start]

    for (let i = start + 3; i < input.length; i++) {
        switch (input[i]) {
            case SYMBOLS.TAB:
            case SYMBOLS.SPACE:
                break
            case SYMBOLS.NEWLINE:
                return [true, i]
            default:
                return [false, start]
        }
    }

    return [false, start]
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
        [createList(), createListItem(indent + indentBefore)],
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

    return [[createThematicBreak()], i - 1]
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
