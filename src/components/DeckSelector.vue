<template>
    <div class="deck-selector-container">
        <h2>Escolha um Conjunto de Flashcards</h2>
        <div v-if="isLoading" class="loading-message">Carregando decks...</div>
        <div v-if="error" class="error-message">
            Erro ao carregar decks: {{ error.message }}
        </div>
        <ul v-if="!isLoading && !error && decks.length" class="deck-list">
            <li v-for="deck in decks" :key="deck.id" class="deck-item" @click="selectDeck(deck)" tabindex="0"
                @keypress.enter="selectDeck(deck)">
                <h3>{{ deck.name }}</h3>
                <p v-if="deck.description">{{ deck.description }}</p>
            </li>
        </ul>
        <div v-if="!isLoading && !error && !decks.length" class="no-decks-message">
            Nenhum deck encontrado. Verifique o arquivo `public/manifest.json`.
        </div>
    </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue';

// Interface para os dados do deck, correspondendo ao manifest.json
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
        const response = await fetch('/manifest.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // O TypeScript infere 'data' como 'any' aqui, a menos que você
        // forneça um tipo genérico para response.json<Deck[]>()
        // Ou faça um type assertion: const data = await response.json() as Deck[];
        const data: Deck[] = await response.json();
        decks.value = data;
    } catch (e) {
        console.error("Falha ao buscar o manifest de decks:", e);
        if (e instanceof Error) {
            error.value = e;
        } else {
            error.value = new Error(String(e));
        }
        decks.value = [];
    } finally {
        isLoading.value = false;
    }
};

const selectDeck = (deck: Deck) => { // Tipa o parâmetro
    console.log("Deck selecionado:", deck);
    emit('deckSelected', deck);
};

onMounted(() => {
    fetchDecks();
});

</script>

<style scoped>
.deck-selector-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    background-color: var(--card-bg-color);
    /* Usa variável de tema */
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    color: var(--card-text-color);
    /* Usa variável de tema */
}

.deck-selector-container h2 {
    text-align: center;
    margin-bottom: 25px;
    color: var(--primary-color);
    /* Cor primária do tema */
}

.loading-message,
.error-message,
.no-decks-message {
    text-align: center;
    padding: 20px;
    font-style: italic;
}

.error-message {
    color: var(--color-error);
    /* Cor de erro do tema */
    background-color: #f8d7da;
    /* Um fundo claro para erro */
    border: 1px solid var(--color-error);
    border-radius: 4px;
}

.deck-list {
    list-style: none;
    padding: 0;
}

.deck-item {
    background-color: var(--bg-color);
    /* Fundo ligeiramente diferente do card principal */
    border: 1px solid var(--input-border-color);
    padding: 15px 20px;
    margin-bottom: 15px;
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.deck-item:hover,
.deck-item:focus {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    outline: 2px solid var(--primary-color);
    /* Destaque de foco */
}

.deck-item h3 {
    margin-top: 0;
    margin-bottom: 8px;
    color: var(--primary-color);
}

.deck-item p {
    margin-bottom: 0;
    font-size: 0.9em;
    color: var(--text-color);
    /* Cor de texto secundária do tema */
}
</style>