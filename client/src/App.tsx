import { useState } from 'react'
import './App.css'
import { parse } from './converter'
import { Code, Heading, Hr, Paragraph } from './mark-components/LeafBlocks'
import { Blockquote, ListItem, UnorderedList } from './mark-components/Blocks'
import Definitions from './bin/definitions'

function buildCompTree(root: Definitions.Tag) {
    switch (root.type) {
        case "thematic-break": {
            return (
                <Hr/>
            )
        }

        case "code-block": {
            return (
                <Code>
                    {root.content}
                </Code>
            )
        }

        case "indent-code-block": {
            return (
                <Code>
                    {root.content}
                </Code>
            )
        }

        case "blockquote": {
            return (
                <Blockquote>
                    {root.children.map((s) => buildCompTree(s))}
                </Blockquote>
            )
        }

        case "list": {
            return (
                <UnorderedList>
                    {root.children.map((s) => buildCompTree(s))}
                </UnorderedList>
            )
        }

        case "list-item": {
            return (
                <ListItem>
                    {root.children.map((s) => buildCompTree(s))}
                </ListItem>
            )
        }

        case "paragraph": {
            return (
                <Paragraph>
                    {root.content}
                </Paragraph>
            )
        }

        case "heading": {
            return (
                <Heading level={root.level}>
                    {root.content}
                </Heading>
            )
        }

        case "document": {
            return (
                <div>
                    {root.children.map((s) => buildCompTree(s))}
                </div>
            )
        }
    }
}

function App() {
    const [text, setText] = useState("")

    const parsed = parse(text)

    return (
        <div>
            <textarea
            id=""
                name=""
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
            ></textarea>
            {parsed.get(0) && buildCompTree(parsed.get(0))}
        </div>
    )
}

export default App
