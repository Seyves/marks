import { NodeStack, parse } from "../converter"
import * as Nodes from "../bin/definitions"

test("atx heading std 1", () => {
    const str = "# foo\n## foo\n### foo\n#### foo\n##### foo\n###### foo"

    const stack = new NodeStack()

    for (let i = 1; i < 7; i++) {
        stack.push(new Nodes.Heading(i, "foo"))
        stack.closeUntil(1)
    }

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 2", () => {
    const str = "####### foo"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("####### foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 3", () => {
    const str = "#5 bolt\n\n#hashtag"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("#5 bolt"))
    stack.closeUntil(1)
    stack.push(new Nodes.Paragraph("#hashtag"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 4", () => {
    const str = "\\## foo"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("## foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 5", () => {
    const str = "#                  foo                     "

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(1, "foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 6", () => {
    const str = " ### foo\n  ## foo\n   # foo"

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(3, "foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(2, "foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(1, "foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 7", () => {
    const str = "    # foo"

    const stack = new NodeStack()

    stack.push(new Nodes.IndentedCodeBlock("# foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 8", () => {
    const str = "foo\n    #bar"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("foo #bar"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 8", () => {
    const str = "foo\n    #bar"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("foo #bar"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "## foo ##\n###   bar    ###"

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(2, "foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(3, "bar"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "# foo ##################################\n##### foo ##"

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(1, "foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(5, "foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "### foo ###     "

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(3, "foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "### foo ### b"

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(3, "foo ### b"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "### foo \\###"

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(3, "foo ###"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "****\n## foo\n****"

    const stack = new NodeStack()

    stack.push(new Nodes.ThematicBreak())
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(2, "foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.ThematicBreak())
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "Foo bar\n# baz\nBar foo"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("Foo bar"))
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(1, "baz"))
    stack.closeUntil(1)
    stack.push(new Nodes.Paragraph("Bar foo"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("atx heading std 9", () => {
    const str = "## \n#\n### ###"

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(2))
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(1))
    stack.closeUntil(1)
    stack.push(new Nodes.Heading(3))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})
