import './news.css';
import { NewsCardProps } from '../../../types/index';

class News {
    public draw(data: ReadonlyArray<Readonly<NewsCardProps>>): void {
        const news: ReadonlyArray<Readonly<NewsCardProps>> =
            data.length >= 10 ? data.filter((_, idx: number) => idx < 10) : data;

        const fragment: DocumentFragment = document.createDocumentFragment();
        const newsItemTemp = document.querySelector('#newsItemTemp') as HTMLTemplateElement;

        if (!newsItemTemp) return;

        news.forEach((item: Readonly<NewsCardProps>, idx: number) => {
            const newsClone = newsItemTemp.content.cloneNode(true) as DocumentFragment;

            if (idx % 2) {
                const newsItem = newsClone.querySelector('.news__item');
                if (newsItem) newsItem.classList.add('alt');
            }

            const metaPhoto = newsClone.querySelector('.news__meta-photo') as HTMLElement;
            if (metaPhoto) {
                metaPhoto.style.backgroundImage = `url(${item.urlToImage || 'img/news_placeholder.jpg'})`;
            }

            const metaAuthor = newsClone.querySelector('.news__meta-author');
            if (metaAuthor) metaAuthor.textContent = item.author || item.source.name;

            const metaDate = newsClone.querySelector('.news__meta-date');
            if (metaDate && item.publishedAt) {
                const dateText: string = item.publishedAt;
                metaDate.textContent = dateText.slice(0, 10).split('-').reverse().join('-');
            }

            const descTitle = newsClone.querySelector('.news__description-title');
            if (descTitle) descTitle.textContent = item.title;

            const descSource = newsClone.querySelector('.news__description-source');
            if (descSource) descSource.textContent = item.source.name;

            const descContent = newsClone.querySelector('.news__description-content');
            if (descContent) descContent.textContent = item.description || '';

            const readMoreLink = newsClone.querySelector('.news__read-more a');
            if (readMoreLink) readMoreLink.setAttribute('href', item.url);

            fragment.append(newsClone);
        });

        const newsContainer = document.querySelector('.news');
        if (newsContainer) {
            newsContainer.innerHTML = '';
            newsContainer.appendChild(fragment);
        }
    }
}

export default News;
