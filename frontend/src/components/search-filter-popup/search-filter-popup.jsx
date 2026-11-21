import { useState } from 'react';

import './search-filter-popup.css';

export const DEFAULT_SEARCH_FILTERS = {
  sort: 'alphabetical',
  maxDistance: 100,
  categories: []
};

export const SEARCH_CATEGORIES = [
  { id: 'lanches', name: 'Lanches', terms: ['lanche', 'hamburg', 'burger', 'sanduiche'] },
  { id: 'bolos-doces', name: 'Bolos & Doces', terms: ['bolo', 'doce', 'confeitaria', 'sobremesa'] },
  { id: 'salgados', name: 'Salgados', terms: ['salgado', 'coxinha', 'pastel', 'esfiha'] },
  { id: 'padaria', name: 'Padaria', terms: ['padaria', 'pao', 'panificadora'] },
  { id: 'cachorro-quente', name: 'Cachorro-Quente', terms: ['cachorro quente', 'hot dog', 'hotdog'] },
  { id: 'sorvetes', name: 'Sorvetes', terms: ['sorvete', 'gelato', 'acai'] },
  { id: 'japonesa', name: 'Japonesa', terms: ['japonesa', 'japones', 'sushi', 'temaki'] },
  { id: 'carne', name: 'Carne', terms: ['carne', 'churrasco', 'churrascaria', 'steak'] },
  { id: 'chinesa', name: 'Chinesa', terms: ['chinesa', 'chines', 'yakisoba'] },
  { id: 'pizza', name: 'Pizza', terms: ['pizza', 'pizzaria'] },
  { id: 'italiana', name: 'Italiana', terms: ['italiana', 'italiano', 'massa', 'macarrao'] },
  { id: 'bebidas', name: 'Bebidas', terms: ['bebida', 'suco', 'cafe', 'bar'] }
];

const SORT_OPTIONS = [
  { id: 'alphabetical', label: 'Padrão', icon: 'alphabetical' },
  { id: 'highest-price', label: 'Maior preço', icon: 'highest' },
  { id: 'lowest-price', label: 'Menor preço', icon: 'lowest' },
  { id: 'nearest', label: 'Menor distância', icon: 'distance' }
];

function SortIcon({ type }) {
  if (type === 'alphabetical') {
    return <span className="search-filter-sort-symbol">A↓Z</span>;
  }

  if (type === 'highest') {
    return <span className="search-filter-sort-symbol">R$↑</span>;
  }

  if (type === 'lowest') {
    return <span className="search-filter-sort-symbol">R$↓</span>;
  }

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SearchFilterPopup({
  filters,
  onClose,
  onApply
}) {
  // Alterações só são aplicadas ao clicar em Ver resultados.
  const [draft, setDraft] = useState(() => ({
    sort: filters.sort,
    maxDistance: filters.maxDistance,
    categories: [...filters.categories]
  }));

  function handleSort(sort) {
    setDraft((current) => ({
      ...current,
      sort
    }));
  }

  function handleDistance(value) {
    setDraft((current) => ({
      ...current,
      maxDistance: Number(value)
    }));
  }

  function handleCategory(categoryId) {
    setDraft((current) => {
      const selected = current.categories.includes(categoryId);

      return {
        ...current,
        categories: selected
          ? current.categories.filter((id) => id !== categoryId)
          : [...current.categories, categoryId]
      };
    });
  }

  function handleClear() {
    setDraft({
      ...DEFAULT_SEARCH_FILTERS,
      categories: []
    });
  }

  function handleApply() {
    onApply({
      ...draft,
      categories: [...draft.categories]
    });
  }

  const distancePercent =
    ((draft.maxDistance - 1) / 99) * 100;

  return (
    <div
      className="search-filter-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="search-filter-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-filter-title"
      >
        {/* CABEÇALHO FIXO */}
        <header className="search-filter-header">
          <button
            type="button"
            className="search-filter-close"
            onClick={onClose}
            aria-label="Fechar filtros"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 9 7 7 7-7" />
            </svg>
          </button>

          <h2 id="search-filter-title">Filtros</h2>

          <button
            type="button"
            className="search-filter-clear"
            onClick={handleClear}
          >
            Limpar
          </button>
        </header>

        {/* CONTEÚDO COM SCROLL */}
        <div className="search-filter-body">
          <section className="search-filter-section">
            <h3>Ordenar por</h3>

            <div className="search-filter-sort-options">
              {SORT_OPTIONS.map((option) => {
                const selected = draft.sort === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`search-filter-sort-option ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() => handleSort(option.id)}
                    aria-pressed={selected}
                  >
                    <span className="search-filter-sort-circle">
                      <SortIcon type={option.icon} />
                    </span>

                    <span className="search-filter-sort-label">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="search-filter-section">
            <h3>Distância máxima</h3>

            <p className="search-filter-description">
              Mostrar resultados até {draft.maxDistance} km
            </p>

            <div className="search-filter-distance-labels">
              <span>1 km</span>
              <strong>{draft.maxDistance} km</strong>
              <span>100 km</span>
            </div>

            <input
              type="range"
              className="search-filter-distance-slider"
              min="1"
              max="100"
              step="1"
              value={draft.maxDistance}
              onChange={(event) =>
                handleDistance(event.target.value)
              }
              style={{
                '--slider-progress': `${distancePercent}%`
              }}
              aria-label="Distância máxima"
            />
          </section>

          <section className="search-filter-section">
            <h3>Categorias</h3>

            <p className="search-filter-description">
              Selecione uma ou mais categorias. Sem seleção,
              todas são consideradas.
            </p>

            <div className="search-filter-categories">
              {SEARCH_CATEGORIES.map((category) => {
                const selected =
                  draft.categories.includes(category.id);

                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`search-filter-category ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() =>
                      handleCategory(category.id)
                    }
                    aria-pressed={selected}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* RODAPÉ FIXO */}
        <footer className="search-filter-footer">
          <button
            type="button"
            className="search-filter-apply"
            onClick={handleApply}
          >
            Ver resultados
          </button>
        </footer>
      </section>
    </div>
  );
}

export default SearchFilterPopup;