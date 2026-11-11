export interface Tool {
  id: string
  name: string
  url: string
  description?: string
  category: string
  icon?: string
  createdAt: string
  updatedAt: string
}

export interface ToolDraft {
  name: string
  url: string
  description: string
  category: string
  icon: string
}

export type ToolInput = Partial<ToolDraft>
