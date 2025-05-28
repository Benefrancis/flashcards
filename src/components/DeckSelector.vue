<script setup lang="ts">
import { ref, onMounted } from 'vue';
import IconDeck from './icons/IconDeck.vue'; // <-- IMPORTAR O ÍCONE

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
    // ... (sua função fetchDecks existente) ...
    isLoading.value = true;
    error.value = null;
    try {
        const response = await fetch('/manifest.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
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
        <h2>Escolha um Conjunto de Flashcards</h2>
        <div v-if="isLoading" class="loading-message">Carregando decks...</div>
        <div v-if="error" class="error-message">
            Erro ao carregar decks: {{ error.message }}
        </div>
        <ul v-if="!isLoading && !error && decks.length" class="deck-list">
            <li v-for="deck in decks" :key="deck.id" class="deck-item" @click="selectDeck(deck)" tabindex="0"
                @keypress.enter="selectDeck(deck)" role="button" :aria-label="`Selecionar deck ${deck.name}`">
                <div class="deck-item-content">
                    <IconDeck />
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
    max-width: 700px;
    /* Ajustado para talvez um pouco mais de largura */
    margin: 40px auto;
    /* Mais margem no topo */
    padding: 25px 30px;
    /* Padding aumentado */
    background-color: var(--card-bg-color);
    border-radius: 12px;
    /* Bordas mais suaves */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    /* Sombra mais suave */
    color: var(--card-text-color);
}

.deck-selector-container h2 {
    text-align: center;
    margin-bottom: 30px;
    /* Mais espaço abaixo do título */
    color: var(--primary-color);
    font-size: 1.8em;
    /* Tamanho do título aumentado */
    font-weight: 500;
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
    background-color: rgba(220, 53, 69, 0.05);
    /* Fundo mais sutil */
    border: 1px solid var(--color-error);
    border-radius: 6px;
    /* Bordas mais suaves */
}

.deck-list {
    list-style: none;
    padding: 0;
}

.deck-item {
    background-color: var(--bg-color);
    border: 1px solid var(--input-border-color);
    padding: 18px 22px;
    /* Padding ajustado */
    margin-bottom: 18px;
    /* Espaçamento aumentado */
    border-radius: 8px;
    /* Bordas mais suaves */
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

.deck-item:hover,
.deck-item:focus,
.deck-item:focus-visible {
    /* Para garantir estilo de foco visível */
    transform: translateY(-4px) scale(1.01);
    /* Efeito de elevação sutil */
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    border-color: var(--primary-color);
    /* Destaca a borda com a cor primária */
    outline: none;
    /* Remove o outline padrão se o border-color já for suficiente */
}

/* Se precisar de um outline no foco visível, mesmo com a borda */
.deck-item:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}


.deck-item-content {
    /* NOVO: Para alinhar ícone e texto */
    display: flex;
    align-items: center;
    /* Alinha o ícone e o bloco de texto verticalmente */
}

.deck-info {
    /* NOVO: Para o bloco de texto do deck */
    flex-grow: 1;
    /* Para que o texto ocupe o espaço restante */
}

.deck-item h3 {
    margin-top: 0;
    margin-bottom: 6px;
    /* Espaço ajustado */
    color: var(--primary-color);
    /* Mantém a cor primária para o nome do deck */
    font-size: 1.25em;
    /* Nome do deck um pouco maior */
}

.deck-item p {
    margin-bottom: 0;
    font-size: 0.9em;
    color: var(--text-color);
    line-height: 1.5;
    /* Melhor legibilidade para descrição */
}
</style>