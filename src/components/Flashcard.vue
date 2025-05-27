<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { FlashcardData } from '@/types';

const props = defineProps<{
  cardData: FlashcardData;
  autoFocusInput?: boolean;
}>();

const emit = defineEmits<{
  (e: 'answered', payload: { cardId: string; correct: boolean }): void;
}>();

const isFlipped = ref(false);
const userAnswer = ref('');
const lastUserAnswer = ref('');
const isCorrect = ref(false);
const answerInput = ref<HTMLInputElement | null>(null);

const flipCard = () => {
  console.log('flipCard chamado. isFlipped antes:', isFlipped.value);
  isFlipped.value = !isFlipped.value;
  console.log('isFlipped depois:', isFlipped.value);
  if (!isFlipped.value) {
    userAnswer.value = '';
    focusInput();
  }
};

const focusInput = async () => {
  if (props.autoFocusInput && answerInput.value) {
    await nextTick();
    answerInput.value.focus();
  }
};

const handleInputKey = (event: KeyboardEvent) => {
  console.log('handleInputKey disparado:', event.key); // LOG PARA DEBUG
  const key = event.key.toUpperCase();
  if (key === 'V' || key === 'F') {
    userAnswer.value = key; // Isso já é feito pelo v-model e @input
    console.log('userAnswer definido para:', userAnswer.value); // LOG PARA DEBUG
    checkAnswerAndFlip();
  } else if (event.key.length === 1 && !['ENTER', 'BACKSPACE', 'DELETE', 'TAB', 'SHIFT', 'ALT', 'CONTROL', 'META', 'ESCAPE', 'ARROWLEFT', 'ARROWRIGHT', 'ARROWUP', 'ARROWDOWN'].includes(event.key.toUpperCase()) && !(event.ctrlKey || event.metaKey || event.altKey)) {
    userAnswer.value = '';
  }
};

const checkAnswerAndFlip = () => {
  console.log('checkAnswerAndFlip chamado. userAnswer:', userAnswer.value); // LOG PARA DEBUG
  if (!userAnswer.value.trim() || !['V', 'F'].includes(userAnswer.value.toUpperCase())) {
    console.log('checkAnswerAndFlip: Condição não satisfeita, retornando.'); // LOG PARA DEBUG
    return;
  }

  lastUserAnswer.value = userAnswer.value.toUpperCase();
  isCorrect.value = lastUserAnswer.value === props.cardData.resposta.toUpperCase();
  emit('answered', { cardId: props.cardData.id, correct: isCorrect.value });

  if (!isFlipped.value) {
    console.log('checkAnswerAndFlip: Virando o card.'); // LOG PARA DEBUG
    isFlipped.value = true;
  } else {
    console.log('checkAnswerAndFlip: Card já estava virado ou condição não atingida para virar.'); // LOG PARA DEBUG
  }
};

onMounted(() => {
  focusInput();
});

watch(() => props.cardData, (newData) => {
  console.log('Nova cardData no Flashcard.vue:', newData.id, newData.afirmacao);
  isFlipped.value = false;
  userAnswer.value = '';
  lastUserAnswer.value = '';
  isCorrect.value = false;
  focusInput();
}, { immediate: true });

</script>

