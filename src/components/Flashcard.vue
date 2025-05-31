<script setup lang="ts">
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
const logoQ8Src = computed(() => `${baseUrl.value}images/q8.png`.replace(/\/\//g, '/'));

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

    <div class="card-top-overlay">
      <img :src="logoQ8Src" alt="Logo Q8" class="card-internal-logo" />
      <div
        v-if="props.cardData"
        class="card-timer-display-overlay"
        :class="{ 'paused': props.isTimerPaused && isFlipped }"
        aria-label="Tempo decorrido"
      >
        {{ formattedTimer }}
      </div>
    </div>

    <div class="flashcard-inner">  
      <div class="flashcard-front">
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
.flashcard {
  width: 100%;
  display: flex;
  flex-direction: column;
  /* min-height: 500px; Ajustaremos com base no conteúdo e tela */
  height: 100%; /* Para usar a altura do .flashcard-area no App.vue */
  /* max-height: 80vh; Para telas muito altas, mas pode ser flexível */
  perspective: 1000px; /* Necessário para o efeito 3D */
  cursor: default;
  position: relative; /* Para o .card-top-overlay ser posicionado em relação a ele */
  outline: none;
  padding-top: 45px; /* ESPAÇO NO TOPO DO CARD para o .card-top-overlay (logo e timer) */
  box-sizing: border-box;
}
.flashcard:focus-visible {
  box-shadow: 0 0 0 3px var(--primary-color), 0 6px 18px rgba(0, 0, 0, 0.1);
}

/* BARRA SUPERIOR FIXA (NÃO VIRA) */
.card-top-overlay {
  position: absolute;
  top: 10px; /* Distância do topo do .flashcard */
  left: 15px;
  right: 15px;
  height: 28px; /* Altura da barra superior */
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 20; /* Para ficar acima do .flashcard-inner */
  pointer-events: none;
}
.card-top-overlay > * {
  pointer-events: auto;
}
.card-internal-logo {
  height: 24px; width: auto; opacity: 0.9;
}
.card-timer-display-overlay {
  background-color: rgba(0, 0, 0, 0.45);
  color: white;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
  transition: opacity 0.3s ease, background-color 0.3s ease;
  min-width: 35px;
  text-align: center;
}
.card-timer-display-overlay.paused {
  opacity: 0.7;
}

.flashcard-inner {
  width: 100%;
  flex: 1; /* Ocupa o espaço restante no .flashcard (que já tem padding-top) */
  text-align: center;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d; /* Essencial para o efeito 3D */
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background-color: var(--card-bg-color);
  position: relative; /* Para as faces serem absolutas a ele */
}
.flashcard.is-flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden; /* ESCONDE A FACE TRASEIRA QUANDO NÃO VISÍVEL */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px; /* Padding interno das faces */
  /* padding-top: 45px; REMOVIDO - O padding principal do card agora acomoda o overlay */
  box-sizing: border-box;
  border-radius: 16px; /* Mesmo do inner */
  color: var(--card-text-color);
}
.flashcard-back {
  transform: rotateY(180deg); /* Face traseira já está virada */
  justify-content: space-between;
}

.scrollable-content {
  flex-grow: 1;
  overflow-y: auto;
  width: 100%;
  padding-right: 5px;
  min-height: 50px; /* Garante um mínimo de altura para o scroll funcionar bem */
}
.scrollable-content::-webkit-scrollbar { width: 6px; }
.scrollable-content::-webkit-scrollbar-track { background: transparent; border-radius: 3px; }
.scrollable-content::-webkit-scrollbar-thumb { background-color: rgba(128, 128, 128, 0.5); border-radius: 3px; }
.scrollable-content::-webkit-scrollbar-thumb:hover { background-color: rgba(128, 128, 128, 0.7); }
.scrollable-content { scrollbar-width: thin; scrollbar-color: rgba(128, 128, 128, 0.5) transparent; }

.statement {
  font-family: var(--font-family-statement);
  font-size: clamp(1.0em, 1.0em + 0.8vw, 1.7em); /* Ajustado para ser um pouco menor em telas pequenas */
  line-height: 1.6; /* Ajustado */
  text-align: center;
  margin-bottom: 15px; /* Reduzido */
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--card-text-color);
}
.statement span { display: inline-block; max-width: 100%; }

