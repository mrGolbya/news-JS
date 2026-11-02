interface IRequestOptions {
    [key: string]: string;
}

interface IGetRespParams {
    endpoint: string;
    options?: IRequestOptions;
}

type CallbackType<T> = (data: T) => void;
type ErrorCallback = (error: Error) => void;

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
        },
        errorCallback?: ErrorCallback
    ): void {
        this.load('GET', endpoint, callback, options, errorCallback);
    }

    protected makeUrl(options: IRequestOptions, endpoint: string): string {
        const url = new URL(`${this.baseLink}${endpoint}`);
        const urlOptions: IRequestOptions = { ...this.options, ...options };

        Object.entries(urlOptions).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        return url.toString();
    }

    protected getErrorMessage(data: unknown, fallback: string): string {
        if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
            return data.message;
        }

        return fallback;
    }

    protected load<T>(
        method: string,
        endpoint: string,
        callback: CallbackType<T>,
        options: IRequestOptions = {},
        errorCallback?: ErrorCallback
    ): void {
        fetch(this.makeUrl(options, endpoint), { method })
            .then(async (res: Response) => {
                const data: unknown = await res.json();
                if (!res.ok) {
                    throw new Error(this.getErrorMessage(data, `${res.status} ${res.statusText}`));
                }
                return data as T;
            })
            .then((data: T) => callback(data))
            .catch((err: unknown) => {
                const error = err instanceof Error ? err : new Error(String(err));
                if (errorCallback) {
                    errorCallback(error);
                } else {
                    console.error(error);
                }
            });
    }
}

export default Loader;
