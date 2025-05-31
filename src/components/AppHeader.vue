<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';
// import IconSun from '@/components/icons/IconSun.vue';   // Descomente se for usar o componente de ícone
// import IconMoon from '@/components/icons/IconMoon.vue'; // Descomente se for usar o componente de ícone

// Função para normalizar BASE_URL, removendo barras extras no final
const normalizeBaseUrl = (url: string) => {
  let normalized = url.replace(/\/+$/, '');
  if (normalized === '') return '/';
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

// Caminho para o logo (assumindo que está em public/images/q8.png)
const logoSrc = computed(() => `${normalizeBaseUrl(import.meta.env.BASE_URL)}/images/q8.png`);
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
      <!-- Usando emojis diretamente. Se preferir componentes de ícone: -->  
      <!-- <IconSun v-if="currentTheme === 'dark'" /> -->
      <!-- <IconMoon v-else /> -->
      <span v-if="currentTheme === 'dark'">☀️</span>
      <span v-else>🌙</span>
    </button>
  </header>
</template>

<style scoped>
.app-header {
  width: 100%;
  padding: 0 20px; /* Padding lateral interno do header */
  box-sizing: border-box;
  background-color: var(--app-header-bg, var(--bg-color));
  display: flex;
  align-items: center;
  justify-content: space-between; /* Logo à esquerda, botão de tema à direita */
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
  height: 60px; /* Altura fixa para o header */
}

.logo-container {
  display: flex;
  align-items: center;
  overflow: hidden; 
}

.header-logo {
  max-height: 30px;
  width: auto;
  display: block;
  flex-shrink: 0;
}

.header-title-text {
  margin-left: 12px;
  font-size: 1.3em;
  font-weight: 500; 
  color: var(--primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-toggle-button-header {
  padding: 6px;
  background-color: transparent;
  color: var(--text-color); /* Cor do emoji/ícone herda do texto */
  border: 1px solid transparent;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
  flex-shrink: 0;
}

.theme-toggle-button-header:hover {
  background-color: var(--button-primary-hover-bg-color); /* Use sua variável de hover */
  color: white; /* Para contraste com o fundo do hover */
}

.theme-toggle-button-header:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.theme-toggle-button-header span { /* Para dimensionar os emojis */
  font-size: 1.2rem; /* Ajuste o tamanho do emoji */
  line-height: 1;
  display: flex; /* Para melhor centralização do emoji no botão */
  align-items: center;
  justify-content: center;
}
</style>