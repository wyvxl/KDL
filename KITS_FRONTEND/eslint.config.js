import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Función para cargar configuraciones de forma segura
const safeLoadConfig = (configLoader, fallback = {}) => {
  try {
    return configLoader();
  } catch (error) {
    console.warn('Error loading ESLint config:', error.message);
    return fallback;
  }
};

// Configuraciones base con manejo de errores
const baseConfigs = [
  safeLoadConfig(() => js.configs.recommended),
  safeLoadConfig(() => tseslint.configs.recommended),
  safeLoadConfig(() => reactHooks.configs.flat.recommended),
  safeLoadConfig(() => reactRefresh.configs.vite)
].filter(Boolean); // Filtrar configuraciones que fallaron

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: baseConfigs,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Reglas específicas para manejo de errores
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Reglas para prevenir problemas de error handling
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-unused-expressions': 'error',
      'prefer-promise-reject-errors': 'error'
    },
  },
])
