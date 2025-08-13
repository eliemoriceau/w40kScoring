Questions Architecturales Critiques

1. 🔐 Autorisation Strategy

- Ajout Round : Il y a automatiquement 5 Round
- Liste Rounds : Owner + participants peuvent les modifier, ou public readonly ?
- Modification : Le service doit permettre modification de rounds temps que la partie est en cours

2. 🔄 Relation avec GameService

- Validation Partie : RoundService valide l'existence de Game directement ?
- État Game : Doit-on valider que Game est IN_PROGRESS ?
- Orchestration : Qui coordonne Game state changes ?

3. 📊 Business Rules Round

- Ordre séquentiel : Rounds doivent-ils être créés dans l'ordre (1→2→3) ?
- Pré-requis : Round N+1 nécessite Round N completed ?
- Modification : Peut-on modifier/supprimer un round existant ?

4. 🎯 Scope Fonctionnel

- Score Management : RoundService gère-t-il aussi updateScores() ?
- Completion : completeRound() fait partie du service ?
- Stats : Faut-il inclure getRoundStats() ?

5. ⚡ Performance & Cache

- Pagination : Cursor-based ou offset pour listRounds ?
- Cache : Cache rounds par partie (Redis/mémoire) ?
- Bulk ops : Support création multiple rounds ?
