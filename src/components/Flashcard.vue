<script setup lang="ts">
// ... (seu script setup como estava na última versão, sem mudanças aqui) ...
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import type { FlashcardData } from '@/types';

const props = defineProps<{
  cardData: FlashcardData;
  timerValue: number;
  isTimerPaused: boolean;
}>();

const emit = defineEmits<{
  (e: 'answered', payload: { cardId: string; correct: boolean; direction: 'V' | 'F' }): void;
  (e: 'skipNext'): void;
  (e: 'skipPrev'): void;
  (e: 'flipped', isNowFlipped: boolean): void;
  (e: 'frontShown'): void;
}>();

const isFlipped = ref(false);
const lastUserAnswer = ref('');
const isCorrect = ref(false);
const cardElement = ref<HTMLElement | null>(null);
const timeTakenToAnswer = ref(0);

const baseUrl = computed(() => (import.meta.env.BASE_URL || '/').replace(/\/\//g, '/'));
const fImageSrc = computed(() => `${baseUrl.value}images/f.png`.replace(/\/\//g, '/'));
const vImageSrc = computed(() => `${baseUrl.value}images/v.png`.replace(/\/\//g, '/'));
const feedbackImageSrc = computed(() => {
  if (!lastUserAnswer.value) return '';
  const imageName = isCorrect.value ? 'check.png' : 'caution.png';
  return `${baseUrl.value}images/${imageName}`.replace(/\/\//g, '/');
});
const logoQ8Src = computed(() => `${baseUrl.value}q8.png`.replace(/\/\//g, '/'));

const formattedTimer = computed(() => {
  const displayTime = (isFlipped.value && props.isTimerPaused) ? timeTakenToAnswer.value : props.timerValue;
  if (displayTime < 0) return "0s";
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
});

const processAnswer = (answer: 'V' | 'F') => {
  if (isFlipped.value || !props.cardData) return;
  lastUserAnswer.value = answer;
  isCorrect.value = answer === props.cardData.resposta?.toUpperCase();
  timeTakenToAnswer.value = props.timerValue;
  emit('answered', { cardId: props.cardData.id, correct: isCorrect.value, direction: answer });
  if (!isFlipped.value) {
    isFlipped.value = true;
    emit('flipped', true);
  }
};

const flipCard = () => {
  isFlipped.value = !isFlipped.value;
  emit('flipped', isFlipped.value);
  if (!isFlipped.value && cardElement.value && document.activeElement !== cardElement.value) {
     cardElement.value.focus();
     emit('frontShown');
  } else if (isFlipped.value) {
    if (!lastUserAnswer.value) {
      timeTakenToAnswer.value = props.timerValue;
    }
  }
};

const handleCardKeyInput = (event: KeyboardEvent) => {
  const key = event.key.toUpperCase();
  const code = event.code;
  if (!isFlipped.value) {
    if (key === 'V' || key === 'F') {
      event.preventDefault(); processAnswer(key as 'V' | 'F');
    } else if (code === 'Space') {
      event.preventDefault(); flipCard();
    }
  } else {
    if (code === 'Space') {
      event.preventDefault(); flipCard();
    }
  }
  if (event.key === 'ArrowRight') { event.preventDefault(); emit('skipNext'); }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); emit('skipPrev'); }
};

onMounted(() => {
  if (cardElement.value) cardElement.value.focus();
  if (props.cardData && !isFlipped.value) {
    nextTick(() => { emit('frontShown'); });
  }
});

watch(() => props.cardData, (newData, oldData) => {
  const cardActuallyChanged = !oldData || newData.id !== oldData.id;
  if (cardActuallyChanged) {
    isFlipped.value = false;
    lastUserAnswer.value = '';
    isCorrect.value = false;
    timeTakenToAnswer.value = 0;
    emit('flipped', false);
  }
  if (newData && cardElement.value) {
    nextTick(() => {
      cardElement.value?.focus();
      if (cardActuallyChanged && !isFlipped.value) {
        emit('frontShown');
      }
    });
  }
}, { immediate: true });
</script>

<template>
  <div ref="cardElement" class="flashcard" :class="{ 'is-flipped': isFlipped }" @dblclick="flipCard"
    @keyup="handleCardKeyInput" tabindex="0" role="region" aria-live="polite">
    <div class="flashcard-inner">
     
      
      <div class="flashcard-front">
        <div class="card-top-bar">
          <img :src="logoQ8Src" alt="Logo Q8" class="card-internal-logo" />
          <div 
            v-if="props.cardData" 
            class="card-timer-display-internal" 
            :class="{ 'paused': props.isTimerPaused }" 
            aria-label="Tempo decorrido"
          >
            {{ formattedTimer }}
          </div>
        </div>
        <p class="statement scrollable-content"><span>{{ cardData?.afirmacao }}</span></p>
        <div class="actions icon-actions">
          <button @click="processAnswer('F')" class="action-button incorrect-button"
            aria-label="Responder Errado (F) ou tecla F">
            <img :src="fImageSrc" alt="Ícone Falso" class="action-button-icon" />
          </button>
          <button @click="processAnswer('V')" class="action-button correct-button"
            aria-label="Responder Certo (V) ou tecla V">
            <img :src="vImageSrc" alt="Ícone Verdadeiro" class="action-button-icon" />
          </button>
        </div>
      </div>

      <div class="flashcard-back">
        <div class="card-top-bar">  
          <img :src="logoQ8Src" alt="Logo Q8" class="card-internal-logo" />
          <div 
            v-if="props.cardData" 
            class="card-timer-display-internal paused"  
            aria-label="Tempo para responder"
          >
            {{ formattedTimer }}  
          </div>
        </div>
        <div class="back-content-wrapper scrollable-content" v-if="lastUserAnswer">
          <div class="feedback-visual">
            <img :src="feedbackImageSrc" :alt="isCorrect ? 'Ícone de Correto' : 'Ícone de Incorreto'" class="feedback-icon" />
            <p class="answer-status-text" :class="isCorrect ? 'correct' : 'incorrect'">
              {{ isCorrect ? 'Você acertou!' : 'Você errou!' }} (Sua resposta: {{ lastUserAnswer }})
            </p>
          </div>
          <p class="explanation">{{ cardData?.explicacao }}</p>
        </div>
        <div class="back-content-wrapper scrollable-content" v-else>
          <p><strong>Resposta Correta:</strong> {{ cardData?.resposta?.toUpperCase() }}</p>
          <p class="explanation">{{ cardData?.explicacao }}</p>
          <p class="info-text">(Use os botões ou V/F para registrar sua resposta na próxima vez)</p>
        </div>
        <button @click="flipCard" class="flip-back-button">Voltar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* .flashcard-inner NÃO precisa mais de position: relative para o timer,
   pois o timer agora está dentro das faces que são position: absolute. */
.flashcard-inner {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background-color: var(--card-bg-color);
}

/* Container para logo e timer, AGORA DENTRO DE CADA FACE */
.card-top-bar {
  position: absolute; /* Posicionado em relação ao .flashcard-front ou .flashcard-back */
  top: 10px;
  left: 15px;
  right: 15px;
  /* width: calc(100% - 30px); Não necessário, left e right definem a largura */
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 5; 
  pointer-events: none; 
}

.card-internal-logo {
  height: 24px;
  width: auto;
  opacity: 0.8;
}

.card-timer-display-internal {
  background-color: rgba(0, 0, 0, 0.35);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
  transition: opacity 0.3s ease, background-color 0.3s ease;
  min-width: 40px;
  text-align: center;
}
/* A classe .paused no timer é aplicada pelo :class binding no template */
.card-timer-display-internal.paused {
  opacity: 0.7;
}


.flashcard-front,
.flashcard-back {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  padding-top: 50px; /* Aumentado para dar espaço consistente para o .card-top-bar */
  box-sizing: border-box;
  border-radius: 16px; /* Mesmo do inner */
  color: var(--card-text-color);
  /* O .flashcard-inner já tem o background-color */
}

/* ... (Resto do seu CSS como estava, incluindo .flashcard, .statement, .actions, etc.) ... */
/* O CSS para .scrollable-content, .statement, .actions.icon-actions, etc. deve permanecer o mesmo */
/* Cole o restante do seu CSS aqui para garantir que tudo esteja completo */
.flashcard { width: 100%; display: flex; flex-direction: column; min-height: 500px; height: 100%; perspective: 1000px; cursor: default; position: relative; outline: none; }
.flashcard:focus-visible { box-shadow: 0 0 0 3px var(--primary-color), 0 6px 18px rgba(0, 0, 0, 0.1); }
.flashcard.is-flipped .flashcard-inner { transform: rotateY(180deg); }
.scrollable-content { flex-grow: 1; overflow-y: auto; width: 100%; padding-right: 5px; }
.scrollable-content::-webkit-scrollbar { width: 6px; }
.scrollable-content::-webkit-scrollbar-track { background: transparent; border-radius: 3px; }
.scrollable-content::-webkit-scrollbar-thumb { background-color: rgba(128, 128, 128, 0.5); border-radius: 3px; }
.scrollable-content::-webkit-scrollbar-thumb:hover { background-color: rgba(128, 128, 128, 0.7); }
.scrollable-content { scrollbar-width: thin; scrollbar-color: rgba(128, 128, 128, 0.5) transparent; }
.statement { font-family: var(--font-family-statement); font-size: clamp(1.1em, 1.2em + 0.7vw, 1.9em); line-height: 1.7; text-align: center; /* width: 100%; */ margin-bottom: 30px; /* padding-bottom: 15px; */ display: flex; align-items: center; justify-content: center; color: var(--card-text-color); }
.statement span { display: inline-block; max-width: 100%; }
.actions.icon-actions { padding-top: 20px; width: 100%; max-width: 240px; display: flex; justify-content: center; gap: 40px; align-items: center; flex-shrink: 0; margin-top: auto; }
.action-button { background-color: transparent; border: 3px solid; border-radius: 50%; width: 64px; height: 64px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease; padding: 5px; }
.action-button-icon { width: 65%; height: 65%; object-fit: contain; }
.action-button:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
.action-button:active { transform: scale(1.02); }
.action-button.incorrect-button { border-color: var(--color-error); }
.action-button.incorrect-button:hover { background-color: var(--color-error); }
.action-button.correct-button { border-color: var(--color-success); }
.action-button.correct-button:hover { background-color: var(--color-success); }
.flashcard-back { transform: rotateY(180deg); justify-content: space-between; }
.back-content-wrapper { text-align: left; /* width: 100%; */ /* flex-grow: 1; */ /* overflow-y: auto; */ display: flex; flex-direction: column; gap: 16px; /* padding-bottom: 15px; */ }
.info-text { margin-top: 15px; font-style: italic; text-align: center; font-size: 0.9em; opacity: 0.8; }
.explanation { font-family: var(--font-family-explanation); font-size: clamp(1em, 1.05em + 0.3vw, 1.4em); line-height: 1.7; color: var(--card-text-color); }
.feedback-visual { display: flex; flex-direction: column; align-items: center; margin-bottom: 15px; }
.feedback-icon { width: 48px; height: 48px; margin-bottom: 8px; }
.answer-status-text { font-family: var(--font-family-base); font-weight: bold; font-size: 1.4em; text-align: center; }
.answer-status-text.correct { color: var(--color-success); }
.answer-status-text.incorrect { color: var(--color-error); }
.flashcard-back .flip-back-button { margin-top: 20px; flex-shrink: 0; padding: 12px 20px; font-size: 1em; font-family: var(--font-family-base); background-color: var(--button-primary-bg-color); color: white; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.3s; }
.flashcard-back .flip-back-button:hover { background-color: var(--button-primary-hover-bg-color); }
@media (min-width: 1920px) { .flashcard { /* ... */ } .flashcard-front, .flashcard-back { padding: 40px; padding-top: 60px; /* Espaço maior para o timer e logo */ } .statement { font-size: 2.2em; line-height: 1.8; margin-bottom: 40px; } .explanation { font-size: 1.6em; line-height: 1.8; } .action-button { width: 80px; height: 80px; } .action-button-icon { width: 70%; height: 70%; } .flashcard-back .flip-back-button { padding: 14px 25px; font-size: 1.2em; } .answer-status-text { font-size: 1.6em; } .feedback-icon { width: 56px; height: 56px; } .card-top-bar { top: 15px; left: 20px; right: 20px; width: calc(100% - 40px); } .card-internal-logo { height: 28px; } .card-timer-display-internal { font-size: 0.9em; } .scrollable-content::-webkit-scrollbar { width: 8px; } .scrollable-content { padding-right: 8px; } }

</style>