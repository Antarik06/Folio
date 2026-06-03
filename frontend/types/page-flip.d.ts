declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, unknown>)
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void
    on(event: string, callback: (event: { data: any }) => void): void
    flipNext(corner?: string): void
    flipPrev(corner?: string): void
    destroy(): void
  }
}
