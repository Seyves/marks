namespace Entity {
    export interface Document {
        architype: "block"
        type: "document"
    }

    export interface Paragraph {
        architype: "leaf-block"
        type: "paragraph"
        content: string
    }

    export interface Heading {
        architype: "leaf-block"
        type: "heading"
        level: number
        content: string
    }

    export interface IndentCodeBlock {
        architype: "leaf-block"
        type: "indent-code-block"
        content: string
    }

    export interface CodeBlock {
        architype: "leaf-block"
        type: "code-block"
        content: string
    }

    export interface Blockquote {
        architype: "block"
        type: "blockquote"
    }

    export interface List {
        architype: "block"
        type: "list"
        indent: number
    }

    export interface ListItem {
        nomerge?: boolean
        architype: "block"
        type: "list-item"
    }

    export type LeafBlockTag = Paragraph | Heading | IndentCodeBlock | CodeBlock

    export type BlockTag = Blockquote | List | ListItem | Document

    export type Tag = LeafBlockTag | BlockTag
}

export default Entity
