import action from '../assets/loading_img/action.jpg';
import darkFantasy from '../assets/loading_img/dark_fantasy.jpg';
import fantasy from '../assets/loading_img/fantasy.jpg';
import mystery from '../assets/loading_img/mystery.jpg';

const loadingImages = [action, darkFantasy, fantasy, mystery];

export function getRandomLoadingImage(): string {
  const index = Math.floor(Math.random() * loadingImages.length);
  return loadingImages[index];
}