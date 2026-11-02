import AppController from '../controller/controller';
import { AppView } from '../view/appView';
import { ISource } from '../../types/index';

class App {
    private controller: AppController;
    private view: AppView;

    private toggleBtn: HTMLButtonElement | null = null;
    private panel: HTMLElement | null = null;
    private overlay: HTMLButtonElement | null = null;
    private closeBtn: HTMLButtonElement | null = null;
    private panelOpen = false;
    private previousBodyOverflow = '';
    private lastFocused: HTMLElement | null = null;
    private initialSourceSearchStarted = false;
    private initialSourceSearchCancelled = false;

    constructor() {
        this.controller = new AppController();
        this.view = new AppView();
    }

    public start(): void {
        this.toggleBtn = document.querySelector<HTMLButtonElement>('.sources-toggle');
        this.panel = document.getElementById('sources-panel');
        this.overlay = document.querySelector<HTMLButtonElement>('.sources-overlay');
        this.closeBtn = document.querySelector<HTMLButtonElement>('.sources-panel__close');
        this.syncPanelLayout();

        const sourcesContainer = document.querySelector<HTMLElement>('.sources');
        if (sourcesContainer) {
            sourcesContainer.addEventListener('click', (e: Event) => {
                const target = e.target as HTMLElement;
                const sourceItem = target.closest<HTMLButtonElement>('.source__item');
                const sourceId = sourceItem?.getAttribute('data-source-id') ?? null;

                if (sourceId) {
                    this.initialSourceSearchCancelled = true;
                    this.view.selectSource(sourceId);
                }

                this.controller.getNews(e, (data) => this.view.drawNews(data));

                if (this.isMobile()) {
                    this.closePanel({ returnFocus: true });
                }
            });
        }

        this.toggleBtn?.addEventListener('click', () => this.openPanel());
        this.closeBtn?.addEventListener('click', () => this.closePanel({ returnFocus: true }));
        this.overlay?.addEventListener('click', () => this.closePanel({ returnFocus: true }));

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.panelOpen) {
                e.preventDefault();
                this.closePanel({ returnFocus: true });
                return;
            }

            if (e.key === 'Tab' && this.panelOpen) {
                this.trapPanelFocus(e);
            }
        });

        window.addEventListener('resize', () => this.syncPanelLayout());

        this.controller.getSources((data) => {
            const sources: ISource[] = data?.sources ?? [];
            this.view.drawSources(data);

            const sourcesContainer = document.querySelector<HTMLElement>('.sources');
            if (sourcesContainer && sources.length > 0 && !this.initialSourceSearchStarted) {
                this.initialSourceSearchStarted = true;
                this.loadInitialSource(sources, 0, sourcesContainer);
            }
        });
    }

    private loadInitialSource(sources: ISource[], startIndex: number, sourcesContainer: HTMLElement): void {
        if (this.initialSourceSearchCancelled) return;

        const sourceIndex = sources.findIndex((source, index) => index >= startIndex && Boolean(source.id.trim()));
        const source = sources[sourceIndex];
        if (!source) return;

        this.controller.getNewsForSource(source.id, sourcesContainer, (data) => {
            if (this.initialSourceSearchCancelled) return;

            if (data.status === 'ok' && data.articles.length > 0) {
                this.view.selectSource(source.id);
                this.view.drawNews(data);
                return;
            }

            this.loadInitialSource(sources, sourceIndex + 1, sourcesContainer);
        });
    }

    private isMobile(): boolean {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    private trapPanelFocus(e: KeyboardEvent): void {
        if (!this.panel) return;

        const focusableElements = Array.from(
            this.panel.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter((element) => element.getClientRects().length > 0);

        if (focusableElements.length === 0) {
            e.preventDefault();
            return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (e.shiftKey && (activeElement === firstElement || !this.panel.contains(activeElement))) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && (activeElement === lastElement || !this.panel.contains(activeElement))) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    private syncPanelLayout(): void {
        if (!this.panel || !this.overlay || !this.toggleBtn) return;

        const activeElement = document.activeElement;
        if (this.isMobile()) {
            if (!this.panelOpen && this.panel.contains(activeElement)) {
                this.toggleBtn.focus();
            }

            this.panel.hidden = !this.panelOpen;
            this.panel.setAttribute('aria-hidden', String(!this.panelOpen));
            this.overlay.hidden = !this.panelOpen;
            this.toggleBtn.setAttribute('aria-expanded', String(this.panelOpen));
            return;
        }

        if (this.panelOpen) {
            document.body.style.overflow = this.previousBodyOverflow;
            if (this.panel.contains(activeElement)) {
                this.panel.querySelector<HTMLButtonElement>('.source__item--selected')?.focus();
            }
        }

        this.panelOpen = false;
        this.panel.hidden = false;
        this.panel.classList.remove('sources-panel--open');
        this.panel.setAttribute('aria-hidden', 'false');
        this.panel.removeAttribute('role');
        this.panel.removeAttribute('aria-modal');
        this.overlay.hidden = true;
        this.overlay.classList.remove('sources-overlay--visible');
        this.toggleBtn.setAttribute('aria-expanded', 'false');
    }

    private openPanel(): void {
        if (!this.panel || !this.toggleBtn || !this.overlay) return;

        this.lastFocused = document.activeElement as HTMLElement | null;
        this.panelOpen = true;

        this.panel.hidden = false;
        this.overlay.hidden = false;
        requestAnimationFrame(() => {
            this.panel?.classList.add('sources-panel--open');
            this.overlay?.classList.add('sources-overlay--visible');
        });

        this.panel.setAttribute('aria-hidden', 'false');
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-modal', 'true');
        this.toggleBtn.setAttribute('aria-expanded', 'true');

        this.previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        this.closeBtn?.focus();
    }

    private closePanel({ returnFocus }: { returnFocus: boolean }): void {
        if (!this.panelOpen || !this.panel || !this.toggleBtn || !this.overlay) return;

        this.panelOpen = false;
        this.panel.classList.remove('sources-panel--open');
        this.overlay.classList.remove('sources-overlay--visible');

        this.panel.setAttribute('aria-hidden', 'true');
        this.panel.removeAttribute('role');
        this.panel.removeAttribute('aria-modal');
        this.toggleBtn.setAttribute('aria-expanded', 'false');

        document.body.style.overflow = this.previousBodyOverflow;

        const finish = (): void => {
            if (!this.panel || !this.overlay) return;
            if (!this.panelOpen) {
                this.panel.hidden = true;
                this.overlay.hidden = true;
            }
        };

        const onEnd = (e: TransitionEvent): void => {
            if (e.target !== this.panel) return;
            this.panel?.removeEventListener('transitionend', onEnd);
            finish();
        };
        this.panel.addEventListener('transitionend', onEnd);
        window.setTimeout(() => {
            this.panel?.removeEventListener('transitionend', onEnd);
            finish();
        }, 300);

        if (returnFocus) {
            const target = this.lastFocused ?? this.toggleBtn;
            if (target && document.contains(target)) {
                target.focus();
            } else {
                this.toggleBtn.focus();
            }
        }
    }
}

export default App;
