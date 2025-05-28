<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { FlashcardData } from '@/types';
// Não precisamos mais de @vueuse/gesture ou @vueuse/motion aqui

const props = defineProps<{
  cardData: FlashcardData;
}>();

const emit = defineEmits<{
  (e: 'answered', payload: { cardId: string; correct: boolean; direction: 'V' | 'F' }): void;
  (e: 'skipNext'): void; // Necessário para navegação por seta
  (e: 'skipPrev'): void; // Necessário para navegação por seta
}>();

const isFlipped = ref(false);
const lastUserAnswer = ref('');
const isCorrect = ref(false);
const cardElement = ref<HTMLElement | null>(null);

// Não precisamos mais das constantes de swipe ou springStyle

const processAnswer = (answer: 'V' | 'F') => {
  if (isFlipped.value || !props.cardData) return;
  lastUserAnswer.value = answer;
  isCorrect.value = answer === props.cardData.resposta?.toUpperCase();
  emit('answered', { cardId: props.cardData.id, correct: isCorrect.value, direction: answer });
  if (!isFlipped.value) {
    isFlipped.value = true;
  }
};

const flipCard = () => {
  isFlipped.value = !isFlipped.value;
  if (!isFlipped.value && cardElement.value && document.activeElement !== cardElement.value) {
    cardElement.value.focus();
  }
};

const handleCardKeyInput = (event: KeyboardEvent) => {
  // Não previne o default aqui ainda, apenas se uma ação for tomada

  const key = event.key.toUpperCase(); // Usar event.key para "Space" e setas
  const code = event.code; // Usar event.code para "Space" é mais confiável

  if (!isFlipped.value) { // Ações para a FRENTE do card
    if (key === 'V' || key === 'F') {
      event.preventDefault(); // Previne digitação em outros inputs se o card estiver focado
      processAnswer(key as 'V' | 'F');
    } else if (code === 'Space') { // Tecla Espaço para virar (se estiver na frente)
      event.preventDefault();
      flipCard(); // Vira para mostrar a resposta sem responder
      // ou poderia chamar processAnswer com uma resposta "neutra" se quisesse
      // mas só virar parece mais intuitivo para "ver a resposta"
    }
  } else { // Ações para o VERSO do card
    if (code === 'Space') { // Tecla Espaço para virar de volta
      event.preventDefault();
      flipCard();
    }
  }

  // Ações de navegação (funcionam em qualquer lado do card)
  if (event.key === 'ArrowRight') { // Seta para Direita
    event.preventDefault();
    emit('skipNext');
  } else if (event.key === 'ArrowLeft') { // Seta para Esquerda
    event.preventDefault();
    emit('skipPrev');
  }
  // Poderia adicionar ArrowUp/ArrowDown para alguma outra ação se quisesse
};

onMounted(() => {
  if (cardElement.value) {
    cardElement.value.focus();
  }
});

watch(() => props.cardData, (newData) => {
  isFlipped.value = false;
  lastUserAnswer.value = '';
  isCorrect.value = false;
  if (newData && cardElement.value) {
    nextTick(() => {
      cardElement.value?.focus();
    });
  }
}, { immediate: true });

</script>

<template>
  <div ref="cardElement" class="flashcard" :class="{ 'is-flipped': isFlipped }" @dblclick="flipCard"
    @keyup="handleCardKeyInput" tabindex="0" role="region" aria-live="polite">
    <div class="flashcard-inner">
      <div class="flashcard-front">
        <p class="statement"><span>{{ cardData?.afirmacao }}</span></p>
        <div class="actions icon-actions">
          <button @click="processAnswer('F')" class="action-button incorrect-button"
            aria-label="Responder Errado (F) ou tecla F">
            ❌
          </button>
          <button @click="processAnswer('V')" class="action-button correct-button"
            aria-label="Responder Certo (V) ou tecla V">
            ✔️
          </button>
        </div>
      </div>
      <div class="flashcard-back">
        <div class="back-content-wrapper" v-if="lastUserAnswer">
          <p class="answer-status" :class="isCorrect ? 'correct' : 'incorrect'">
            Sua resposta: {{ lastUserAnswer }} - {{ isCorrect ? 'Correta!' : 'Incorreta!' }}
          </p>
          <p><strong>Resposta Correta:</strong> {{ cardData?.resposta?.toUpperCase() }}</p>
          <p class="explanation"><strong>Explicação:</strong> {{ cardData?.explicacao }}</p>
        </div>
        <div class="back-content-wrapper" v-else>

          <p><strong>Resposta Correta:</strong> {{ cardData?.resposta?.toUpperCase() }}</p>
          <p class="explanation"><strong>Explicação:</strong> {{ cardData?.explicacao }}</p>
          <p style="margin-top: 15px; font-style: italic; text-align: center;">(Use os botões ou V/F para registrar sua
            resposta)</p>
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
  min-height: 500px;
  height: 100%;
  perspective: 1000px;
  cursor: default;
  touch-action: none;
  user-select: none;
  position: relative;
  outline: none;
}

