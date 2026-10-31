import AppLoader from './appLoader';
import { INewsResponse, ISourcesResponse } from '../../types/index';

class AppController extends AppLoader {
    public getSources(callback: (data: ISourcesResponse) => void): void {
        super.getResp(
            {
                endpoint: 'mocks/sources',
            },
            callback
        );
    }

    public getNews(e: Event, callback: (data: INewsResponse) => void): void {
        let target = e.target as HTMLElement;
        const newsContainer = e.currentTarget as HTMLElement;

        while (target !== newsContainer) {
            if (target.classList.contains('source__item')) {
                const sourceId = target.getAttribute('data-source-id');
                if (sourceId && newsContainer.getAttribute('data-source') !== sourceId) {
                    newsContainer.setAttribute('data-source', sourceId);
                    super.getResp(
                        {
                            endpoint: 'mocks/everything',
                            options: {
                                sources: sourceId,
                            },
                        },
                        callback
                    );
                }
                return;
            }
            target = target.parentNode as HTMLElement;
        }
    }
}

export default AppController;
