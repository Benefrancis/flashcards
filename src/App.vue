<script setup lang="ts">
import type { DeckInfo, FlashcardData } from '@/types';
import { computed, ref, watch } from 'vue';
import DeckSelector from './components/DeckSelector.vue';
import Flashcard from './components/Flashcard.vue';
import AppHeader from './components/AppHeader.vue';
import IconSun from './components/icons/IconSun.vue';
import IconMoon from './components/icons/IconMoon.vue';
import IconArrowLeft from './components/icons/IconArrowLeft.vue'; // Importando o ícone de seta
import { useMarkdownParser } from './composables/useMarkdownParser';
import { useTheme } from './composables/useTheme';

const selectedDeck = ref<DeckInfo | null>(null);
const {
  cards: currentDeckCards,
  isLoading: isLoadingCards,
  error: cardLoadingError,
  loadDeckFromFile
} = useMarkdownParser();

const currentCardIndex = ref(0);

// Observa mudanças no selectedDeck e carrega o deck selecionado
watch(selectedDeck, async (newDeck, oldDeck) => { // Marcado como async para o await
  console.log('App.vue: selectedDeck mudou de', oldDeck?.name || 'null', 'para', newDeck?.name || 'null');
  if (newDeck) {
    currentCardIndex.value = 0;
    // loadDeckFromFile agora é parte do composable useMarkdownParser
    // e ele já define isLoading, error, e cards.value
    await loadDeckFromFile(newDeck); // Espera o carregamento e parsing

    if (currentDeckCards.value && currentDeckCards.value.length > 0) {
      console.log('App.vue: Cards carregados, embaralhando...');
      // Embaralha a cópia do array para não modificar a ref reativa diretamente de forma inesperada
      // ou, se currentDeckCards.value é o array que queremos modificar:
      currentDeckCards.value = shuffleArray([...currentDeckCards.value]); // Embaralha uma cópia e reatribui
      console.log('App.vue: Cards embaralhados.', currentDeckCards.value.map(c => c.id)); // Log para ver a nova ordem
    }
  } else {
    currentDeckCards.value = [];
  }
}, { immediate: true });




const currentCard = computed<FlashcardData | null>(() => {
  if (currentDeckCards.value.length > 0 && currentCardIndex.value < currentDeckCards.value.length) {
    return currentDeckCards.value[currentCardIndex.value];
  }
  return null;
});

const handleDeckSelected = (deck: DeckInfo) => {
  selectedDeck.value = deck;
};

const goBackToDeckSelection = () => {
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

const { currentTheme, toggleTheme } = useTheme();

const TIME_DELAY_CORRECT = 120000;
const TIME_DELAY_INCORRECT = 120000;

const handleCardAnswered = (payload: { cardId: string, correct: boolean, direction?: 'V' | 'F' }) => {
  console.log(`App.vue: Card ${payload.cardId} respondido: ${payload.correct ? 'Correto' : 'Errado'}`, payload.direction ? `Direção: ${payload.direction}` : '');
  if (currentCardIndex.value < currentDeckCards.value.length - 1) {
    const delay = payload.correct ? TIME_DELAY_CORRECT : TIME_DELAY_INCORRECT;
    setTimeout(() => {
      nextCard();
    }, delay);
  } else {
    console.log("App.vue: Fim do deck!");
  }
};

const handleSkipNext = () => {
  if (currentCardIndex.value < currentDeckCards.value.length - 1) {
    nextCard();
  }
};

const handleSkipPrev = () => {
  if (currentCardIndex.value > 0) {
    prevCard();
  }
};

// Função para embaralhar o array de cards (Fisher-Yates shuffle)
const shuffleArray = (array: FlashcardData[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Troca os elementos
  }
  return array; // Retorna o array embaralhado (modifica o original)
};




</script>

<template>
  <div id="app-container" :class="{ 'studying-active': selectedDeck }">

    <template v-if="!selectedDeck">
      <AppHeader />
      <button @click="toggleTheme" class="theme-toggle-button"
        :aria-label="currentTheme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'" title="Mudar tema">
        <IconSun v-if="currentTheme === 'dark'" />
        <IconMoon v-else />
      </button>
    </template>

    <DeckSelector v-if="!selectedDeck" @deckSelected="handleDeckSelected" />

    <div v-if="selectedDeck" class="deck-active-container">

      <div class="study-header-controls">
        <button @click="goBackToDeckSelection" class="back-button icon-button" aria-label="Voltar para seleção de decks"
          title="Voltar para Decks">
          <IconArrowLeft />
        </button>
        <button @click="toggleTheme" class="theme-toggle-button study-mode-theme-toggle"
          :aria-label="currentTheme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'" title="Mudar tema">
          <IconSun v-if="currentTheme === 'dark'" />
          <IconMoon v-else />
        </button>
      </div>

      <h2 v-if="selectedDeck">{{ selectedDeck.name }}</h2>

      <div v-if="isLoadingCards" class="loading-message">Carregando cards...</div>
      <div v-if="cardLoadingError" class="error-message">
        Erro ao carregar cards: {{ cardLoadingError }}
      </div>
      <div v-if="!isLoadingCards && !cardLoadingError && currentDeckCards.length === 0 && selectedDeck"
        class="no-cards-message">
        Nenhum card encontrado neste deck.
      </div>

      <div v-if="currentCard" class="flashcard-area">
        <Flashcard :cardData="currentCard" :key="currentCard.id" @answered="handleCardAnswered"
          @skipNext="handleSkipNext" @skipPrev="handleSkipPrev" />
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
html,
body {
  height: 100%;
  margin: 0;
  overflow: hidden;
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

#app-container.studying-active {
  padding: 0;
  overflow: hidden;
}

#app-container>.app-header {
  margin-bottom: 20px;
}

.theme-toggle-button {
  position: fixed;
  top: 15px;
  right: 20px;
  padding: 6px;
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid transparent;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1000;
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s, color 0.2s;
}

.theme-toggle-button:hover {
  background-color: var(--button-primary-hover-bg-color);
  color: white;
  border-color: var(--button-primary-hover-bg-color);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.theme-toggle-button:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.deck-active-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--bg-color);
  position: relative;
}

.study-header-controls {
  width: calc(100% - 40px);
  max-width: 1200px;
  margin: 0 auto 15px auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.study-mode-theme-toggle {
  position: relative;
  top: auto;
  right: auto;
  /* Herda outros estilos de .theme-toggle-button, mas não é 'fixed' */
}

.back-button.icon-button {
  background-color: transparent;
  color: var(--secondary-color);
  border: 1px solid transparent;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.back-button.icon-button:hover {
  background-color: rgba(128, 128, 128, 0.1);
  border-color: var(--input-border-color);
  color: var(--primary-color);
}

.back-button.icon-button:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.back-button.icon-button .action-icon {
  /* Se o SVG tiver a classe action-icon */
  width: 20px;
  height: 20px;
}


.deck-active-container h2 {
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
  font-size: 1.6em;
  font-weight: 500;
  flex-shrink: 0;
  width: 100%;
  max-width: calc(100% - 160px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flashcard-area {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin-bottom: 10px;
}

.navigation-controls {
  padding-top: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px;
  flex-shrink: 0;
}

/* .back-button (estilo de texto antigo) removido, pois agora é .back-button.icon-button */

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
  margin: auto;
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