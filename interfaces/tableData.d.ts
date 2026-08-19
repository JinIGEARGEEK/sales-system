// A table row can be any domain record (Company, Contact, Deal, ...) — the
// table itself only ever accesses fields dynamically by name, so it doesn't
// need (and shouldn't assume) a concrete shape.
type TableRowData = Record<string, unknown>

interface TableDataColumn {
  label: string
  align?: string
  field: string
  actions?: TableDataColumnActions[]
  width?: number
  isSort?: boolean
  type?: string
}

interface TableDataColumnActions {
  label: string
  emitName: string
  isBorderBottom: boolean
  hideIf?: (row: TableRowData) => boolean
}

interface TableTypeLink {
  path: string
  label: string
}

interface TableTypeUpdatedAt {
  updatedAt: string
  updatedById: number
  updatedByName: string
  path: string
}