import { IDoc, braces, enclose, indent as nativeIndent, lineBreak, intersperse, softLine, choice } from 'prettier-printer'

export const indent = nativeIndent('\t')

export const body = (content: IDoc): IDoc => enclose(braces, [lineBreak, indent(content), lineBreak])

/**
 * formats list of strings to "string1, string2, string3"
 */
export const listed = (contents: IDoc[], separator: IDoc = ','): IDoc => intersperse([separator, softLine], contents)

export const enclosedList = (enclosers: [IDoc, IDoc], content: IDoc[], separator: IDoc = ','): IDoc => {
  return choice(
    enclose(enclosers, listed(content, separator)),
    enclose(enclosers, [lineBreak, indent(listed(content, separator)), lineBreak])
  )
}
