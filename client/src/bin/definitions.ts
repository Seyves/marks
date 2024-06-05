namespace Definitions {
    export interface Document {
        type: "document"
        mergeable: false
        children: Definitions.Tag[]
    }

    export interface Paragraph {
        type: "paragraph"
        mergeable: false
        content: string
    }

    export interface Heading {
        type: "heading"
        mergeable: false
        level: number
        content: string
    }

    export interface IndentCodeBlock {
        type: "indent-code-block"
        mergeable: false
        content: string
    }

    export interface CodeBlock {
        type: "code-block"
        opening: boolean
        mergeable: false
        content: string
    }

    export interface Blockquote {
        type: "blockquote"
        mergeable: true
        children: Definitions.Tag[]
    }

    export interface List {
        type: "list"
        mergeable: true
        children: Definitions.Tag[]
    }

    export interface ListItem {
        type: "list-item"
        //because we can need to differentiate, is it new list item, or is it previous that continued by indenting
        mergeable: boolean
        indent: number
        children: Definitions.Tag[]
    }

    export interface ThematicBreak {
        type: "thematic-break"
        mergeable: false
    }

    export type LeafBlockTag = Paragraph | Heading | IndentCodeBlock | CodeBlock | ThematicBreak

    export type BlockTag = Blockquote | List | ListItem | Document

    export type Tag = LeafBlockTag | BlockTag

    export const BLOCKTYPES: Tag["type"][] = ["document", "list", "list-item", "blockquote"]
    export const CONTENTTYPES: Tag["type"][] = ["paragraph", "indent-code-block", "code-block", "heading"]
}

export function createDocument(): Definitions.Document {
    return {
        type: "document",
        mergeable: false,
        children: []
    }
}

export function createParagraph(content: string): Definitions.Paragraph {
    return {
        type: "paragraph",
        mergeable: false,
        content
    }
}

export function createHeading(level: number, content: string): Definitions.Heading {
    return {
        type: "heading",
        mergeable: false,
        level,
        content
    }
}

export function createIndentedCodeBlock(content: string): Definitions.IndentCodeBlock {
    return {
        type: "indent-code-block",
        mergeable: false,
        content
    }
}

export function createCodeBlock(content: string, opening: boolean = false): Definitions.CodeBlock {
    return {
        type: "code-block",
        mergeable: false,
        opening,
        content
    }
}

export function createBlockqoute(): Definitions.Blockquote {
    return {
        type: "blockquote",
        mergeable: true,
        children: []
    }
}

export function createList(): Definitions.List {
    return {
        type: "list",
        mergeable: true,
        children: []
    }
}

export function createListItem(indent: number, mergeable: boolean = false): Definitions.ListItem {
    return {
        type: "list-item",
        mergeable,
        indent,
        children: []
    }
}

export function createThematicBreak(): Definitions.ThematicBreak {
    return {
        type: "thematic-break",
        mergeable: false
    }
}

export default Definitions
