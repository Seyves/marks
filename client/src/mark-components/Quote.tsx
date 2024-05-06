interface Props {
    isContinued: boolean
    level: number
    isMarksShown: boolean
    children: React.ReactNode[]
}

export default function Quote({ children, isContinued, isMarksShown, level }: Props) {
    return (
        <div style={{background: "red", paddingLeft: 10 * level + "px"}}>
            {!isContinued && isMarksShown && <span className="mark">{'>'.repeat(level)}</span>}
            <span>{children}</span>
        </div>
    )
}
