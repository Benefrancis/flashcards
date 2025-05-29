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

        const manifestPath = `${import.meta.env.BASE_URL}manifest.json`.replace(/\/\//g, '/'); // Evita barras duplas
    
        console.log('Tentando buscar manifest de:', manifestPath); // Log para depuração

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
    margin: 20px auto; /* Margem geral */
    padding: 20px 25px; /* Padding interno */
    background-color: var(--card-bg-color);
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    color: var(--card-text-color);
    display: flex;
    flex-direction: column;
    /* Altura total do seletor de decks. 
       Subtrai o padding do #app-container (40px) e uma margem extra (40px) */
    height: calc(100vh - 80px); 
    max-height: 700px; /* Limite máximo para telas desktop muito altas */
}

/* Ajustes para telas menores (mobile) */
@media (max-width: 767px) {
  .deck-selector-container {
    margin: 10px; /* Menos margem lateral em mobile */
    padding: 15px 20px; /* Menos padding interno */
    /* Para mobile, tentar usar quase toda altura, considerando barras de navegador e padding do #app-container */
    /* O padding do #app-container é 20px, então 100vh - 2*20px (topo/baixo do app) - 2*10px (margem do container) */
    height: calc(100vh - 40px - 20px); 
    max-height: none; /* Remove o max-height de 700px para mobile, deixando o height controlar */
  }
  .deck-selector-container h2 {
    font-size: 1.5em; /* Título menor em mobile */
    margin-bottom: 15px;
  }
}


.deck-selector-container h2 {
    text-align: center;
    margin-top: 0;
    margin-bottom: 25px;
    color: var(--primary-color);
    font-size: 1.8em;
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
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex-grow: 1; /* Faz a lista ocupar o espaço disponível */
    /* Adiciona padding na parte de baixo DENTRO da área de scroll */
    padding-bottom: 30px; /* AUMENTADO: Espaço extra no final da lista para garantir visibilidade do último item */
                           /* Ajuste este valor conforme necessário */
}

.deck-list::-webkit-scrollbar {
    width: 8px;
}
.deck-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}
.deck-list::-webkit-scrollbar-thumb {
    background-color: var(--primary-color);
    border-radius: 4px;
    border: 2px solid var(--card-bg-color); /* Usar --card-bg-color para o 'track' da borda */
    background-clip: padding-box;
}
.deck-list::-webkit-scrollbar-thumb:hover {
    background-color: var(--button-primary-hover-bg-color);
}
.deck-list {
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) rgba(0,0,0,0.05);
}

.deck-item {
    background-color: var(--bg-color);
    border: 1px solid var(--input-border-color);
    padding: 16px 20px; /* Ajustado */
    margin-bottom: 16px; /* Ajustado */
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
}
.deck-list li:last-child {
     /* margin-bottom: 0; */ /* Com padding-bottom na ul, a margem do último item pode não ser mais necessária
                                ou pode precisar ser ajustada em conjunto com o padding-bottom da ul.
                                Se o último item ainda estiver cortado, experimente adicionar um margin-bottom aqui.
                                Ex: margin-bottom: 10px; */
}

.deck-item:hover,
.deck-item:focus,
.deck-item:focus-visible {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    border-color: var(--primary-color);
    outline: none;
}
.deck-item:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

.deck-item-content {
    display: flex;
    align-items: center;
}
.deck-info {
    flex-grow: 1;
}
.deck-item h3 {
    margin-top: 0;
    margin-bottom: 6px;
    color: var(--primary-color);
    font-size: 1.2em; /* Ajustado */
}
.deck-item p {
    margin-bottom: 0;
    font-size: 0.85em; /* Ajustado */
    color: var(--text-color);
    line-height: 1.5;
}
</style>