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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hideIf?: (row: any) => boolean
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