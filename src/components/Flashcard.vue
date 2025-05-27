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
            :disabled="!userAnswer.trim() || !['V', 'F'].includes(userAnswer.toUpperCase())"> Responder </button>
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
  display: flex;
  flex-direction: column;
  min-height: 400px;
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
  font-family: var(--font-family-statement);
  font-size: clamp(1.3em, 1.2em + 0.5vw, 2.3em);
  line-height: 1.65;
  text-align: center;
  width: 100%;
  margin-bottom: 25px;
  flex-grow: 1;
  overflow-y: auto;
  min-height: 100px;
  padding-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 768px) {

    /* Telas médias (tablets) */
    .statement {
      font-size: 1.4em;
    }
  }

  @media (min-width: 1024px) {

    /* Telas grandes (desktops) */
    .statement {
      font-size: 1.6em;
    }
  }
}

.statement span {
  /* Para controle fino do texto dentro do P, se necessário */
  display: inline-block;
  max-width: 100%;

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
  font-size: clamp(1.3em, 1.2em + 0.5vw, 2.5em);

  display: flex;
  align-items: center;
  justify-content: center;

  /* font-size: 1.25em; */
  /* AUMENTADO */
}

.answer-status.correct {
  color: var(--color-success);
}

.answer-status.incorrect {
  color: var(--color-error);
}


/* ... (todo o seu CSS anterior do Flashcard.vue) ... */

/* Adicione esta media query no FINAL do seu <style scoped> */
@media (min-width: 1920px) {
  .flashcard {
    /* Se quiser que o card em si seja ainda maior em telas ultra-largas */
    /* max-width: 800px; */ /* Exemplo, ajuste conforme necessário */
    /* min-height: 500px; */ /* Exemplo */
    max-height: 80vh; /* Pode permitir um pouco mais de altura na viewport */
  }

  .flashcard-front,
  .flashcard-back {
    padding: 40px; /* Padding interno ainda maior */
  }

  .statement {
    /* Você pode definir um font-size fixo maior ou um novo clamp com valores maiores */
    font-size: 2.2em; /* Exemplo de tamanho fixo maior */
    /* Ou, se quiser manter alguma fluidez, mas com uma base maior: */
    /* font-size: clamp(1.8em, 1.8em + 0.5vw, 2.8em); */
    line-height: 1.8; /* Pode precisar ajustar a altura da linha */
    margin-bottom: 40px; /* Mais espaço abaixo */
    min-height: 150px; /* Mais espaço mínimo para o texto */
  }

  .explanation {
    font-size: 1.6em; /* Exemplo de tamanho fixo maior */
    /* Ou: */
    /* font-size: clamp(1.3em, 1.3em + 0.3vw, 1.8em); */
    line-height: 1.8;
  }

  .actions input[type="text"] {
    padding: 14px;
    margin-right: 18px;
    width: 100px;
    font-size: 1.3em;
  }

  .actions button,
  .flashcard-back .flip-back-button {
    padding: 14px 25px;
    font-size: 1.2em;
  }

  .answer-status {
    font-size: 1.5em;
  }
}

</style>