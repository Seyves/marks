import { Stack } from "../converter"
import Entity from "./definitions"

export const SYMBOLS = {
    SPACE: " ",
    TAB: "\t",
    NEWLINE: "\n",

    STAR: "*",
    UNDERSCORE: "_",
    MINUS: "-",
    PLUS: "+",
    EQUAL: "=",
} as const

type ParseResult = [Stack, number]

export function parseUnorderedList(input: string, start: number, indentBefore: number): ParseResult {
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

    const list: Entity.List = {
        architype: "block",
        type: "list",
    }

    const listItem: Entity.ListItem = {
        architype: "block",
        type: "list-item",
        nomerge: true,
        indent: indent + indentBefore
    }

    const items: Stack = [
        { tag: list, children: [] },
        { tag: listItem, children: [] },
    ]

    return [items, end+1] as const
}

type ThematicBreakSymbol = typeof SYMBOLS.MINUS | typeof SYMBOLS.UNDERSCORE | typeof SYMBOLS.STAR

export function parseHr(
    input: string,
    start: number,
    symbol: ThematicBreakSymbol
): ParseResult | null {
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

    return [[{
        tag: {
            type: "hr",
            nomerge: true,
            architype: "leaf-block"
        },
        children: []
    }], i - 1]
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
