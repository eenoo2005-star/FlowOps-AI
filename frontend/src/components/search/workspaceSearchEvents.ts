const OPEN_EVENT = 'flowops:open-workspace-search'

export function openWorkspaceSearch(): void {
  window.dispatchEvent(
    new CustomEvent(OPEN_EVENT),
  )
}

export { OPEN_EVENT }
