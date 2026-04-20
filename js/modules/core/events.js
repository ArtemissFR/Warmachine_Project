/**
 * CORE OPS - EVENT BUS (ES Module)
 * Pub/Sub system for decoupled module communication.
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const Events = new EventBus();

// Global app events constants
export const APP_EVENTS = {
  PR_ACHIEVED: 'PR_ACHIEVED',
  GOAL_MET: 'GOAL_MET',
  MEAL_ADDED: 'MEAL_ADDED',
  WORKOUT_COMPLETED: 'WORKOUT_COMPLETED',
  RANK_UP: 'RANK_UP',
  UI_REFRESH: 'UI_REFRESH'
};
