module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
        'vue/setup-compiler-macros': true, // Importante para <script setup> e macros como defineProps
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-strongly-recommended', // Ou vue3-essential, vue3-recommended
        '@vue/eslint-config-typescript/recommended', // Configuração para Vue + TS
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // O parser já é definido por @vue/eslint-config-typescript para vue-eslint-parser
        // e este, por sua vez, usa @typescript-eslint/parser para blocos <script lang="ts">
    },
    plugins: [
        'vue', // Já incluído por plugin:vue/vue3-strongly-recommended
        // '@typescript-eslint' // Já incluído por @vue/eslint-config-typescript
    ],
    rules: {
        // Suas regras personalizadas podem ir aqui. Exemplos:
        'vue/multi-word-component-names': 'off', // Desabilita se você não quiser nomes de componentes com múltiplas palavras
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Avisa sobre vars não usadas
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Para TS

        // Se o erro "has no default export" persistir, você pode tentar adicionar:
        // 'import/default': 'off',
        // 'import/no-named-as-default-member': 'off',
        // (Para isso, você precisaria instalar eslint-plugin-import: npm install -D eslint-plugin-import)

        // No entanto, com a configuração @vue/eslint-config-typescript, o erro original
        // "has no default export" para arquivos .vue não deveria mais acontecer.
    },
};