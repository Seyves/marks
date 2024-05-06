function skipSpaces(input: string, start: number) {
    for (let i = start; i < input.length; i++) {
        let char = input[i]

        if (char !== " ") return i
    }

    return input.length - 1
}

function block(input: string, start: number) {

}

function leafBlock(input: string, start: number) {

}

// export function quote(input: string, start: number) {
//     
// }

export function thematicBreak(input: string, start: number) {
    let targetChar

    let count = 0

    for (let i = start; i < input.length; i++) {
        const char = input[i]
        
        switch (char) {
            case "*":
            case "-":
            case "_": {
                if (!targetChar) {
                    targetChar = char
                    count++
                } else if (targetChar === char){
                    count++
                } else {
                    return start
                }

                break
            }
            case " ":
            case "\t": {
                continue
            }
            case "\n": {
                if (count >= 3) {
                    return i
                }
                return start
            }
            default: {
                return start
            }
        }
    }

    return start
}

export function list(input: string, start: number) {

}

export function atxHeading(input: string, start: number) {
    const unspacedStart = skipSpaces(input, start)

    let i

    for (i = unspacedStart; i < input.length; i++) {
        if (input[i] !== "#") break
    }

    if (unspacedStart === i) return start

    for (let j = i; j < input.length; j++) {
        if (input[j] === "\n") return j
    }

    return input.length
}

export function indentCodeBlock(input: string, start: number) {
    let indentCount = 0
    let endBound = start

    for (let i = start; i < input.length; i++) {
        const char = input[i]

        switch (char) {
            case "\n": {
                indentCount = 0

                break
            }
            case " ": {
                if (indentCount >= 0) indentCount++

                break
            }
            case "\t": {
                if (indentCount >= 0) indentCount += 4

                break
            }
            default: {
                if (indentCount !== -1 && indentCount < 3) {
                    return endBound
                }

                endBound = i

                indentCount = -1
            }
        }
    }

    return input.length - 1
}
