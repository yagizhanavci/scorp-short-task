// @ts-check

import { APIWrapper, API_EVENT_TYPE } from "./api.js";
import {
  addMessage,
  animateGift,
  isPossiblyAnimatingGift,
} from "./dom_updates.js";

// Priority Order
const order = {
  [API_EVENT_TYPE.ANIMATED_GIFT]: 1,
  [API_EVENT_TYPE.MESSAGE]: 2,
  [API_EVENT_TYPE.GIFT]: 3,
};

// Event Queue
let eventQueue = [];

// Animation Queue
let animationQueue = [];

const api = new APIWrapper(5, true, true);

api.setEventHandler((events) => {
  // Order events according to priorty order
  const orderedEvents = orderEvents(events);

  // Remove duplicate events
  const uniqueEvents = removeDuplicateEvents([...eventQueue, ...orderedEvents]);

  // Add new ordered events to eventQueue
  eventQueue = [...uniqueEvents];
});

// Show valid events each 500ms
function startShowingEvents() {
  setInterval(() => {
    if (eventQueue.length === 0) return;
    else {
      const validEvent = findValidEvent();
      if (validEvent !== undefined && validEvent !== null) {
        showEvent(validEvent);
      }
    }
  }, 500);
}

// Find next valid event in eventQueue or return null
function findValidEvent() {
  // If animationQueue has events waiting to animate return next event
  if (animationQueue.length > 0 && !isPossiblyAnimatingGift()) {
    return animationQueue.shift();
  }

  // If not check if eventQueue is empty, if empty return null, if not continue with next step
  else if (eventQueue.length === 0) return null;
  else {
    // Get the next event in eventQueue
    const currentEvent = eventQueue.shift();

    // If currentEvent is animated gift, check if the ui is already animating a gift event, if it is then add the event to animationQueue, if not return it
    if (currentEvent.type === API_EVENT_TYPE.ANIMATED_GIFT) {
      if (isPossiblyAnimatingGift()) {
        animationQueue = [...animationQueue, currentEvent];
        findValidEvent();
      } else return currentEvent;
    }

    // If currentEvent is not message nor animated gift return it immediately,if not then currentEvent is a message, check timestamp of the message, if it is valid return it, if not then get next valid event
    else if (
      currentEvent.type !== API_EVENT_TYPE.MESSAGE ||
      (currentEvent.type === API_EVENT_TYPE.MESSAGE &&
        Date.now() - currentEvent.timestamp.getTime() < 20000)
    ) {
      return currentEvent;
    } else findValidEvent();
  }
}

// Order function takes events as a parameter and compares them with compare function then returns new ordered events.
function orderEvents(events) {
  return events.sort(compareEvents);
}

// Compare function
function compareEvents(a, b) {
  return order[a.type] - order[b.type];
}

// Removes duplicate events by checking same id occuring in events array and returns unique events array.
function removeDuplicateEvents(events) {
  return events.filter(
    (event, index, self) =>
      self.findIndex((_event) => _event.id === event.id) === index,
  );
}

// Show event function
function showEvent(event) {
  switch (event.type) {
    case API_EVENT_TYPE.ANIMATED_GIFT:
      animateGift(event);
      addMessage(event);
      break;
    case API_EVENT_TYPE.MESSAGE:
      addMessage(event);
      break;
    case API_EVENT_TYPE.GIFT:
      addMessage(event);
      break;
    default:
      addMessage(event);
  }
}

startShowingEvents();

// NOTE: UI helper methods from `dom_updates` are already imported above.
