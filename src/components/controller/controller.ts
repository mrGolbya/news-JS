import AppLoader from './appLoader';
import { INewsResponse, ISourcesResponse, NewsEndpoint } from '../../types/index';

class AppController extends AppLoader {
    private newsRequestId = 0;

    public getSources(
        callback: (data: ISourcesResponse) => void,
        errorCallback?: (error: Error) => void,
        apiKey?: string
    ): void {
        super.getResp(
            {
                endpoint: apiKey ? NewsEndpoint.Sources : NewsEndpoint.MockSources,
                options: apiKey ? { apiKey } : {},
            },
            callback,
            errorCallback
        );
    }

    public getNews(
        e: Event,
        callback: (data: INewsResponse) => void,
        errorCallback?: (error: Error) => void,
        apiKey?: string
    ): void {
        const target = e.target as HTMLElement;
        const newsContainer = e.currentTarget as HTMLElement;
        const sourceItem = target.closest('.source__item');

        if (!sourceItem || !newsContainer.contains(sourceItem)) {
            return;
        }

        const sourceId = sourceItem.getAttribute('data-source-id');
        if (sourceId) {
            this.getNewsForSource(sourceId, newsContainer, callback, errorCallback, apiKey);
        }
    }

    public getNewsForSource(
        sourceId: string,
        sourcesContainer: HTMLElement,
        callback: (data: INewsResponse) => void,
        errorCallback?: (error: Error) => void,
        apiKey?: string
    ): void {
        if (!sourceId) {
            return;
        }

        this.loadNews(sourceId, sourcesContainer, callback, errorCallback, apiKey, sourceId);
    }

    public getNewsForSources(
        sourceIds: string[],
        sourcesContainer: HTMLElement,
        callback: (data: INewsResponse) => void,
        errorCallback: (error: Error) => void,
        apiKey: string
    ): void {
        const validSourceIds = sourceIds.filter((sourceId) => Boolean(sourceId.trim()));
        if (validSourceIds.length === 0) return;

        this.loadNews(validSourceIds.join(','), sourcesContainer, callback, errorCallback, apiKey);
    }

    private loadNews(
        sourceFilter: string,
        sourcesContainer: HTMLElement,
        callback: (data: INewsResponse) => void,
        errorCallback: ((error: Error) => void) | undefined,
        apiKey: string | undefined,
        selectedSourceId?: string
    ): void {
        if (
            sourcesContainer.getAttribute('data-source') === selectedSourceId ||
            sourcesContainer.getAttribute('data-source-pending') === sourceFilter
        ) {
            return;
        }

        const requestId = ++this.newsRequestId;
        sourcesContainer.setAttribute('data-source-pending', sourceFilter);
        super.getResp<INewsResponse>(
            {
                endpoint: apiKey ? NewsEndpoint.Everything : NewsEndpoint.MockEverything,
                options: {
                    sources: sourceFilter,
                    ...(apiKey ? { apiKey } : {}),
                },
            },
            (data) => {
                if (requestId !== this.newsRequestId) return;
                sourcesContainer.removeAttribute('data-source-pending');
                if (data.status === 'ok' && selectedSourceId) {
                    sourcesContainer.setAttribute('data-source', selectedSourceId);
                }
                callback(data);
            },
            (error) => {
                if (requestId !== this.newsRequestId) return;
                sourcesContainer.removeAttribute('data-source-pending');
                errorCallback?.(error);
            }
        );
    }

    public invalidateNewsRequests(): void {
        this.newsRequestId += 1;
    }
}

export default AppController;
