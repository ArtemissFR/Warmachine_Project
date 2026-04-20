/**
 * CORE OPS - ASSISTANT SYSTEM (ES Module)
 * Handles personality logic, character variants, and contextual memory.
 */

import { State } from '../core/state.js';
import { Events, APP_EVENTS } from '../core/events.js';

export const ASSISTANT_CHARS = {
  allen:              'assets/images/person/Allen.png',
  eve:                'assets/images/person/Eve.png',
  robot:              'assets/images/person/Robot.png',
  zack:               'assets/images/person/Zack.png',
  invincible_classic: 'assets/images/person/Invincible.png',
  invincible_blue:    'assets/images/person/Invincible Blue.png',
  omniman:            'assets/images/person/Omniman.png',
  conquest:           'assets/images/person/Conquest.png',
  thragg:             'assets/images/person/Thragg.png',
};

const POOLS = {
  encouraging: [
    "Ne lâche rien ! Chaque répétition compte.",
    "La constance est la clé de la transformation.",
    "Nexus est fier de ton parcours today.",
    "Le volume d'entraînement est ton meilleur allié.",
    "N'oublie pas de t'hydrater, Soldat.",
    "La seule mauvaise séance est celle que tu n'as pas faite.",
    "Visualise ta réussite avant chaque série."
  ],
  military: [
    "Soldat ! Reprenez le rythme. Pas de repos pour les braves.",
    "L'acier ne ment jamais. Poussez plus fort !",
    "Discipline au-dessus de tout. Exécution immédiate.",
    "Nexus n'accepte que l'excellence. Dépassez vos limites.",
    "Hydratez-vous. C'est un ordre.",
    "La douleur est une information. Gérez-la.",
    "Rapport de mission : Volume insuffisant. Augmentez la charge."
  ],
  sarcastic: [
    "Oh, une autre série ? J'espère que celle-là compte.",
    "Nexus enregistre tout... même vos pauses trop longues.",
    "Incroyable. Vous avez vraiment l'intention de soulever ça ?",
    "L'hydratation, c'est pour les faibles ? Non, buvez un coup.",
    "Votre rythme cardiaque est... intéressant. On s'amuse bien ?",
    "Ne mourez pas tout de suite, les stats sont en cours.",
    "C'est ça votre maximum ? J'ai vu des robots plus lents."
  ]
};

export class Assistant {
  constructor() {
    this.memory = State.get('nexus-ai-memory', { events: [] });
    this.initEvents();
  }

  initEvents() {
    Events.on(APP_EVENTS.PR_ACHIEVED, (data) => this.recordEvent('PR', data));
    Events.on(APP_EVENTS.RANK_UP, (data) => this.recordEvent('RANK', data));
  }

  recordEvent(type, data) {
    this.memory.events.push({ type, data, timestamp: Date.now() });
    if (this.memory.events.length > 10) this.memory.events.shift();
    State.set('nexus-ai-memory', this.memory);
  }

  getPersonality() {
    return localStorage.getItem('nexus-assistant-personality') || 'encouraging';
  }

  getVariant() {
    return localStorage.getItem('nexus-variant') || 'invincible_classic';
  }

  getCharImage() {
    const variant = this.getVariant();
    return ASSISTANT_CHARS[variant] || ASSISTANT_CHARS.invincible_classic;
  }

  generateMessage() {
    const personality = this.getPersonality();
    const messages = POOLS[personality] || POOLS.encouraging;
    const username = localStorage.getItem('nexus-username') || 'Soldat';
    
    // Contextual Priority
    const lastEvent = this.memory.events[this.memory.events.length - 1];
    if (lastEvent && (Date.now() - lastEvent.timestamp < 3600000)) { // 1 hour window
        if (lastEvent.type === 'PR') {
            return `${username}, votre nouveau record sur ${lastEvent.data.exo} est enregistré. L'évolution se poursuit.`;
        }
        if (lastEvent.type === 'RANK') {
            return `Félicitations pour votre promotion au rang de ${lastEvent.data.newRank}, Soldat.`;
        }
    }

    // Default Random
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    return `${username}, ${randomMsg.toLowerCase()}`;
  }
}

export const nexusAssistant = new Assistant();
