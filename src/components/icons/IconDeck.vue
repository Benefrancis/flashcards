// src/components/icons/IconDeck.vue
<template>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="deck-list-icon">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polygon points="2 17 12 22 22 17"></polygon>
        <polygon points="2 12 12 17 22 12"></polygon>
    </svg>
</template>

<script setup lang="ts">
// Nenhum script necessário
</script>

<style scoped>
.deck-list-icon {
    width: 1.3em;
    /* Ajuste o tamanho conforme necessário */
    height: 1.3em;
    margin-right: 0.5em;
    /* Espaço entre o ícone e o nome do deck */
    vertical-align: middle;
    /* Alinha bem com o texto */
    color: var(--primary-color);
    /* Usa a cor primária do tema, ou outra que preferir */
    flex-shrink: 0;
    /* Para não encolher se o nome do deck for longo */
}
</style>