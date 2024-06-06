import React from "react"
import { SYMBOLS } from "./rules"

export interface MarkNode {
    mergeable: boolean
    toJSX: () => JSX.Element
}

export function isBlockNode(node: MarkNode) {
    return (
        node instanceof MarkDocument ||
        node instanceof Blockquote ||
        node instanceof List ||
        node instanceof ListItem
    )
}

export function isContentNode(node: MarkNode) {
    return (
        node instanceof Paragraph ||
        node instanceof CodeBlock ||
        node instanceof IndentedCodeBlock ||
        node instanceof Heading
    )
}

export abstract class ParentMarkNode implements MarkNode {
    constructor(mergeable: boolean) {
        this.children = []
        this.mergeable = mergeable
    }

    mergeable: boolean
    children: MarkNode[]

    toJSX() {
        return <div>Not implemented</div>
    }
}

export abstract class ContentMarkNode implements MarkNode {
    constructor(mergeable: boolean, content: string) {
        this.content = content
        this.mergeable = mergeable
    }

    content: string
    mergeable: boolean

    toJSX() {
        return <div>Not implemented</div>
    }
}

export class MarkDocument extends ParentMarkNode {
    constructor() {
        super(false)
    }

    toJSX() {
        return (
            <div>
                {this.children.map(node => node.toJSX())}
            </div >
        )
    }
}

export class Blockquote extends ParentMarkNode {
    constructor() {
        super(true)
    }

    toJSX() {
        return (
            <blockquote style={{ borderLeft: "3px white solid", margin: "0 0 0 10px" }}>
                {this.children.map(node => node.toJSX())}
            </blockquote>
        )
    }
}

export class List extends ParentMarkNode {
    constructor() {
        super(true)
    }

    toJSX() {
        return (
            <ul>
                {this.children.map(node => node.toJSX())}
            </ul>
        )
    }
}

export class ListItem extends ParentMarkNode {
    constructor(indent: number, mergeable: boolean = false) {
        super(mergeable)
        this.indent = indent
    }

    indent: number

    toJSX() {
        return (
            <li>
                {this.children.map(node => node.toJSX())}
            </li>
        )
    }
}

export class Paragraph extends ContentMarkNode {
    constructor(content: string = "") {
        super(false, content)
    }

    toJSX() {
        return <p>{this.content}</p>
    }
}

export class Heading extends ContentMarkNode {
    constructor(level: number, content: string = "") {
        super(false, content)
        this.level = level
    }

    level: number

    toJSX() {
        return React.createElement("h" + this.level, {}, this.content)
    }
}

export class IndentedCodeBlock extends ContentMarkNode {
    constructor(content: string = "") {
        super(false, content)
    }

    toJSX() {
        return (
            <pre>
                <code>
                    {this.content}
                </code>
            </pre>
        )
    }
}

export type CodeBlockSymbol = typeof SYMBOLS.BACKTICK | typeof SYMBOLS.TILDA

export class CodeBlock extends ContentMarkNode{
    constructor(symbol: CodeBlockSymbol, length: number, content: string = "", opening: boolean = false) {
        super(false, content)
        this.opening = opening
        this.symbol = symbol
        this.length = length
    }

    opening: boolean
    symbol: CodeBlockSymbol
    length: number

    toJSX() {
        return (
            <pre>
                <code>
                    {this.content}
                </code>
            </pre>
        )
    }
}

export class ThematicBreak implements MarkNode {
    constructor() {
        this.mergeable = false
    }

    mergeable: false

    toJSX() {
        return <hr />
    }
}
