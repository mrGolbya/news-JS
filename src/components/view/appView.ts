import News from './news/news';
import Sources from './sources/sources';
import { INewsResponse, ISourcesResponse } from '../../types/index';

export class AppView {
    private news: News;
    private sources: Sources;

    constructor() {
        this.news = new News();
        this.sources = new Sources();
    }

    public drawNews(data?: Partial<INewsResponse>): void {
        const values = data?.articles ? data?.articles : [];
        this.news.draw(values);
    }

    public drawSources(data?: Partial<ISourcesResponse>, selectedId: string | null = null): void {
        const values = data?.sources ? data?.sources : [];
        this.sources.draw(values, selectedId);
    }

    public selectSource(sourceId: string): void {
        this.sources.setSelected(sourceId);
    }
}

export default AppView;
