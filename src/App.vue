<script setup lang="ts">
// SEU SCRIPT SETUP ATUAL ESTÁ CORRETO E PODE SER MANTIDO
import type { DeckInfo, FlashcardData } from '@/types';
import { computed, ref, watch, onUnmounted, type Ref } from 'vue';
import DeckSelector from './components/DeckSelector.vue';
import Flashcard from './components/Flashcard.vue';
import AppHeader from './components/AppHeader.vue';
import IconArrowLeft from './components/icons/IconArrowLeft.vue';
import IconSun from './components/icons/IconSun.vue';
import IconMoon from './components/icons/IconMoon.vue';
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

const { currentTheme, toggleTheme } = useTheme();

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
          <Flashcard 
            :cardData="currentCard" 
            :key="currentCard.id" 
            :timerValue="cardTimerValue"       
            :isTimerPaused="isCardTimerPaused" 
            @answered="handleCardAnswered" 
            @skipNext="handleSkipNext"
            @skipPrev="handleSkipPrev" 
            @flipped="handleFlashcardFlipped" 
            @frontShown="handleFlashcardFrontShown" />
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
html, body {
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
  align-items: center; 
  padding: 0; 
  box-sizing: border-box;
  overflow: hidden; 
}

#app-container:not(.studying-active) .content-area {
  overflow-y: auto; 
  padding: 20px; 
}

#app-container:not(.studying-active) .main-view-wrapper {
  width: 100%;
  max-width: 900px; 
  display: flex;
  flex-direction: column;
  flex-grow: 1; 
  min-height: 0; 
}
#app-container:not(.studying-active) header.app-header {
  width: 100%;
  max-width: 900px; 
  margin: 0 auto 20px auto; 
  flex-shrink: 0;
}
.main-view-wrapper > .deck-selector-container {
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
  height: 100%; /* Ocupa toda a altura do .content-area */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px; /* Padding geral um pouco menor para mobile */
  box-sizing: border-box;
  background-color: var(--bg-color);
  /* position: relative; Não é mais necessário se os filhos usam flex */
}

.study-header-controls {
  width: 100%; 
  margin-bottom: 8px; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* Não encolhe */
  /* position: relative; z-index: 10; Não é mais necessário se não há sobreposição complexa */
}

.deck-active-container h2 { /* Título do deck */
  color: var(--primary-color);
  margin-top: 0; 
  margin-bottom: 8px; 
  text-align: center;
  font-size: 1.3em; 
  font-weight: 500;
  flex-shrink: 0;
  width: 100%;
  padding: 0 10px; /* Padding lateral menor para o título não ser cortado pelos botões */
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flashcard-area {
  width: 100%;
  flex-grow: 1; /* FAZ ESTA ÁREA OCUPAR O ESPAÇO VERTICAL DISPONÍVEL */
  display: flex;
  flex-direction: column;
  justify-content: center; 
  align-items: center;   
  overflow: hidden; /* O Flashcard interno terá seu próprio scroll se necessário */
  margin-bottom: 5px; /* Espaço mínimo antes dos controles de navegação */
  min-height: 0; /* ESSENCIAL para permitir que .flashcard-area encolha */
}

.navigation-controls {
  padding-top: 5px; /* Espaço mínimo acima */
  padding-bottom: 5px; /* Espaço mínimo abaixo, especialmente para mobile */
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 500px; 
  flex-shrink: 0; /* NÃO ENCOLHE - garante sua altura */
}

/* Ajustes de tamanho para botões de navegação em mobile */
.navigation-controls button {
  padding: 8px 10px; 
  font-size: 0.85em; 
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
  margin: 0 8px; 
  font-size: 0.85em; 
  color: var(--text-color);
}

.back-button.icon-button,
.study-mode-theme-toggle { /* Aplicando tamanho menor também ao botão de tema no modo estudo */
  width: 34px; 
  height: 34px;
  padding: 4px; 
}
.back-button.icon-button .action-icon { /* Se o SVG do IconArrowLeft tiver essa classe */
  width: 18px;
  height: 18px;
}
.study-mode-theme-toggle span { /* Se estiver usando emojis para sol/lua */
    font-size: 1em; /* Ajustar tamanho do emoji no botão de tema do modo estudo */
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