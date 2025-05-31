<script setup lang="ts">
import { ref, onMounted } from 'vue';
import IconDeck from './icons/IconDeck.vue';

interface Deck {
    id: string;
    name: string;
    file: string;
    description?: string;
}

const decks = ref<Deck[]>([]);
const isLoading = ref<boolean>(true);
const error = ref<Error | null>(null);

const emit = defineEmits<{
    (e: 'deckSelected', deck: Deck): void
}>();

const fetchDecks = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        const manifestPath = `${import.meta.env.BASE_URL}manifest.json`.replace(/\/\//g, '/');
        // console.log('DeckSelector: Tentando buscar manifest de:', manifestPath); // Pode manter se quiser log
        const response = await fetch(manifestPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ao buscar ${manifestPath}`);
        }
        const data: Deck[] = await response.json();
        decks.value = data;
    } catch (e: any) {
        console.error("Falha ao buscar o manifest de decks:", e);
        error.value = e instanceof Error ? e : new Error(String(e));
        decks.value = [];
    } finally {
        isLoading.value = false;
    }
};

const selectDeck = (deck: Deck) => {
    emit('deckSelected', deck);
};

onMounted(() => {
    fetchDecks();
});
</script>

<template>
    <div class="deck-selector-container">
        <h2>Conjunto de Flashcards</h2>
        <div v-if="isLoading" class="loading-message">Carregando decks...</div>
        <div v-if="error" class="error-message">
            Erro ao carregar decks: {{ error.message }}
        </div>
        <ul v-if="!isLoading && !error && decks.length" class="deck-list">
            <li v-for="deck in decks" :key="deck.id" class="deck-item" @click="selectDeck(deck)" tabindex="0"
                @keypress.enter="selectDeck(deck)" role="button" :aria-label="`Selecionar deck ${deck.name}`">
                <div class="deck-item-content">
                    <IconDeck class="deck-item-icon" />
                    <div class="deck-info">
                        <h3>{{ deck.name }}</h3>
                        <p v-if="deck.description">{{ deck.description }}</p>
                    </div>
                </div>
            </li>
        </ul>
        <div v-if="!isLoading && !error && !decks.length" class="no-decks-message">
            Nenhum deck encontrado. Verifique o arquivo `public/manifest.json`.
        </div>
    </div>
</template>

<style scoped>
.deck-selector-container {
    width: 100%;
    /* Ocupa 100% da largura do .main-view-wrapper no App.vue */
    margin: 0;
    /* O .main-view-wrapper controla a margem superior (espaço do AppHeader) */
    padding: 20px;
    /* Padding interno consistente */
    background-color: var(--card-bg-color);
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    color: var(--card-text-color);

    display: flex;
    flex-direction: column;
    flex-grow: 1;
    /* Ocupa o espaço vertical disponível no .main-view-wrapper */
    overflow: hidden;
    /* Força a .deck-list a usar seu próprio scroll */
    box-sizing: border-box;
}

@media (max-width: 767px) {
    .deck-selector-container {
        padding: 15px;
        /* Padding menor em mobile */
    }

    .deck-selector-container h2 {
        font-size: 1.5em;
        margin-bottom: 15px;
    }

    .deck-item {
        padding: 12px 15px;
        margin-bottom: 12px;
    }

    .deck-item h3 {
        font-size: 1.1em;
    }

    .deck-item p {
        font-size: 0.8em;
    }
}

.deck-selector-container h2 {
    text-align: center;
    margin-top: 0;
    margin-bottom: 20px;
    color: var(--primary-color);
    font-size: 1.7em;
    font-weight: 500;
    flex-shrink: 0;
}

.loading-message,
.error-message,
.no-decks-message {
    text-align: center;
    padding: 20px;
    font-style: italic;
    flex-shrink: 0;
}

.error-message {
    color: var(--color-error);
    background-color: rgba(220, 53, 69, 0.05);
    border: 1px solid var(--color-error);
    border-radius: 6px;
}

.deck-list {
    list-style: none;
    padding: 0 5px 20px 5px;
    /* Padding lateral leve e padding inferior para o último item */
    margin: 0;
    overflow-y: auto;
    /* BARRA DE ROLAGEM AQUI */
    flex-grow: 1;
    /* LISTA OCUPA O ESPAÇO VERTICAL RESTANTE */
    min-height: 0;
    /* Ajuda flex-grow com overflow */
}

.deck-list::-webkit-scrollbar {
    width: 8px;
}

.deck-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
}

.deck-list::-webkit-scrollbar-thumb {
    background-color: var(--primary-color);
    border-radius: 4px;
    border: 2px solid var(--card-bg-color);
    background-clip: padding-box;
}

.deck-list::-webkit-scrollbar-thumb:hover {
    background-color: var(--button-primary-hover-bg-color);
}

.deck-list {
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color) rgba(0, 0, 0, 0.03);
}

.deck-item {
    background-color: var(--bg-color);
    border: 1px solid var(--input-border-color);
    padding: 16px 20px;
    margin-bottom: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
}

.deck-list li:last-child {
    margin-bottom: 0;
}

.deck-item:hover,
.deck-item:focus,
.deck-item:focus-visible {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
    outline: none;
}

.deck-item:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

.deck-item-content {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.deck-item-icon {
    flex-shrink: 0;
    margin-top: 2px;
}

.deck-info {
    flex-grow: 1;
    min-width: 0;
}

.deck-item h3 {
    margin-top: 0;
    margin-bottom: 4px;
    color: var(--primary-color);
    font-size: 1.1em;
    line-height: 1.3;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
}

.deck-item p {
    margin-bottom: 0;
    font-size: 0.8em;
    color: var(--text-color);
    line-height: 1.4;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
}
</style>