<script setup lang="ts">
import type { DeckInfo, FlashcardData } from '@/types';
import { computed, ref, watch, onUnmounted, type Ref } from 'vue';
import DeckSelector from './components/DeckSelector.vue';
import Flashcard from './components/Flashcard.vue';
import AppHeader from './components/AppHeader.vue'; // AppHeader será modificado para conter logo e botão de tema
import IconArrowLeft from './components/icons/IconArrowLeft.vue'; // Para o botão de voltar no modo estudo
// IconSun e IconMoon agora são gerenciados dentro do AppHeader.vue para o botão principal
// E podem ser importados aqui se usados no botão de tema do modo estudo
import IconSun from './components/icons/IconSun.vue';   // Para o botão de tema no modo estudo
import IconMoon from './components/icons/IconMoon.vue'; // Para o botão de tema no modo estudo
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

const cardTimerValue = ref(0);
const cardTimerInterval: Ref<number | undefined> = ref(undefined);
const isCardTimerPaused = ref(true);

const clearCardTimer = () => {
  if (cardTimerInterval.value !== undefined) {
    clearInterval(cardTimerInterval.value);
    cardTimerInterval.value = undefined;
  }
  isCardTimerPaused.value = true;
};

const startOrResumeCardTimer = () => {
  clearCardTimer();
  cardTimerValue.value = 0;
  isCardTimerPaused.value = false;
  cardTimerInterval.value = window.setInterval(() => {
    if (!isCardTimerPaused.value) {
      cardTimerValue.value++;
    }
  }, 1000);
};

const pauseCardTimer = () => {
  isCardTimerPaused.value = true;
};

const shuffleArray = (array: FlashcardData[]) => {
  if (!array || array.length === 0) return [];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

watch(selectedDeck, async (newDeck) => {
  clearCardTimer();
  if (newDeck) {
    currentCardIndex.value = 0;
    await loadDeckFromFile(newDeck);
    if (currentDeckCards.value && currentDeckCards.value.length > 0) {
      const shuffledCards = shuffleArray([...currentDeckCards.value]);
      currentDeckCards.value = shuffledCards;
    }
  } else {
    currentDeckCards.value = [];
  }
}, { immediate: true });

const currentCard = computed<FlashcardData | null>(() => {
  const cards = currentDeckCards.value;
  const index = currentCardIndex.value;
  if (cards && cards.length > 0 && index >= 0 && index < cards.length) {
    return cards[index];
  }
  return null;
});

watch(currentCard, (newCard) => {
  if (!newCard) {
    clearCardTimer();
  }
});

const handleDeckSelected = (deck: DeckInfo) => { selectedDeck.value = deck; };
const goBackToDeckSelection = () => { selectedDeck.value = null; };

const nextCard = () => {
  clearCardTimer();
  if (currentDeckCards.value && currentCardIndex.value < currentDeckCards.value.length - 1) {
    currentCardIndex.value++;
  }
};
const prevCard = () => {
  clearCardTimer();
  if (currentCardIndex.value > 0) {
    currentCardIndex.value--;
  }
};

const { currentTheme, toggleTheme } = useTheme(); // toggleTheme será usado pelo AppHeader e pelo botão no modo estudo

const handleCardAnswered = (payload: { cardId: string, correct: boolean, direction?: 'V' | 'F' }) => {
  pauseCardTimer();
  if (currentDeckCards.value && currentCardIndex.value >= currentDeckCards.value.length - 1 && currentCard.value && payload.cardId === currentCard.value.id) {
    console.log("App.vue: Fim do deck!");
  }
};
const handleSkipNext = () => { nextCard(); };
const handleSkipPrev = () => { prevCard(); };

const handleFlashcardFlipped = (isNowFlipped: boolean) => {
  if (isNowFlipped) { pauseCardTimer(); }
  else { startOrResumeCardTimer(); }
};
const handleFlashcardFrontShown = () => { startOrResumeCardTimer(); };

onUnmounted(() => { clearCardTimer(); });
</script>

<template>
  <div id="app-container" :class="{ 'studying-active': selectedDeck }">
    <div class="content-area">

      <template v-if="!selectedDeck">
        <AppHeader />
        <div class="main-view-wrapper">
          <DeckSelector @deckSelected="handleDeckSelected" />
        </div>
      </template>

      <div v-if="selectedDeck" class="deck-active-container">
        <div class="study-header-controls">
          <button @click="goBackToDeckSelection" class="back-button icon-button"
            aria-label="Voltar para seleção de decks" title="Voltar para Decks">
            <IconArrowLeft />
          </button>
          <button @click="toggleTheme" class="theme-toggle-button study-mode-theme-toggle"
            :aria-label="currentTheme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'" title="Mudar tema">


            <span v-if="currentTheme === 'dark'">☀️</span>
            <span v-else>🌙</span>

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
          <Flashcard :cardData="currentCard" :key="currentCard.id" :timerValue="cardTimerValue"
            :isTimerPaused="isCardTimerPaused" @answered="handleCardAnswered" @skipNext="handleSkipNext"
            @skipPrev="handleSkipPrev" @flipped="handleFlashcardFlipped" @frontShown="handleFlashcardFrontShown" />
        </div>
        <div v-if="currentCard" class="navigation-controls">
          <button @click="prevCard" :disabled="currentCardIndex === 0">Anterior</button>
          <span>Card {{ currentCardIndex + 1 }} de {{ currentDeckCards ? currentDeckCards.length : 0 }}</span>
          <button @click="nextCard"
            :disabled="!currentDeckCards || currentCardIndex >= currentDeckCards.length - 1">Próximo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
html,
body {
  height: 100%;
  margin: 0;
  background-color: var(--bg-color);
  font-family: var(--font-family-base);
}

#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-color);
}

