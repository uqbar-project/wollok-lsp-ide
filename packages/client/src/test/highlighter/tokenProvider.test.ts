import { excludeNullish, parse } from 'wollok-ts'
import { readFileSync } from 'fs'
import { processCode } from '../../highlighter/tokenProvider'

suite('an object sample', () => {

  let processed: string[]

  setup(() => {
    const filePath = 'src/test/highlighter/highlighter-samples/objectSample.wlk'
    const parsedFile = parse.File(filePath)
    const docText = readFileSync(filePath, { encoding: 'utf-8' })
    const tp = parsedFile.tryParse(docText)
    const splittedLines = docText.split('\n')
    processed = excludeNullish([]
      .concat(processCode(tp.members[0], splittedLines)))

  })

  test('highlights object keyword', () => {
    console.info(processed)
  })

})