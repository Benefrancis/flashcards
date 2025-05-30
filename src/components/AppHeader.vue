<template>
  <header class="app-header">
    <img src="/q8.png" alt="logo q8">
  </header>
</template>

<script setup lang="ts">
// Nenhum script específico é necessário para este header simples
</script>

<style scoped>
/* Em src/components/AppHeader.vue -> <style scoped> */

.app-header {
  width: 100%;
  padding: 10px 20px; /* Padding vertical e horizontal base */
  box-sizing: border-box; /* Garante que padding não aumente a largura total */
  /* background-color: var(--secondary-color); */ /* Você comentou, ok */
  display: flex; /* Habilita flexbox para alinhar o logo */
  align-items: center; /* Alinha o logo verticalmente ao centro */
  /* justify-content: center; */ /* Se quiser o logo centralizado no header */
  justify-content: flex-start; /* Alinha o logo à esquerda por padrão */
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* Sombra mais sutil */
  height: 60px; /* Definir uma altura fixa para o header pode ajudar no alinhamento com botões fixos */
}

.app-header img {
  max-height: 35px; /* Altura máxima do logo, ajuste conforme o seu logo */
  /* display: flex; */ /* Não necessário na imagem em si, o pai .app-header já é flex */
  /* Se quiser um espaço à direita do logo, caso haja outros elementos no header: */
  /* margin-right: auto; */ /* Empurra outros elementos para a direita */
}

/* Se você quiser um título ao lado do logo, poderia ser: */
/*
.app-header h1 {
  margin: 0 0 0 15px; // Margem à esquerda do título, após o logo
  font-size: 1.4em;
  font-weight: 500;
  color: var(--primary-color); // Ou var(--text-color)
}
*/
</style>