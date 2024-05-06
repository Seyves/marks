import React, { ReactNode } from "react"

interface Props {
    children: ReactNode
    level: number
    isMarksShown: boolean
}

export default function Heading({ children, isMarksShown, level }: Props) {
    return React.createElement(`h${level}`, {}, (
        isMarksShown && <span className="mark">{"#".repeat(level) + " "}
            {children}
        </span>
    ))
}