.content-area {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  /* align-items: center; O AppHeader e o main-view-wrapper cuidam do alinhamento/largura */
  padding: 0;
  /* Sem padding aqui, os filhos controlam */
  box-sizing: border-box;
  overflow-y: hidden;
  /* O scroll principal será dentro do .main-view-wrapper */
}

#app-container:not(.studying-active) .content-area {
  /* Quando não está estudando, o content-area pode ter seu próprio scroll se 
     o header + main-view-wrapper forem maiores que a tela.
     O main-view-wrapper terá o scroll para a lista de decks. */
  overflow-y: auto;
  padding: 20px;
  /* Padding geral quando não está estudando */
  align-items: center;
  /* Centraliza o AppHeader e o main-view-wrapper */
}

.main-view-wrapper {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  /* align-items: center; Os filhos usarão width: 100% */
  flex-grow: 1;
  min-height: 0;
  /* Ajuda o flex-grow com overflow */
  /* overflow: hidden;  Comentado, o DeckSelector controla seu scroll */
}

header.app-header {
  /* Estilo para o componente AppHeader */
  width: 100%;
  /* Ocupa a largura do .content-area (ou max-width do .main-view-wrapper se dentro dele) */
  margin-bottom: 20px;
  flex-shrink: 0;
}

/* Se AppHeader estiver fora do .main-view-wrapper, ele não pegará o max-width: 900px.
   Para que ele tenha a mesma largura que o DeckSelector, ele precisa estar DENTRO do .main-view-wrapper
   ou o .main-view-wrapper só envolver o DeckSelector e o AppHeader ter seu próprio max-width.
   Vamos ajustar o template para que AppHeader esteja fora do main-view-wrapper mas dentro do .content-area */

/* Ajuste no template: AppHeader é irmão do main-view-wrapper */
#app-container:not(.studying-active) .content-area>header.app-header {
  width: 100%;
  max-width: 900px;
  /* Para alinhar com o DeckSelector */
  margin: 0 auto 20px auto;
  /* Centraliza e dá margem inferior */
}


.main-view-wrapper>.deck-selector-container {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Botão de tema para o modo estudo */
.theme-toggle-button.study-mode-theme-toggle {
  position: relative;
  top: auto;
  right: auto;
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
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s, color 0.2s;
}

.theme-toggle-button.study-mode-theme-toggle:hover {
  background-color: var(--button-primary-hover-bg-color);
  color: white;
}

.theme-toggle-button.study-mode-theme-toggle:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Estilos para o modo de estudo ativo */
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
  width: 100%;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.deck-active-container h2 {
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 10px;
  text-align: center;
  font-size: 1.6em;
  font-weight: 500;
  flex-shrink: 0;
  width: 100%;
  padding: 0 50px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-timer-display {
  margin-bottom: 10px;
  font-size: 0.9em;
  color: var(--text-color);
  background-color: rgba(128, 128, 128, 0.1);
  padding: 5px 10px;
  border-radius: 4px;
  flex-shrink: 0;
  height: 28px;
  line-height: 18px;
  min-width: 80px;
  text-align: center;
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
  width: 20px;
  height: 20px;
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