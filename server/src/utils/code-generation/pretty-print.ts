import { IDoc, braces, enclose, indent as nativeIndent, lineBreak } from 'prettier-printer'

export const indent = nativeIndent('\t')

export const body = (content: IDoc): IDoc => enclose(braces, [lineBreak, indent(content), lineBreak])
