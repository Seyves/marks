import React from "react"

interface Props {
    children: React.ReactNode[]
}

export function Code({ children }: Props) {
    return (
        <pre>
            <code>
                {children}
            </code>
        </pre>
    )
}

export function Paragraph({ children }: Props) {
    return (
        <p>
            {children}
        </p>
    )
}

export function Heading({ children, level }: Props & {level: number}) {
    const elem = React.createElement("h" + level, {}, children)

    return elem
}