.actions.icon-actions {
  padding-top: 10px; /* Reduzido */
  width: 100%;
  max-width: 200px; /* Reduzido para botões menores */
  display: flex;
  justify-content: center;
  gap: 30px; /* Reduzido */
  align-items: center;
  flex-shrink: 0;
  margin-top: auto;
}
.action-button {
  background-color: transparent;
  border: 2px solid; /* Borda mais fina */
  border-radius: 50%;
  width: 56px;  /* BOTÕES MENORES */
  height: 56px; /* BOTÕES MENORES */
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  padding: 0; /* Removido padding interno do botão */
}
.action-button-icon {
  width: 55%;  /* Ajustado para o novo tamanho do botão */
  height: 55%;
  object-fit: contain;
}
.action-button:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
.action-button:active { transform: scale(1.02); }
.action-button.incorrect-button { border-color: var(--color-error); }
.action-button.incorrect-button:hover { background-color: var(--color-error); }
.action-button.correct-button { border-color: var(--color-success); }
.action-button.correct-button:hover { background-color: var(--color-success); }

.back-content-wrapper {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px; /* Reduzido */
}
.info-text { margin-top: 10px; font-size: 0.85em; }
.explanation {
  font-family: var(--font-family-explanation);
  font-size: clamp(0.9em, 0.9em + 0.3vw, 1.3em); /* Um pouco menor */
  line-height: 1.6; /* Ajustado */
  color: var(--card-text-color);
}
.feedback-visual { display: flex; flex-direction: column; align-items: center; margin-bottom: 10px; }
.feedback-icon { width: 40px; height: 40px; margin-bottom: 5px; } /* Ícone de feedback menor */
.answer-status-text { font-family: var(--font-family-base); font-weight: bold; font-size: 1.3em; text-align: center; } /* Menor */
.answer-status-text.correct { color: var(--color-success); }
.answer-status-text.incorrect { color: var(--color-error); }
.flashcard-back .flip-back-button {
  margin-top: 15px; /* Reduzido */
  flex-shrink: 0;
  padding: 10px 18px; /* Um pouco menor */
  font-size: 0.9em; /* Um pouco menor */
  font-family: var(--font-family-base);
  background-color: var(--button-primary-bg-color);
  color: white;
  border: none;
  border-radius: 6px; /* Menor */
  cursor: pointer;
  transition: background-color 0.3s;
}
.flashcard-back .flip-back-button:hover { background-color: var(--button-primary-hover-bg-color); }

@media (min-width: 768px) { /* Ajustes para telas um pouco maiores que mobile */
    .flashcard {
        min-height: 450px; /* Pode ser um pouco menos alto em tablets */
    }
    .statement { font-size: clamp(1.1em, 1.1em + 0.7vw, 1.8em); }
    .explanation { font-size: clamp(0.95em, 0.95em + 0.3vw, 1.35em); }
    .action-button { width: 60px; height: 60px; }
    .action-button-icon { width: 60%; height: 60%; }
    .feedback-icon { width: 44px; height: 44px; }
    .answer-status-text { font-size: 1.35em; }
}

@media (min-width: 1024px) { /* Desktop e telas maiores */
  .flashcard {
    min-height: 500px; /* Volta para o min-height original */
    max-height: 75vh; /* Restaura o max-height */
  }
  .flashcard-front, .flashcard-back {
    padding: 30px; /* Restaura padding original */
    padding-top: 55px; /* Mais espaço para a barra overlay */
  }
   .card-top-overlay { top: 12px; left: 20px; right: 20px; height: 30px; }
   .card-internal-logo { height: 26px; }
   .card-timer-display-overlay { font-size: 0.85em; }

  .statement { font-size: clamp(1.1em, 1.2em + 0.7vw, 1.9em); margin-bottom: 30px; min-height: 120px;}
  .explanation { font-size: clamp(1em, 1.05em + 0.3vw, 1.4em); }
  .actions.icon-actions { max-width: 240px; gap: 40px; }
  .action-button { width: 64px; height: 64px; }
  .action-button-icon { width: 65%; height: 65%; }
  .feedback-icon { width: 48px; height: 48px; }
  .answer-status-text { font-size: 1.4em; }
  .flashcard-back .flip-back-button { padding: 12px 20px; font-size: 1em; }
}

@media (min-width: 1920px) {
  .flashcard { padding-top: 60px; }
  .flashcard-front, .flashcard-back { padding: 40px; /* padding-top é do .flashcard */ }
  .statement { font-size: 2.2em; line-height: 1.8; margin-bottom: 40px; }
  .explanation { font-size: 1.6em; line-height: 1.8; }
  .action-button { width: 80px; height: 80px; }
  .action-button-icon { width: 70%; height: 70%; }
  .flashcard-back .flip-back-button { padding: 14px 25px; font-size: 1.2em; }
  .answer-status-text { font-size: 1.6em; }
  .feedback-icon { width: 56px; height: 56px; }
  .card-top-overlay { top: 18px; left: 25px; right: 25px; height: 35px; }
  .card-internal-logo { height: 28px; }
  .card-timer-display-overlay { font-size: 0.9em; }
  .scrollable-content::-webkit-scrollbar { width: 8px; }
  .scrollable-content { padding-right: 8px; }
}
</style>