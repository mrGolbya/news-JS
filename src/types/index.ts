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
}

export enum NewsEndpoint {
    Sources = 'mocks/sources',
    Everything = 'mocks/everything',
}
