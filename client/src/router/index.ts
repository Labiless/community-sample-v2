import { createRouter, createWebHistory } from 'vue-router';
import MasterPage from '../pages/Master.vue';
import PlayerPage from '../pages/Player.vue';

const routes = [
  { path: '/', component: MasterPage },
  { path: '/player', component: PlayerPage }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
