# 🛡️ Intégration Tailwind CSS v4 - Projet W40K Scoring

## 📋 Statut de l'Intégration

### ✅ Complété
- [x] Installation de Tailwind CSS v4 (`@tailwindcss/vite`)
- [x] Configuration du plugin Vite
- [x] Définition du thème W40K personnalisé
- [x] Variables CSS du thème intégrées
- [x] Création de composants d'exemple
- [x] Tests d'intégration de base

### 🔄 En Cours
- [ ] Migration progressive des composants existants
- [ ] Résolution des conflits avec les styles scoped
- [ ] Optimisation des performances

### 📋 À Faire
- [ ] Migration complète des styles existants
- [ ] Documentation des composants
- [ ] Tests de régression
- [ ] Optimisation de production

## 🎨 Thème W40K Configuré

### Palette de Couleurs

#### Rouge (W40K Red)
```css
--color-w40k-red-50: #fef2f2    /* Rouge très clair */
--color-w40k-red-100: #fee2e2   /* Rouge clair */
--color-w40k-red-200: #fecaca   /* Rouge léger */
--color-w40k-red-300: #fca5a5   /* Rouge moyen clair */
--color-w40k-red-400: #f87171   /* Rouge moyen */
--color-w40k-red-500: #dc2626   /* Rouge principal */
--color-w40k-red-600: #991b1b   /* Rouge foncé */
--color-w40k-red-700: #7f1d1d   /* Rouge très foncé */
--color-w40k-red-800: #5f1515   /* Rouge sombre */
--color-w40k-red-900: #450a0a   /* Rouge ultra sombre */
```

#### Or (W40K Gold)
```css
--color-w40k-gold-50: #fefce8   /* Or très clair */
--color-w40k-gold-100: #fef9c3  /* Or clair */
--color-w40k-gold-200: #fef08a  /* Or léger */
--color-w40k-gold-300: #fde047  /* Or moyen clair */
--color-w40k-gold-400: #fbbf24  /* Or moyen */
--color-w40k-gold-500: #eab308  /* Or principal */
--color-w40k-gold-600: #a16207  /* Or foncé */
--color-w40k-gold-700: #713f12  /* Or très foncé */
--color-w40k-gold-800: #52331c  /* Or sombre */
--color-w40k-gold-900: #3e2723  /* Or ultra sombre */
```

#### Backgrounds
```css
--color-w40k-bg-primary: #0c0a09     /* Fond principal (noir) */
--color-w40k-bg-secondary: #1c1917   /* Fond secondaire */
--color-w40k-bg-elevated: #292524    /* Fond élevé */
--color-w40k-bg-surface: #44403c     /* Surface */
```

#### Texte
```css
--color-w40k-text-primary: #f5f5f4   /* Texte principal */
--color-w40k-text-secondary: #d6d3d1 /* Texte secondaire */
--color-w40k-text-muted: #a8a29e     /* Texte atténué */
--color-w40k-text-subtle: #78716c    /* Texte subtil */
```

### Ombres Personnalisées
```css
--shadow-w40k-sm: 0 1px 2px 0 rgba(220, 38, 38, 0.05)
--shadow-w40k: 0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(220, 38, 38, 0.06)
--shadow-w40k-lg: 0 10px 15px -3px rgba(220, 38, 38, 0.1), 0 4px 6px -2px rgba(220, 38, 38, 0.05)
--shadow-w40k-xl: 0 20px 25px -5px rgba(220, 38, 38, 0.1), 0 10px 10px -5px rgba(220, 38, 38, 0.04)
```

## 🔧 Configuration Technique

### Structure des Fichiers
```
inertia/
├── css/
│   └── app.css              # Thème Tailwind principal
├── pages/
│   ├── test-tailwind.vue    # Page de test des classes
│   └── parties/
│       └── components/
│           ├── TailwindExampleCard.vue    # Exemple d'utilisation
│           └── ModernScoreCell.vue        # Migration du ScoreCell
```

