import './sources.css';
import { ISource } from '../../../types/index';

class Sources {
    private container: HTMLElement | null = null;
    private selectedId: string | null = null;

    public draw(data: ISource[], selectedId: string | null = null): void {
        const fragment: DocumentFragment = document.createDocumentFragment();
        const sourceItemTemp = document.querySelector('#sourceItemTemp') as HTMLTemplateElement;

        if (!sourceItemTemp) return;

        data.forEach((item: ISource) => {
            const sourceClone = sourceItemTemp.content.cloneNode(true) as DocumentFragment;

            const itemName = sourceClone.querySelector('.source__item-name');
            if (itemName) itemName.textContent = item.name;

            const itemContainer = sourceClone.querySelector<HTMLButtonElement>('.source__item');
            if (itemContainer) {
                itemContainer.setAttribute('data-source-id', item.id);
                const isSelected = selectedId !== null && item.id === selectedId;
                itemContainer.setAttribute('aria-pressed', String(isSelected));
                if (isSelected) {
                    itemContainer.classList.add('source__item--selected');
                }
            }

            fragment.append(sourceClone);
        });

        const sourcesContainer = document.querySelector<HTMLElement>('.sources');
        if (sourcesContainer) {
            sourcesContainer.innerHTML = '';
            sourcesContainer.append(fragment);
        }
        this.container = sourcesContainer;
        this.selectedId = selectedId;
    }

    public setSelected(sourceId: string): void {
        this.selectedId = sourceId;
        if (!this.container) {
            this.container = document.querySelector<HTMLElement>('.sources');
        }
        if (!this.container) return;

        this.container.querySelectorAll<HTMLButtonElement>('.source__item').forEach((el) => {
            const isSelected = el.getAttribute('data-source-id') === sourceId;
            el.classList.toggle('source__item--selected', isSelected);
            el.setAttribute('aria-pressed', String(isSelected));
        });
    }

    public getSelected(): string | null {
        return this.selectedId;
    }
}

export default Sources;
