import { create } from 'zustand'

export const useTemplateStore = create((set, get) => ({
  sections: [],
  colorTokens: { primary: '#2563EB', secondary: '#F8FAFC', accent: '#7C3AED', text: '#0F172A' },
  templateId: null,

  initCustomizer: (template) => set({
    templateId: template.id,
    sections: template.components?.sections || [],
    colorTokens: template.defaultColors || get().colorTokens
  }),

  updateColor: (token, value) => set(state => ({
    colorTokens: { ...state.colorTokens, [token]: value }
  })),

  reorderSections: (newOrder) => set({ sections: newOrder }),

  getCustomization: () => {
    const { sections, colorTokens } = get()
    return { sections, colorTokens }
  }
}))