### Vite Configuration
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    inertia({ ssr: { enabled: true, entrypoint: 'inertia/app/ssr.ts' } }),
    vue(),
    tailwindcss(),  // Plugin Tailwind CSS v4
    adonisjs({ entrypoints: ['inertia/app/app.ts'] }),
  ],
})
```

## 📖 Guide d'Utilisation

### Classes Prêtes à l'Emploi

#### Couleurs de Fond
```html
<div class="bg-w40k-bg-primary">     <!-- Fond principal -->
<div class="bg-w40k-bg-secondary">   <!-- Fond secondaire -->
<div class="bg-w40k-red-500">        <!-- Rouge principal -->
<div class="bg-w40k-gold-500">       <!-- Or principal -->
```

#### Couleurs de Texte
```html
<p class="text-w40k-text-primary">   <!-- Texte principal -->
<p class="text-w40k-red-400">        <!-- Texte rouge -->
<p class="text-w40k-gold-400">       <!-- Texte or -->
```

#### Bordures
```html
<div class="border-2 border-w40k-red-500">    <!-- Bordure rouge -->
<div class="border border-w40k-gold-400">     <!-- Bordure or fine -->
```

#### Ombres
```html
<div class="shadow-w40k">      <!-- Ombre W40K standard -->
<div class="shadow-w40k-lg">   <!-- Ombre W40K large -->
```

### Exemple de Composant
```vue
<template>
  <div class="bg-w40k-bg-secondary border-2 border-w40k-red-500 rounded-lg p-6 shadow-w40k-lg">
    <h3 class="text-xl font-semibold text-w40k-text-primary mb-4">
      Titre du Composant
    </h3>
    
    <p class="text-w40k-text-secondary mb-6">
      Description du composant avec le thème W40K.
    </p>
    
    <button class="px-4 py-2 bg-w40k-red-500 hover:bg-w40k-red-600 text-white rounded transition-colors">
      Action
    </button>
  </div>
</template>
```

## 🚨 Limitations Actuelles

### Problèmes Identifiés
1. **Styles Scoped**: Les composants existants utilisant `@apply` dans les sections `<style scoped>` ne sont pas compatibles avec Tailwind CSS v4
2. **Migration Progressive**: Nécessité de migrer composant par composant
3. **Coexistence**: Les styles CSS existants et Tailwind doivent coexister temporairement

### Solutions Appliquées
1. **Approche Hybride**: Conservation des styles existants + nouveaux composants en Tailwind
2. **Composants d'Exemple**: Création de composants modernes pour servir de modèles
3. **Documentation**: Guide de migration détaillé

## 🔄 Plan de Migration

### Phase 1: Foundation ✅
- [x] Installation et configuration de Tailwind CSS v4
- [x] Définition du thème W40K
- [x] Création de composants d'exemple

### Phase 2: Migration Progressive 🔄
- [ ] Identification des composants prioritaires
- [ ] Migration composant par composant
- [ ] Tests de régression après chaque migration

### Phase 3: Optimisation
- [ ] Suppression des styles CSS obsolètes
- [ ] Optimisation des performances
- [ ] Validation finale

## 🧪 Tests et Validation

### Pages de Test
- `/test-tailwind` - Page complète avec composants Tailwind
- `/simple-tailwind` - Test basique sans conflits

### Validation Visuelle
1. Thème W40K cohérent
2. Responsive design fonctionnel
3. Transitions et interactions fluides

### Performance
- Taille du bundle CSS optimisée
- Temps de chargement réduits
- Compatibilité cross-browser

## 📚 Ressources

### Documentation
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/)
- [Vite Plugin Documentation](https://github.com/tailwindlabs/tailwindcss-vite)

### Composants d'Exemple
- `TailwindExampleCard.vue` - Carte d'exemple complète
- `ModernScoreCell.vue` - Migration du composant ScoreCell

### Thème de Couleurs
Toutes les couleurs sont définies selon les standards Warhammer 40K avec une palette complète de 50 à 900 pour chaque couleur principale.

---

**Note**: Cette intégration suit une approche progressive pour éviter les disruptions du développement en cours. Les composants existants continuent de fonctionner avec leurs styles actuels pendant que les nouveaux composants utilisent Tailwind CSS v4.