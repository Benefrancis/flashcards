<script setup lang="ts">
import type { DeckInfo, FlashcardData } from '@/types'; // Importe seus tipos
import { computed, ref, watch } from 'vue';
import DeckSelector from './components/DeckSelector.vue';
import Flashcard from './components/Flashcard.vue'; // Importe o componente Flashcard
import { useMarkdownParser } from './composables/useMarkdownParser';
import { useTheme } from './composables/useTheme.ts';

const AppHeader = { template: '<header class="app-header"><h1>Estuda Flashcards Cebraspe</h1></header>' }; // Adicionei uma classe ao template string

const selectedDeck = ref<DeckInfo | null>(null);
const {
  cards: currentDeckCards,
  isLoading: isLoadingCards,
  error: cardLoadingError,
  loadDeckFromFile
} = useMarkdownParser();

const currentCardIndex = ref(0);

// Observa mudanças no deck selecionado para carregar os cards
watch(selectedDeck, (newDeck, oldDeck) => { // Adicionado oldDeck para log mais claro
  console.log('selectedDeck mudou de', oldDeck?.name || null, 'para', newDeck?.name || null);
  if (newDeck) {
    currentCardIndex.value = 0; // Reseta o índice ao carregar novo deck
    loadDeckFromFile(newDeck);
  } else {
    currentDeckCards.value = []; // Limpa os cards se nenhum deck estiver selecionado
  }
}, { immediate: true }); // immediate: true para rodar o watch na montagem inicial

const currentCard = computed<FlashcardData | null>(() => {
  if (currentDeckCards.value.length > 0 && currentCardIndex.value < currentDeckCards.value.length) {
    return currentDeckCards.value[currentCardIndex.value];
  }
  return null;
});

const handleDeckSelected = (deck: DeckInfo) => {
  console.log("App.vue - handleDeckSelected:", deck.name);
  selectedDeck.value = deck;
};

const goBackToDeckSelection = () => {
  console.log("App.vue - goBackToDeckSelection: setando selectedDeck para null");
  selectedDeck.value = null;
};

const nextCard = () => {
  if (currentCardIndex.value < currentDeckCards.value.length - 1) {
    currentCardIndex.value++;
  }
};

const prevCard = () => {
  if (currentCardIndex.value > 0) {
    currentCardIndex.value--;
  }
};

// Lógica para o tema
const { currentTheme, toggleTheme } = useTheme();

// --- LÓGICA DE RESPOSTA DO CARD ATUALIZADA ---
const TIME_DELAY_CORRECT = 1500; // 1.5 segundos para resposta correta
const TIME_DELAY_INCORRECT = 60000; // 60 segundos para resposta incorreta

const handleCardAnswered = (payload: { cardId: string, correct: boolean }) => {
  console.log(`Card ${payload.cardId} respondido: ${payload.correct ? 'Correto' : 'Errado'}`);

  if (currentCardIndex.value < currentDeckCards.value.length - 1) {
    const delay = payload.correct ? TIME_DELAY_CORRECT : TIME_DELAY_INCORRECT;

    console.log(`Avançando para o próximo card em ${delay / 1000} segundos.`);

    setTimeout(() => {
      nextCard();
    }, delay);
  } else {
    console.log("Fim do deck!");
    // Poderia adicionar uma mensagem para o usuário ou opções como reiniciar/voltar.
    // Ex: showEndOfDeckMessage.value = true;
  }
};

</script>

