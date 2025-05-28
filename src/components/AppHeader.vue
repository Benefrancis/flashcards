<template>
  <header class="app-header"></header>
</template>

<script setup lang="ts">
// Nenhum script específico é necessário para este header simples
</script>

<style scoped>
.app-header {
  width: 100%;
  padding: 15px 20px; /* Aumentei um pouco o padding */
  /* background-color: var(--secondary-color); */
  /*  color: var(--bg-color);  Cor do texto que contrasta com o fundo do header */
  text-align: center;
  /* margin-bottom: 20px; Esta margem será controlada pelo App.vue se necessário */
  flex-shrink: 0; /* Para garantir que não encolha em layouts flex */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Sombra sutil */
}

.app-header h1 {
  margin: 0;
  font-size: 1.5em; /* Tamanho da fonte do título */
  font-weight: 500; /* Peso da fonte (se a fonte base for Roboto, por exemplo) */
}
</style>