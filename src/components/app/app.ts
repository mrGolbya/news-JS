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
            }
        });

        window.addEventListener('resize', () => {
            if (!this.isMobile() && this.panelOpen) {
                this.closePanel({ returnFocus: false });
            }
        });

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
