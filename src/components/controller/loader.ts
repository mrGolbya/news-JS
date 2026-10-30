import { INewsResponse, ISourcesResponse } from 'src\types\index.ts';

interface IRequestOptions {
    [key: string]: string;
}

interface IGetRespParams {
    endpoint: string;
    options?: IRequestOptions;
}

type CallbackType<T> = (data: T) => void;

class Loader {
    protected baseLink: string;
    protected options: IRequestOptions;

    constructor(baseLink: string, options: IRequestOptions) {
        this.baseLink = baseLink;
        this.options = options;
    }

    public getResp<T>(
        { endpoint, options = {} }: IGetRespParams,
        callback: CallbackType<T> = () => {
            console.error('No callback for GET response');
        }
    ): void {
        this.load('GET', endpoint, callback, options);
    }

    protected errorHandler(res: Response): Response {
        if (!res.ok) {
            if (res.status === 401 || res.status === 404)
                console.log(`Sorry, but there is ${res.status} error: ${res.statusText}`);
            throw Error(res.statusText);
        }

        return res;
    }

    protected makeUrl(options: IRequestOptions, endpoint: string): string {
        const urlOptions: IRequestOptions = { ...this.options, ...options };
        let url = `${this.baseLink}${endpoint}?`;

        Object.keys(urlOptions).forEach((key: string) => {
            url += `${key}=${urlOptions[key]}&`;
        });

        return url.slice(0, -1);
    }

    protected load<T>(
        method: string, 
        endpoint: string, 
        callback: CallbackType<T>, 
        options: IRequestOptions = {}
    ): void {
        fetch(this.makeUrl(options, endpoint), { method })
            .then((res: Response) => this.errorHandler(res))
            .then((res: Response) => res.json())
            .then((data: T) => callback(data))
            .catch((err: Error) => console.error(err));
    }
}

export default Loader;
