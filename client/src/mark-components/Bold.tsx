interface Props {
    hasClosing: boolean
    hasOpening: boolean
    isMarksShown: boolean
    children: React.ReactNode[]
}

export default function Bold({ children, hasClosing, hasOpening, isMarksShown }: Props) {
    return (
        <>
            {hasOpening && isMarksShown && <span className="mark">**</span>}
            <strong>{children}</strong>
            {hasClosing && isMarksShown && <span className="mark">**</span>}
        </>
    )
}
