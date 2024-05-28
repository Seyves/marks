import { useState } from 'react'
import './App.css'
import { StackItem, parse } from './converter'
import { Code, Heading, Hr, Paragraph } from './mark-components/LeafBlocks'
import { Blockquote, ListItem, UnorderedList } from './mark-components/Blocks'

function buildCompTree(root: StackItem) {
    switch (root.tag.type) {
        case "hr": {
            return (
                <Hr/>
            )
        }

        case "indent-code-block": {
            return (
                <Code>
                    {root.tag.content}
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
                    {root.tag.content}
                </Paragraph>
            )
        }

        case "heading": {
            return (
                <Heading level={root.tag.level}>
                    {root.tag.content}
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
            {parsed[0] && buildCompTree(parsed[0])}
        </div>
    )
}

export default App
