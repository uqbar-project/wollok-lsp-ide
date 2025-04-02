import * as vscode from 'vscode'

export interface RawNotebook {
  cells: RawNotebookCell[]
}

export interface RawNotebookCell {
  source: string[]
  cell_type: 'codear' | 'markdown'
}

export class WollokNotebookSerializer implements vscode.NotebookSerializer {
  async deserializeNotebook(
    content: Uint8Array,
    _token: vscode.CancellationToken
  ): Promise<vscode.NotebookData> {
    const contents = new TextDecoder().decode(content)

    let raw: RawNotebookCell[]
    try {
      raw = (<RawNotebook>JSON.parse(contents)).cells
    } catch {
      raw = []
    }

    const cells = raw.map(
      item =>
        new vscode.NotebookCellData(
          item.cell_type === 'codear'
            ? vscode.NotebookCellKind.Code
            : vscode.NotebookCellKind.Markup,
          item.source.join('\n'),
          item.cell_type === 'codear' ? 'python' : 'markdown'
        )
    )

    return new vscode.NotebookData(cells)
  }

  async serializeNotebook(
    data: vscode.NotebookData,
    _token: vscode.CancellationToken
  ): Promise<Uint8Array> {
    const contents: RawNotebookCell[] = []

    for (const cell of data.cells) {
      contents.push({
        cell_type: cell.kind === vscode.NotebookCellKind.Code ? 'codear' : 'markdown',
        source: cell.value.split(/\r?\n/g),
      })
    }

    return new TextEncoder().encode(JSON.stringify(contents))
  }
}