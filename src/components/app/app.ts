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
    private initialSourceSearchCancelled = false;
    private liveSearchId = 0;
    private liveApiKey: string | null = null;
    private apiKeyForm: HTMLFormElement | null = null;
    private apiKeyInput: HTMLInputElement | null = null;
    private apiKeySubmit: HTMLButtonElement | null = null;
    private demoButton: HTMLButtonElement | null = null;
    private apiStatus: HTMLElement | null = null;

    constructor() {
        this.controller = new AppController();
        this.view = new AppView();
    }

    public start(): void {
        this.toggleBtn = document.querySelector<HTMLButtonElement>('.sources-toggle');
        this.panel = document.getElementById('sources-panel');
        this.overlay = document.querySelector<HTMLButtonElement>('.sources-overlay');
        this.closeBtn = document.querySelector<HTMLButtonElement>('.sources-panel__close');
        this.apiKeyForm = document.querySelector<HTMLFormElement>('.api-key-form');
        this.apiKeyInput = document.querySelector<HTMLInputElement>('#api-key');
        this.apiKeySubmit = document.querySelector<HTMLButtonElement>('.api-key-submit');
        this.demoButton = document.querySelector<HTMLButtonElement>('.api-demo-button');
        this.apiStatus = document.querySelector<HTMLElement>('.api-status');
        this.syncPanelLayout();

        const sourcesContainer = document.querySelector<HTMLElement>('.sources');
        if (sourcesContainer) {
            sourcesContainer.addEventListener('click', (e: Event) => {
                const target = e.target as HTMLElement;
                const sourceItem = target.closest<HTMLButtonElement>('.source__item');
                const sourceId = sourceItem?.getAttribute('data-source-id') ?? null;

                if (sourceId) {
                    this.initialSourceSearchCancelled = true;
                    this.liveSearchId += 1;
                    this.view.selectSource(sourceId);
                }

                this.controller.getNews(
                    e,
                    (data) => {
                        this.view.drawNews(data);
                        if (data.status === 'error') {
                            this.setApiStatus(data.message ?? 'Could not load news.', true);
                        } else if (this.liveApiKey) {
                            this.setApiStatus('Live news loaded.');
                        }
                    },
                    (error) => this.setApiStatus(error.message, true),
                    this.liveApiKey ?? undefined
                );

                if (this.isMobile()) {
                    this.closePanel({ returnFocus: true });
                }
            });
        }

        this.toggleBtn?.addEventListener('click', () => this.openPanel());
        this.closeBtn?.addEventListener('click', () => this.closePanel({ returnFocus: true }));
        this.overlay?.addEventListener('click', () => this.closePanel({ returnFocus: true }));
        this.apiKeyForm?.addEventListener('submit', (e: SubmitEvent) => this.enableLiveMode(e));
        this.demoButton?.addEventListener('click', () => this.enableDemoMode());

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

        this.controller.getSources(
            (data) => {
                const sources: ISource[] = data?.sources ?? [];
                this.view.drawSources(data);

                const sourcesContainer = document.querySelector<HTMLElement>('.sources');
                if (data.status === 'error') {
                    this.setApiStatus(data.message ?? 'Could not load demo sources.', true);
                } else if (sourcesContainer && sources.length > 0) {
                    this.loadInitialSource(sources, sourcesContainer);
                } else {
                    this.setApiStatus('The demo did not return any sources.', true);
                }
            },
            (error) => this.setApiStatus(error.message, true)
        );
    }

    private enableLiveMode(e: SubmitEvent): void {
        e.preventDefault();
        const apiKey = this.apiKeyInput?.value.trim();
        if (!apiKey || !this.apiKeySubmit) {
            this.setApiStatus('Enter your News API key to load live sources.', true);
            this.apiKeyInput?.focus();
            return;
        }

        this.apiKeySubmit.disabled = true;
        this.setApiStatus('Checking your key and loading live sources...');
        this.controller.getSources(
            (data) => {
                this.apiKeySubmit!.disabled = false;
                if (data.status !== 'ok' || data.sources.length === 0) {
                    this.setApiStatus(data.message ?? 'No live sources were returned. Check your API key.', true);
                    return;
                }

                this.controller.invalidateNewsRequests();
                const searchId = ++this.liveSearchId;
                this.initialSourceSearchCancelled = true;
                const sourcesContainer = document.querySelector<HTMLElement>('.sources');
                sourcesContainer?.removeAttribute('data-source');
                sourcesContainer?.removeAttribute('data-source-pending');
                if (!sourcesContainer) {
                    this.apiKeySubmit!.disabled = false;
                    this.setApiStatus('Could not find the sources list.', true);
                    return;
                }
                this.setApiStatus('Finding a source with available live articles...');
                this.loadFirstLiveSource(data.sources, 0, sourcesContainer, apiKey, searchId);
            },
            (error) => {
                this.apiKeySubmit!.disabled = false;
                this.setApiStatus(error.message, true);
            },
            apiKey
        );
    }

    private enableDemoMode(): void {
        this.liveSearchId += 1;
        this.liveApiKey = null;
        if (this.apiKeyInput) this.apiKeyInput.value = '';
        if (this.demoButton) this.demoButton.hidden = true;
        if (this.apiKeySubmit) this.apiKeySubmit.disabled = false;
        this.initialSourceSearchCancelled = false;

        const sourcesContainer = document.querySelector<HTMLElement>('.sources');
        if (!sourcesContainer) {
            this.setApiStatus('Could not find the sources list.', true);
            return;
        }

        this.controller.invalidateNewsRequests();
        sourcesContainer.removeAttribute('data-source');
        sourcesContainer.removeAttribute('data-source-pending');
        this.view.drawNews({ articles: [] });
        this.setApiStatus('Loading demo news...');
        this.controller.getSources(
            (data) => {
                if (data.status !== 'ok') {
                    this.setApiStatus(data.message ?? 'Could not load demo sources.', true);
                    return;
                }

                this.view.drawSources(data);
                this.loadInitialSource(data.sources, sourcesContainer);
            },
            (error) => this.setApiStatus(error.message, true)
        );
    }

    private setApiStatus(message: string, isError = false): void {
        if (!this.apiStatus) return;
        this.apiStatus.textContent = message;
        this.apiStatus.classList.toggle('api-status--error', isError);
    }

    private loadInitialSource(sources: ISource[], sourcesContainer: HTMLElement): void {
        if (this.initialSourceSearchCancelled) return;
        const source = sources.find((item) => Boolean(item.id.trim()));
        if (!source) return;

        this.controller.getNewsForSource(
            source.id,
            sourcesContainer,
            (data) => {
                if (this.initialSourceSearchCancelled) return;
                if (data.status === 'ok' && data.articles.length > 0) {
                    this.view.selectSource(source.id);
                    this.view.drawNews(data);
                    this.setApiStatus('Showing demo news. Add your own API key above to load live sources.');
                } else {
                    this.setApiStatus(data.message ?? 'The demo source returned no articles.', true);
                }
            },
            (error) => this.setApiStatus(error.message, true)
        );
    }

    private loadFirstLiveSource(
        sources: ISource[],
        startIndex: number,
        sourcesContainer: HTMLElement,
        apiKey: string,
        searchId: number
    ): void {
        if (searchId !== this.liveSearchId) return;

        const nextStartIndex = Math.min(startIndex + 20, sources.length);
        const sourceBatch = sources.slice(startIndex, nextStartIndex).filter((source) => Boolean(source.id.trim()));
        if (sourceBatch.length === 0) {
            if (this.apiKeySubmit) this.apiKeySubmit.disabled = false;
            this.setApiStatus('No live articles were found for the available sources.', true);
            return;
        }

        this.controller.getNewsForSources(
            sourceBatch.map((source) => source.id),
            sourcesContainer,
            (data) => {
                if (searchId !== this.liveSearchId) return;

                if (data.status === 'error') {
                    if (this.apiKeySubmit) this.apiKeySubmit.disabled = false;
                    this.setApiStatus(data.message ?? 'Could not load live articles.', true);
                    return;
                }

                if (data.articles.length > 0) {
                    let selectedSource: ISource | undefined;
                    for (const article of data.articles) {
                        selectedSource = sourceBatch.find(
                            (source) =>
                                source.id === article.source.id ||
                                (!article.source.id && source.name === article.source.name)
                        );
                        if (selectedSource) break;
                    }

                    if (selectedSource) {
                        const articles = data.articles.filter(
                            (article) =>
                                article.source.id === selectedSource.id ||
                                (!article.source.id && article.source.name === selectedSource.name)
                        );
                        if (articles.length > 0) {
                            this.liveApiKey = apiKey;
                            this.view.drawSources({ status: 'ok', sources });
                            if (this.apiKeyInput) this.apiKeyInput.value = '';
                            if (this.demoButton) this.demoButton.hidden = false;
                            sourcesContainer.setAttribute('data-source', selectedSource.id);
                            this.view.selectSource(selectedSource.id);
                            this.view.drawNews({ ...data, articles });
                            if (this.apiKeySubmit) this.apiKeySubmit.disabled = false;
                            this.setApiStatus(
                                `Showing live news from ${selectedSource.name}. Your key stays in this tab's memory until you leave or reload.`
                            );
                            return;
                        }
                    }
                }

                this.loadFirstLiveSource(sources, nextStartIndex, sourcesContainer, apiKey, searchId);
            },
            (error) => {
                if (searchId !== this.liveSearchId) return;
                if (this.apiKeySubmit) this.apiKeySubmit.disabled = false;
                this.setApiStatus(error.message, true);
            },
            apiKey
        );
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
