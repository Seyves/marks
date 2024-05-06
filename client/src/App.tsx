import { useState } from 'react'
import './App.css'
import Bold from './mark-components/Bold'
import Italic from './mark-components/Italic'
import Heading from './mark-components/Heading'
import Quote from './mark-components/Quote'
import { atxHeading, indentCodeBlock } from './bin/rules'
import { parse } from './converter'

// function buildCompTree(root: MarkNode) {
//     switch (root.kind) {
//         case "bold": {
//             return (
//                 <Bold hasClosing={!root.unclosed} hasOpening={!root.unopened} isMarksShown={true}>
//                     {root.children.map((s) => buildCompTree(s))}
//                 </Bold>
//             )
//         }
//
//         case "quote": {
//             return (
//                 <Quote isContinued={root.isContunue} isMarksShown={true} level={root.level}>
//                     {root.children.map((s) => buildCompTree(s))}
//                 </Quote>
//             )
//         }
//
//         case "heading": {
//             return (
//                 <Heading level={root.level} isMarksShown={true}>
//                     {root.children.map((s) => buildCompTree(s))}
//                 </Heading>
//             )
//         }
//
//         case "italic": {
//             return (
//                 <Italic hasClosing={!root.unclosed} hasOpening={!root.unopened} isMarksShown={true}>
//                     {root.children.map((s) => buildCompTree(s))}
//                 </Italic>
//             )
//         }
//
//         case "paragraph": {
//             return (
//                 <p>
//                     {root.children.map((s) => buildCompTree(s))}
//                 </p>
//             )
//         }
//
//         default: {
//             return <span>
//                 {root.content}
//             </span>
//         }
//     }
// }

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
        </div>
    )
}

export default App
