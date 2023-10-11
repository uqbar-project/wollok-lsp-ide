import { IDoc, braces, enclose, indent, lineBreak } from 'prettier-printer'

export const body = (content: IDoc): IDoc => enclose(braces, [lineBreak, indent(1, content), lineBreak])