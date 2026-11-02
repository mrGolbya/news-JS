import AppLoader from './appLoader';
import { INewsResponse, ISourcesResponse, NewsEndpoint } from '../../types/index';

class AppController extends AppLoader {
    public getSources(callback: (data: ISourcesResponse) => void): void {
        super.getResp(
            {
                endpoint: NewsEndpoint.Sources,
            },
            callback
        );
    }

    public getNews(e: Event, callback: (data: INewsResponse) => void): void {
        const target = e.target as HTMLElement;
        const newsContainer = e.currentTarget as HTMLElement;
        const sourceItem = target.closest('.source__item');

        if (!sourceItem || !newsContainer.contains(sourceItem)) {
            return;
        }

        const sourceId = sourceItem.getAttribute('data-source-id');
        if (sourceId) {
            this.getNewsForSource(sourceId, newsContainer, callback);
        }
    }

    public getNewsForSource(
        sourceId: string,
        sourcesContainer: HTMLElement,
        callback: (data: INewsResponse) => void
    ): void {
        if (!sourceId || sourcesContainer.getAttribute('data-source') === sourceId) {
            return;
        }

        sourcesContainer.setAttribute('data-source', sourceId);
        super.getResp(
            {
                endpoint: NewsEndpoint.Everything,
                options: {
                    sources: sourceId,
                },
            },
            callback
        );
    }
}

export default AppController;