<template>
  <div class="flashcard" :class="{ 'is-flipped': isFlipped }" @dblclick="flipCard" role="region" aria-live="polite">
    <div class="flashcard-inner">
      <div class="flashcard-front">
        <p class="statement"><span>{{ cardData.afirmacao }}</span></p>
        <div class="actions">
          <input type="text" v-model="userAnswer" @input="userAnswer = userAnswer.toUpperCase()" @keyup="handleInputKey"
            @keyup.enter="checkAnswerAndFlip" placeholder="V ou F" maxlength="1" ref="answerInput"
            aria-label="Digite V para Verdadeiro ou F para Falso" />
          <button @click="checkAnswerAndFlip"
            :disabled="!userAnswer.trim() || !['V', 'F'].includes(userAnswer.toUpperCase())">     Responder      </button>
        </div>
      </div>
      <div class="flashcard-back">
        <div class="back-content-wrapper" v-if="lastUserAnswer">
          <p class="answer-status" :class="isCorrect ? 'correct' : 'incorrect'">
            Sua resposta: {{ lastUserAnswer }} - {{ isCorrect ? 'Correta!' : 'Incorreta!' }}
          </p>
          <p><strong>Resposta Correta:</strong> {{ cardData.resposta.toUpperCase() }}</p>
          <p class="explanation"><strong>Explicação:</strong> {{ cardData.explicacao }}</p>
        </div>
        <div class="back-content-wrapper" v-else>
          <p>Responda na frente do card para ver a explicação.</p>
        </div>
        <button @click="flipCard" class="flip-back-button">Voltar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flashcard {
  width: 100%;
  /* AUMENTADO para ocupar mais espaço na tela */
  display: flex;
  flex-direction: column;
  min-height: 400px;
  /* AUMENTADO para dar mais altura ao card */
  perspective: 1000px;
  margin-bottom: 20px;
  cursor: default;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
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
  padding: 28px;
  /* AUMENTADO Padding interno */
  box-sizing: border-box;
  border-radius: 12px;
  color: var(--card-text-color);
}

.statement {
  font-size: 1.3em;
  /* AUMENTADO tamanho da fonte da afirmação */
  line-height: 1.65;
  /* AUMENTADO espaçamento entre linhas */
  text-align: center;
  /* CENTRALIZADO horizontalmente */
  width: 100%;
  margin-bottom: 25px;
  /* AUMENTADO margem inferior */
  flex-grow: 1;
  overflow-y: auto;
  min-height: 100px;
  /* AUMENTADO min-height para o texto */
  padding-bottom: 15px;
  display: flex;
  /* Para centralizar o span verticalmente */
  align-items: center;
  /* Centraliza o span verticalmente */
  justify-content: center;
  /* Centraliza o span horizontalmente */
}

.statement span {
  /* Para controle fino do texto dentro do P, se necessário */
  display: inline-block;
}


.actions {
  padding-top: 20px;
  /* AUMENTADO padding */
  width: 100%;
  max-width: 320px;
  /* AUMENTADO */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

/* --- CSS PARA A PARTE DE TRÁS --- */
.flashcard-back {
  transform: rotateY(180deg);
}

.back-content-wrapper {
  width: 100%;
  text-align: left;
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* AUMENTADO gap */
  padding-bottom: 15px;
  min-height: 100px;
  /* AUMENTADO min-height */
}

.explanation {
  font-size: 1.15em;
  /* AUMENTADO fonte da explicação */
  line-height: 1.65;
}

.flashcard-back .flip-back-button {
  margin-top: 20px;
  /* AUMENTADO */
  flex-shrink: 0;
}

/* Inputs e Botões */
.actions input[type="text"] {
  padding: 12px;
  /* AUMENTADO */
  margin-right: 15px;
  /* AUMENTADO */
  width: 80px;
  /* AUMENTADO */
  font-size: 1.1em;
  /* AUMENTADO */
  text-align: center;
  text-transform: uppercase;
  border: 1px solid var(--input-border-color);
  background-color: var(--input-bg-color);
  color: var(--input-text-color);
  border-radius: 8px;
  /* AUMENTADO */
}

.actions input[type="text"]:focus {
  outline: 2px solid var(--primary-color);
  border-color: var(--primary-color);
}

.actions button,
.flashcard-back .flip-back-button {
  padding: 12px 20px;
  /* AUMENTADO */
  font-size: 1em;
  /* AUMENTADO */
  background-color: var(--button-primary-bg-color);
  color: white;
  border: none;
  border-radius: 8px;
  /* AUMENTADO */
  cursor: pointer;
  transition: background-color 0.3s;
}

.actions button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.actions button:hover:not(:disabled),
.flashcard-back .flip-back-button:hover {
  background-color: var(--button-primary-hover-bg-color);
}

.answer-status {
  font-weight: bold;
  font-size: 1.25em;
  /* AUMENTADO */
}

.answer-status.correct {
  color: var(--color-success);
}

.answer-status.incorrect {
  color: var(--color-error);
}
</style>