.flashcard:focus-visible {
  box-shadow: 0 0 0 3px var(--primary-color), 0 6px 18px rgba(0, 0, 0, 0.1);
}

.flashcard-inner {
  position: relative;
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

.flashcard.is-flipped .flashcard-inner {
  transform: rotateY(180deg);
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
  box-sizing: border-box;
  border-radius: 16px;
  color: var(--card-text-color);
}

.statement {
  font-family: var(--font-family-statement);
  font-size: clamp(1.1em, 1.2em + 0.7vw, 1.9em);
  line-height: 1.7;
  text-align: center;
  width: 100%;
  margin-bottom: 30px;
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--card-text-color);
}

.statement span {
  display: inline-block;
  max-width: 100%;
}

.actions.icon-actions {
  padding-top: 20px;
  width: 100%;
  max-width: 240px;
  display: flex;
  justify-content: center;
  gap: 40px;
  /* Espaço entre os botões de ícone */
  align-items: center;
  flex-shrink: 0;
  margin-top: auto;
}

.action-button {
  background-color: transparent;
  border: 3px solid;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  font-size: 2.2em;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  /* Adicionada transição para color e border-color */
  padding: 0;
}

.action-button:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-button:active {
  transform: scale(1.02);
}

.action-button.incorrect-button {
  border-color: var(--color-error);
  color: var(--color-error);
}

.action-button.incorrect-button:hover {
  background-color: var(--color-error);
  color: var(--card-bg-color);
}

.action-button.correct-button {
  border-color: var(--color-success);
  color: var(--color-success);
}

.action-button.correct-button:hover {
  background-color: var(--color-success);
  color: var(--card-bg-color);
}

.flashcard-back {
  transform: rotateY(180deg);
  justify-content: space-between;
}

.back-content-wrapper {
  width: 100%;
  text-align: left;
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 15px;
}

.explanation {
  font-family: var(--font-family-explanation);
  font-size: clamp(1em, 1.05em + 0.3vw, 1.4em);
  line-height: 1.7;
  color: var(--card-text-color);
}

.flashcard-back .flip-back-button {
  margin-top: 20px;
  flex-shrink: 0;
  padding: 12px 20px;
  font-size: 1em;
  font-family: var(--font-family-base);
  background-color: var(--button-primary-bg-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.flashcard-back .flip-back-button:hover {
  background-color: var(--button-primary-hover-bg-color);
}

.answer-status {
  font-family: var(--font-family-base);
  font-weight: bold;
  font-size: 2em;
  display: flex;
  justify-content: center;
  align-items: center;
}

.answer-status.correct {
  color: var(--color-success);
}

.answer-status.incorrect {
  color: var(--color-error);
}

@media (min-width: 1920px) {
  .flashcard {
    max-height: 80vh;
  }

  .flashcard-front,
  .flashcard-back {
    padding: 40px;
  }

  .statement {
    font-size: 2.2em;
    line-height: 1.8;
    margin-bottom: 40px;
  }

  .explanation {
    font-size: 1.6em;
    line-height: 1.8;
  }

  .action-button {
    width: 80px;
    height: 80px;
    font-size: 3em;
  }

  .flashcard-back .flip-back-button {
    padding: 14px 25px;
    font-size: 1.2em;
  }

  .answer-status {
    font-size: 1.5em;
  }
}
</style>