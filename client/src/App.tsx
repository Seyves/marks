import { useState } from 'react'
import './App.css'
import { parse } from './converter'

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
            {parsed.get(0).toJSX()}
        </div>
    )
}

export default App
