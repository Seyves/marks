interface Props {
    hasClosing: boolean
    hasOpening: boolean
    isMarksShown: boolean
    children: React.ReactNode[]
}

export default function Italic({ children, hasClosing, hasOpening, isMarksShown }: Props) {
    return (
        <>
            {hasOpening && isMarksShown && <span className="mark">*</span>}
            <i>{children}</i>
            {hasClosing && isMarksShown && <span className="mark">*</span>}
        </>
    )
}
