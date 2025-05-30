<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';


const logoSrc = computed(() => `${import.meta.env.BASE_URL}q8.png`.replace(/\/\//g, '/'));
const { currentTheme, toggleTheme } = useTheme();
</script>

<template>
  <header class="app-header">
    <div class="logo-container">
      <img :src="logoSrc" alt="Logo Q8 Concursos" class="header-logo">
      <span class="header-title-text">Flashcards</span>
    </div>

    <button @click="toggleTheme" class="theme-toggle-button-header"
      :aria-label="currentTheme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'" title="Mudar tema">

      <span v-if="currentTheme === 'dark'">☀️</span>
      <span v-else>🌙</span>

    </button>
  </header>
</template>

<style scoped>
.app-header {
  width: 100%;
  /* Ocupa a largura do seu contêiner pai no App.vue (main-view-content-wrapper) */
  padding: 0 20px;
  /* Padding lateral interno do header */
  box-sizing: border-box;
  background-color: var(--app-header-bg, var(--bg-color));
  /* Permite sobrescrever ou usa o fundo base */
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Logo à esquerda, botão de tema à direita */
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
  height: 60px;
  /* Altura fixa para o header */
}

.logo-container {
  display: flex;
  align-items: center;
}

.header-logo {
  max-height: 30px;
  width: auto;
  display: block;
}

/* Estilos para um título ao lado do logo */

.header-title-text {
  margin-left: 15px;
  font-size: 1.5em;
  font-weight: 600;
  color: var(--primary-color);
}


.theme-toggle-button-header {
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
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
}

.theme-toggle-button-header:hover {
  background-color: var(--button-primary-hover-bg-color);
  color: white;
  /* transform: scale(1.1); */
  /* Opcional: leve aumento no hover */
}

.theme-toggle-button-header:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>