<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';
// Se decidir usar componentes SVG para os ícones de tema:
// import IconSun from '@/components/icons/IconSun.vue';
// import IconMoon from '@/components/icons/IconMoon.vue';

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
      <span v-if="currentTheme === 'dark'">☀️</span>
      <span v-else>🌙</span>
      <!-- <IconSun v-if="currentTheme === 'dark'" /> -->
      <!-- <IconMoon v-else /> -->
    </button>
  </header>
</template>

<style scoped>
.app-header {
  width: 100%;
  padding: 0 20px;
  /* Padding lateral interno do header */
  box-sizing: border-box;
  background-color: var(--app-header-bg, var(--bg-color));
  /* Permite tema ou usa fundo base */
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Logo à esquerda, botão de tema à direita */
  flex-shrink: 0;
  /* Importante para não ser esmagado em layouts flex */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
  height: 60px;
  /* Altura fixa para o header */
}

.logo-container {
  display: flex;
  align-items: center;
  overflow: hidden;
  /* Para o text-overflow do título funcionar */
  /* flex-grow: 1; Se quisesse que o container do logo tentasse ocupar mais espaço */
  /* min-width: 0; Para permitir que encolha se necessário */
}

.header-logo {
  max-height: 30px;
  /* Altura do seu logo */
  width: auto;
  display: block;
  flex-shrink: 0;
  /* Logo não encolhe */
}

.header-title-text {
  margin-left: 12px;
  font-size: 1.3em;
  font-weight: 500;
  color: var(--primary-color);
  /* Cor do título */
  white-space: nowrap;
  /* Impede quebra de linha */
  overflow: hidden;
  /* Esconde o que não couber */
  text-overflow: ellipsis;
  /* Adiciona "..." */
  /* max-width: 250px; */
  /* Opcional: limite máximo para o título se necessário */
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
  flex-shrink: 0;
  /* Botão não encolhe */
}

.theme-toggle-button-header:hover {
  background-color: var(--button-primary-hover-bg-color);
  color: white;
}

.theme-toggle-button-header:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.theme-toggle-button-header span {
  /* Para dimensionar os emojis */
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>