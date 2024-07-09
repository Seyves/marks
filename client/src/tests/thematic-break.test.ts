import { NodeStack, parse } from "../converter"
import * as Nodes from "../bin/definitions"

test("thematic break std 1", () => {
    const str = "***\n---\n___"

    const stack = new NodeStack()

    for (let i = 3; i > 0; i--) {
        stack.push(new Nodes.ThematicBreak())
        stack.closeUntil(1)
    }

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break std 2", () => {
    const str = "+++"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("+++"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break std 3", () => {
    const str = "==="

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("==="))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break std 4", () => {
    const str = "--\n**\n__"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("-- ** __"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break std 5", () => {
    const str = " ***\n  ***\n   ***"

    const stack = new NodeStack()

    for (let i = 3; i > 0; i--) {
        stack.push(new Nodes.ThematicBreak())
        stack.closeUntil(1)
    }

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break std 6", () => {
    const str = "    ***"

    const stack = new NodeStack()

    stack.push(new Nodes.IndentedCodeBlock("***"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break std 7", () => {
    const str = "Foo\n    ***"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("Foo ***"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break std 8", () => {
    const str = "_____________________________________"

    const stack = new NodeStack()

    stack.push(new Nodes.ThematicBreak())
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break spaces", () => {
    const strA = " - - -"
    const strB = " **  * ** * ** * **"
    const strC = "-     -      -      -"
    const strD = "- - - -    "

    const stack = new NodeStack()

    stack.push(new Nodes.ThematicBreak())
    stack.closeUntil(1)

    expect(parse(strA)).toStrictEqual(stack)
    expect(parse(strB)).toStrictEqual(stack)
    expect(parse(strC)).toStrictEqual(stack)
    expect(parse(strD)).toStrictEqual(stack)
})

test("thematic break random char", () => {
    const str = "_ _ _ _ a\n\na------\n\n---a---"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("_ _ _ _ a"))
    stack.closeUntil(1)
    stack.push(new Nodes.Paragraph("a------"))
    stack.closeUntil(1)
    stack.push(new Nodes.Paragraph("---a---"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break before and after list (TODO INVALID P'S)", () => {
    const str = "- foo\n***\n- bar"

    const stack = new NodeStack()

    stack.push(new Nodes.UnorderedList())
    stack.push(new Nodes.ListItem(2))
    stack.push(new Nodes.Paragraph("foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.ThematicBreak())
    stack.closeUntil(1)
    stack.push(new Nodes.UnorderedList())
    stack.push(new Nodes.ListItem(2))
    stack.push(new Nodes.Paragraph("bar"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break iterrupting paragraph", () => {
    const str = "foo\n***\nbar"

    const stack = new NodeStack()

    stack.push(new Nodes.Paragraph("foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.ThematicBreak())
    stack.closeUntil(1)
    stack.push(new Nodes.Paragraph("bar"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("settext heading instead of thematic break", () => {
    const str = "foo\n---\nbar"

    const stack = new NodeStack()

    stack.push(new Nodes.Heading(1, "foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.Paragraph("bar"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break iterrupting a list", () => {
    const str = "* Foo\n* * *\n* Bar"

    const stack = new NodeStack()

    stack.push(new Nodes.UnorderedList())
    stack.push(new Nodes.ListItem(2))
    stack.push(new Nodes.Paragraph("Foo"))
    stack.closeUntil(1)
    stack.push(new Nodes.ThematicBreak())
    stack.closeUntil(1)
    stack.push(new Nodes.UnorderedList())
    stack.push(new Nodes.ListItem(2))
    stack.push(new Nodes.Paragraph("Bar"))
    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})

test("thematic break inside a list", () => {
    const str = "- Foo\n- * * *"

    const stack = new NodeStack()

    const list = new Nodes.UnorderedList() 

    stack.push(list)
    stack.push(new Nodes.ListItem(2))
    stack.push(new Nodes.Paragraph("Foo"))
    stack.closeUntil(2)

    const listItem = new Nodes.ListItem(2)
    listItem.children.push(new Nodes.ThematicBreak())
    list.children.push(listItem)

    stack.closeUntil(1)

    expect(parse(str)).toStrictEqual(stack)
})
