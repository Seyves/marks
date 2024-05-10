interface Props {
    children: React.ReactNode[]
}

export function Blockquote({ children }: Props) {
    return (
        <blockquote style={{borderLeft: "3px white solid", margin: "0 0 0 10px"}}>
            {children}
        </blockquote>
    )
}

export function UnorderedList({ children }: Props) {
    return (
        <ul>
            {children}
        </ul>
    )
}

export function ListItem({children}: Props) {
    return (
        <li>
            {children}
        </li>
    )
}
