export interface INewsArticle {
    source: {
        id: string | null;
        name: string;
    };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

export interface INewsResponse {
    status: 'ok' | 'error';
    totalResults: number;
    articles: INewsArticle[];
    message?: string;
}

export interface ISource {
    id: string;
    name: string;
    description: string;
    url: string;
    category: string;
    language: string;
    country: string;
}

export interface ISourcesResponse {
    status: 'ok' | 'error';
    sources: ISource[];
    message?: string;
}

export enum NewsEndpoint {
    MockSources = 'mocks/sources',
    MockEverything = 'mocks/everything',
    Sources = 'sources',
    Everything = 'everything',
}

export type NewsCardProps = Pick<
    INewsArticle,
    'source' | 'author' | 'title' | 'url' | 'urlToImage' | 'publishedAt' | 'description'
>;