<template>
  <div id="app-container" :class="{ 'studying-active': selectedDeck }">

    <template v-if="!selectedDeck">
      <AppHeader />
      <button @click="toggleTheme" class="theme-toggle-button">
        Mudar para {{ currentTheme === 'light' ? 'Dark' : 'Light' }}
      </button>
    </template>

    <DeckSelector v-if="!selectedDeck" @deckSelected="handleDeckSelected" />

    <div v-if="selectedDeck" class="deck-active-container">

      <div class="study-header-controls">
        <button @click="goBackToDeckSelection" class="back-button">Voltar para Decks</button>
        <button @click="toggleTheme" class="theme-toggle-button study-mode-theme-toggle">
          {{ currentTheme === 'light' ? 'Dark' : 'Light' }}
        </button>
      </div>

      <h2>Estudando: {{ selectedDeck.name }}</h2>

      <div v-if="isLoadingCards" class="loading-message">Carregando cards...</div>
      <div v-if="cardLoadingError" class="error-message">
        Erro ao carregar cards: {{ cardLoadingError }}
      </div>

      <div v-if="!isLoadingCards && !cardLoadingError && currentDeckCards.length === 0 && !isLoadingCards"
        class="no-cards-message">
        Nenhum card encontrado neste deck.
      </div>

      <div v-if="currentCard" class="flashcard-area">
        <Flashcard :cardData="currentCard" :key="currentCard.id" @answered="handleCardAnswered"
          :autoFocusInput="true" />
      </div>
      <div v-if="currentCard" class="navigation-controls">
        <button @click="prevCard" :disabled="currentCardIndex === 0">Anterior</button>
        <span>Card {{ currentCardIndex + 1 }} de {{ currentDeckCards.length }}</span>
        <button @click="nextCard" :disabled="currentCardIndex >= currentDeckCards.length - 1">Próximo</button>
      </div>
    </div>
  </div>
</template>

<style>
/* Seus estilos globais do App.vue, theme.css já deve estar importado em main.ts */

html,
body {
  height: 100%;
  margin: 0;
  overflow: hidden;
  /* Previne scroll da página inteira quando em modo de estudo */
}



#app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  min-height: 100vh;
  width: 100%;
  transition: padding 0.3s ease;
}

/* Quando um deck está ativo (modo estudo 100%) */
#app-container.studying-active {
  padding: 0;
  justify-content: center;
  overflow: hidden;
}

.app-header {
  width: 100%;
  padding: 10px;
  background-color: var(--secondary-color);
  color: var(--bg-color);
  text-align: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.theme-toggle-button {
  position: fixed;
  top: 15px;
  right: 20px;
  padding: 8px 12px;
  background-color: var(--secondary-color);
  color: var(--bg-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
  font-size: 0.9em;
}

.theme-toggle-button:hover {
  opacity: 0.8;
}

.deck-active-container {
  margin-top: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--bg-color);
  position: relative;
  border-radius: 8px;
  /* box-shadow: 0 2px 10px rgba(0,0,0,0.05); */
}


.study-mode-theme-toggle {
  position: absolute;
  top: 15px;
  right: 15px;
}

.study-header-controls {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
  position: absolute;
  top: 20px;
  left: 0;
  z-index: 10;
}


.flashcard-area {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding-top: 60px;
}

.deck-active-container h2 {
  color: var(--primary-color);
  margin-bottom: 15px;
  text-align: center;
  font-size: 2em;
  flex-shrink: 0;
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
}


.back-button {
  align-self: flex-start;
  margin-bottom: 15px;
  padding: 8px 12px;
  background-color: var(--secondary-color);
  color: var(--bg-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.back-button:hover {
  opacity: 0.9;
}


.navigation-controls {
  margin-top: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 550px;
  flex-shrink: 0;
}

.navigation-controls button {
  padding: 10px 15px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.navigation-controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.navigation-controls span {
  margin: 0 15px;
  color: var(--text-color);
}

.loading-message,
.error-message,
.no-cards-message {
  text-align: center;
  padding: 20px;
  margin-top: 20px;
  font-style: italic;
  width: 100%;
  max-width: 500px;
  border-radius: 5px;
}

.error-message {
  color: var(--color-error);
  background-color: #f8d7da;
  border: 1px solid var(--color-error);
}

.no-cards-message {
  color: var(--text-color);
  background-color: #e2e3e5;
  border: 1px solid #d6d8db;
}
</style>