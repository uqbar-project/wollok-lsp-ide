import { IDoc, braces, enclose, indent as nativeIndent, lineBreak, intersperse, softLine, choice, dquotes } from 'prettier-printer'
import { CONSTANTS } from './wollok-code'

export const WS: IDoc = ' '

export const indent = nativeIndent('\t')

export const body = (content: IDoc): IDoc => enclose(braces, [lineBreak, indent(content), lineBreak])

/**
 * Formats list of strings to "string1, string2, string3" spreading it over multiple lines when needed
 */
export const listed = (contents: IDoc[], separator: IDoc = ','): IDoc => intersperse([separator, softLine], contents)

export const enclosedList = (enclosers: [IDoc, IDoc], content: IDoc[], separator: IDoc = ','): IDoc => {
  return choice(
    enclose(enclosers, listed(content, separator)),
    enclose(enclosers, content.length > 0 ? [lineBreak, indent(listed(content, separator)), lineBreak] : [])
  )
}

export const stringify = enclose(dquotes)

type Encloser = [IDoc, IDoc]
export const listEnclosers: Encloser = [CONSTANTS.BEGIN_LIST_LITERAL, CONSTANTS.END_LIST_LITERAL]
export const setEnclosers: Encloser = [CONSTANTS.BEGIN_SET_LITERAL, CONSTANTS.END_SET_LITERAL]
