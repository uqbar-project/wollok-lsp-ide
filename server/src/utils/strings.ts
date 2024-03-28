export const removeQuotes = (str: string): string => str.replace(new RegExp("(^\")|(\"$)", 'g'), "")
