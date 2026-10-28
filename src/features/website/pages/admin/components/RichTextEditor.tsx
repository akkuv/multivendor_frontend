import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Columns3,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Redo,
  Rows3,
  Strikethrough,
  Table2,
  Trash2,
  Type,
  Underline,
  Undo,
  Unlink,
} from 'lucide-react'

export type RichTextEditorProps = {
  html: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  html,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const hasSetInitial = useRef(false)
  const savedRange = useRef<Range | null>(null)
  const [isTableOpen, setIsTableOpen] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [tableHeader, setTableHeader] = useState(true)
  const [activeCell, setActiveCell] = useState<HTMLTableCellElement | null>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    if (!hasSetInitial.current) {
      editor.innerHTML = html
      hasSetInitial.current = true
      return
    }

    if (editor.innerHTML !== html) {
      editor.innerHTML = html
    }
  }, [html])

  const emitChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const exec = (command: string, value?: string) => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    document.execCommand(command, false, value)
    emitChange()
  }

  const handleInput = () => emitChange()
  const handleBlur = () => emitChange()
  const handlePaste = () => {
    // Give the browser a tick to normalise the pasted markup, then sync.
    window.setTimeout(() => emitChange(), 0)
  }

  const insertLink = () => {
    const url = window.prompt('Enter the URL to link to', 'https://')
    if (!url) {
      // Ensure selection isn't lost state; still emit in case of formatting.
      emitChange()
      return
    }
    exec('createLink', url)
  }

  const formatBlock = (block: string) => {
    exec('formatBlock', block)
  }

  /**
   * Insert a table at the caret. The admin picks the row/column counts in the
   * table popover, optionally with a header row; cells start with a `<br>` so
   * they are immediately clickable.
   */
  const insertTable = () => {
    const editor = editorRef.current
    if (!editor) return

    const rows = Math.min(Math.max(Math.round(tableRows) || 1, 1), 20)
    const cols = Math.min(Math.max(Math.round(tableCols) || 1, 1), 10)
    const cell = (tag: 'th' | 'td') => `<${tag}><br></${tag}>`
    const row = (tag: 'th' | 'td') => `<tr>${Array.from({ length: cols }, () => cell(tag)).join('')}</tr>`

    const head = tableHeader ? `<thead>${row('th')}</thead>` : ''
    const body = `<tbody>${Array.from({ length: rows - (tableHeader ? 1 : 0) }, () => row('td')).join('')}</tbody>`
    const html = `<table>${head}${body}</table><p><br></p>`

    // The popover stole focus, so put the caret back where the admin left it
    // before inserting; fall back to the end of the content when it is gone.
    editor.focus()
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      if (savedRange.current && editor.contains(savedRange.current.commonAncestorContainer)) {
        selection.addRange(savedRange.current)
      } else {
        const end = document.createRange()
        end.selectNodeContents(editor)
        end.collapse(false)
        selection.addRange(end)
      }
    }

    document.execCommand('insertHTML', false, html)
    setIsTableOpen(false)
    emitChange()
  }

  /** Open the table popover, remembering the caret so the table lands there. */
  const toggleTablePopover = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange()
    }
    setIsTableOpen((open) => !open)
  }

  /* ─────────────────────── In-table editing (row / column) ─────────────────────── */

  /** The `<td>`/`<th>` the caret currently sits in, or null when outside a table. */
  const getActiveCell = (): HTMLTableCellElement | null => {
    const selection = window.getSelection()
    const node = selection?.anchorNode
    if (!node || !editorRef.current?.contains(node)) return null

    const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
    return (element?.closest('td, th') as HTMLTableCellElement | null) ?? null
  }

  const placeCaretAtEnd = (element: HTMLElement | null) => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    if (!element) return

    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    savedRange.current = range.cloneRange()
  }

  /** Drop a table that has no rows left, then refresh state and notify the form. */
  const finishTableEdit = (focusTarget: HTMLElement | null) => {
    placeCaretAtEnd(focusTarget)
    setActiveCell(getActiveCell())
    emitChange()
  }

  /** Index of a row within its table; used to keep the caret near where it was. */
  const rowIndexOf = (table: HTMLTableElement, row: HTMLTableRowElement): number =>
    Array.from(table.rows).indexOf(row)

  /** Remove any thead/tbody/tfoot left with no rows so the markup stays valid. */
  const tableRowEmptySections = (table: HTMLTableElement) => {
    for (const section of Array.from(table.children)) {
      if (section.tagName === 'THEAD' || section.tagName === 'TBODY' || section.tagName === 'TFOOT') {
        if (section.querySelectorAll('tr').length === 0) section.remove()
      }
    }
  }

  const deleteTableRow = () => {
    const cell = activeCell
    const tableRow = cell?.closest('tr')
    const table = tableRow?.closest('table')
    if (!tableRow || !table) return

    // A one-row table cannot be shortened — remove it entirely.
    if (table.rows.length <= 1) {
      table.remove()
      finishTableEdit(null)
      return
    }

    const rows = Array.from(table.rows)
    const rowIndex = rows.indexOf(tableRow)
    const cellIndex = cell ? Array.from(tableRow.cells).indexOf(cell) : 0

    tableRow.remove()

    // The section (thead/tbody) the row lived in may now be empty.
    tableRowEmptySections(table)

    const remaining = Array.from(table.rows)
    const nextRow = remaining[Math.min(rowIndex, remaining.length - 1)]
    finishTableEdit(nextRow?.cells[Math.min(cellIndex, nextRow.cells.length - 1)] ?? null)
  }

  const deleteTableColumn = () => {
    const cell = activeCell
    const tableRow = cell?.closest('tr')
    const table = tableRow?.closest('table')
    if (!cell || !tableRow || !table) return

    const column = Array.from(tableRow.cells).indexOf(cell)

    for (const row of Array.from(table.rows)) {
      row.cells[column]?.remove()
      if (row.cells.length === 0) row.remove()
    }

    if (!table.rows.length) {
      table.remove()
      finishTableEdit(null)
      return
    }

    const rows = Array.from(table.rows)
    const nextRow = rows.find((row) => row.contains(tableRow)) ?? rows[Math.min(rowIndexOf(table, tableRow), rows.length - 1)] ?? rows[0]
    finishTableEdit(nextRow?.cells[Math.min(column, nextRow.cells.length - 1)] ?? null)
  }

  const addTableRow = () => {
    const cell = activeCell
    const tableRow = cell?.closest('tr')
    const table = tableRow?.closest('table')
    if (!tableRow || !table) return

    const newRow = document.createElement('tr')
    for (let index = 0; index < tableRow.cells.length; index += 1) {
      const newCell = document.createElement('td')
      newCell.appendChild(document.createElement('br'))
      newRow.appendChild(newCell)
    }

    tableRow.after(newRow)
    finishTableEdit(newRow.cells[Math.min(cell ? Array.from(tableRow.cells).indexOf(cell) : 0, newRow.cells.length - 1)] ?? null)
  }

  const addTableColumn = () => {
    const cell = activeCell
    const tableRow = cell?.closest('tr')
    const table = tableRow?.closest('table')
    if (!cell || !tableRow || !table) return

    const column = Array.from(tableRow.cells).indexOf(cell)

    for (const row of Array.from(table.rows)) {
      const newCell = document.createElement('td')
      newCell.appendChild(document.createElement('br'))
      const sibling = row.cells[column]
      if (sibling) {
        row.insertBefore(newCell, sibling.nextSibling)
      } else {
        row.appendChild(newCell)
      }
    }

    finishTableEdit(tableRow.cells[column + 1] ?? cell)
  }

  const deleteWholeTable = () => {
    activeCell?.closest('table')?.remove()
    finishTableEdit(null)
  }

  // Keep the row/column controls in sync with wherever the caret is.
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const syncActiveCell = () => {
      const cell = getActiveCell()
      setActiveCell((current) => (current === cell ? current : cell))
    }

    document.addEventListener('selectionchange', syncActiveCell)
    editor.addEventListener('click', syncActiveCell)
    editor.addEventListener('keyup', syncActiveCell)

    return () => {
      document.removeEventListener('selectionchange', syncActiveCell)
      editor.removeEventListener('click', syncActiveCell)
      editor.removeEventListener('keyup', syncActiveCell)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editorRef/getActiveCell are stable for this editor instance
  }, [])

  const toolbarItems = [
    { label: 'Paragraph', icon: Type, onClick: () => formatBlock('p') },
    { label: 'Heading 1', icon: Heading1, onClick: () => formatBlock('h1') },
    { label: 'Heading 2', icon: Heading2, onClick: () => formatBlock('h2') },
    { label: 'Heading 3', icon: Heading3, onClick: () => formatBlock('h3') },
    { label: 'Heading 4', icon: Heading4, onClick: () => formatBlock('h4') },
    { label: 'Heading 5', icon: Heading5, onClick: () => formatBlock('h5') },
    { label: 'Heading 6', icon: Heading6, onClick: () => formatBlock('h6') },
  ]

  const inlineItems = [
    { label: 'Bold', icon: Bold, onClick: () => exec('bold'), command: 'bold' },
    { label: 'Italic', icon: Italic, onClick: () => exec('italic'), command: 'italic' },
    { label: 'Underline', icon: Underline, onClick: () => exec('underline'), command: 'underline' },
    { label: 'Strikethrough', icon: Strikethrough, onClick: () => exec('strikeThrough'), command: 'strikeThrough' },
  ]

  const alignItems = [
    { label: 'Align left', icon: AlignLeft, onClick: () => exec('justifyLeft') },
    { label: 'Align center', icon: AlignCenter, onClick: () => exec('justifyCenter') },
    { label: 'Align right', icon: AlignRight, onClick: () => exec('justifyRight') },
  ]

  const listItems = [
    { label: 'Bulleted list', icon: List, onClick: () => exec('insertUnorderedList') },
    { label: 'Numbered list', icon: ListOrdered, onClick: () => exec('insertOrderedList') },
    { label: 'Blockquote', icon: Quote, onClick: () => exec('formatBlock', 'blockquote') },
    { label: 'Horizontal rule', icon: Minus, onClick: () => exec('insertHorizontalRule') },
  ]

  const linkItems = [
    { label: 'Add link', icon: Link, onClick: insertLink },
    { label: 'Remove link', icon: Unlink, onClick: () => exec('unlink') },
  ]

  const historyItems = [
    { label: 'Undo', icon: Undo, onClick: () => exec('undo') },
    { label: 'Redo', icon: Redo, onClick: () => exec('redo') },
  ]

  // Shown while the caret sits inside a table; every action works on the row /
  // column the caret is in.
  const tableControls = [
    { label: 'Add row', icon: Plus, title: 'Add a row below the current one', onClick: addTableRow },
    { label: 'Delete row', icon: Rows3, title: 'Delete the current row', onClick: deleteTableRow },
    { label: 'Add column', icon: Plus, title: 'Add a column after the current one', onClick: addTableColumn },
    { label: 'Delete column', icon: Columns3, title: 'Delete the current column', onClick: deleteTableColumn },
    { label: 'Delete table', icon: Trash2, title: 'Remove the whole table', onClick: deleteWholeTable, destructive: true },
  ]

  const renderGroup = (items: Array<{ label: string; icon: any; onClick: () => void }>) => (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={item.onClick}
            title={item.label}
            className="h-8 w-8 p-0"
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{item.label}</span>
          </Button>
        )
      })}
    </div>
  )

  return (
    <div className={cn('rounded-lg border border-input bg-background', className)}>
      <div className="flex flex-wrap gap-2 border-b border-input bg-muted/30 p-2">
        {renderGroup(toolbarItems.slice(0, 1))}
        <div className="h-8 w-px bg-input" />
        {renderGroup(toolbarItems.slice(1, 7))}
        <div className="h-8 w-px bg-input" />
        {renderGroup(inlineItems)}
        <div className="h-8 w-px bg-input" />
        {renderGroup(alignItems)}
        <div className="h-8 w-px bg-input" />
        {renderGroup(listItems)}
        <div className="h-8 w-px bg-input" />
        {renderGroup(linkItems)}
        <div className="h-8 w-px bg-input" />
        <div className="relative flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleTablePopover}
            title="Insert table"
            className={cn('h-8 w-8 p-0', isTableOpen && 'bg-accent text-accent-foreground')}
          >
            <Table2 className="h-4 w-4" />
            <span className="sr-only">Insert table</span>
          </Button>
          {isTableOpen && (
            <div className="absolute left-0 top-9 z-20 w-64 rounded-lg border border-input bg-background p-3 shadow-lg">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Insert table</p>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="rt-table-rows" className="text-xs">Rows</Label>
                  <Input
                    id="rt-table-rows"
                    type="number"
                    min={1}
                    max={20}
                    value={tableRows}
                    onChange={(e) => setTableRows(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rt-table-cols" className="text-xs">Columns</Label>
                  <Input
                    id="rt-table-cols"
                    type="number"
                    min={1}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(Number(e.target.value))}
                  />
                </div>
              </div>
              <label className="mb-3 flex items-center gap-2 text-xs text-ink">
                <input
                  type="checkbox"
                  checked={tableHeader}
                  onChange={(e) => setTableHeader(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-input"
                />
                Include header row
              </label>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsTableOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={insertTable}>
                  Insert
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-input" />
        {renderGroup(historyItems)}
      </div>
      {activeCell && (
        <div className="flex flex-wrap items-center gap-1 border-b border-input bg-gold-soft/30 px-2 py-1.5">
          <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            <Table2 className="h-3.5 w-3.5" />
            Table
          </span>
          {tableControls.map((control) => {
            const Icon = control.icon
            return (
              <Button
                key={control.label}
                type="button"
                variant={control.destructive ? 'outline' : 'ghost'}
                size="sm"
                // Keep the caret in the table while clicking a control, otherwise the
                // editor blurs, activeCell clears, and the click never registers.
                onMouseDown={(event) => event.preventDefault()}
                onClick={control.onClick}
                title={control.title}
                className={cn(
                  'h-7 gap-1.5 px-2 text-xs',
                  control.destructive && 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {control.label}
              </Button>
            )
          })}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
        className="max-h-[40vh] min-h-[220px] overflow-y-auto p-4 text-sm leading-relaxed text-ink focus:outline-none [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-ink [&_h5]:mb-2 [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:text-ink [&_h6]:mb-2 [&_h6]:text-xs [&_h6]:font-bold [&_h6]:uppercase [&_h6]:tracking-[0.12em] [&_h6]:text-ink-soft [&_p]:my-2 [&_a]:text-gold-deep [&_a]:underline [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-line-warm [&_blockquote]:pl-3 [&_blockquote]:italic [&_hr]:my-4 [&_hr]:border-line-warm [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-line-warm [&_table]:text-left [&_th]:border [&_th]:border-line-warm [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-line-warm [&_td]:px-3 [&_td]:py-2 [&_td]:align-top"
        data-placeholder={placeholder}
      />
    </div>
  )
}
