import { createRouter, createWebHistory } from 'vue-router';

// @ts-ignore
import MasterPage from '../pages/Master.vue';
// @ts-ignore
import PlayerPage from '../pages/Player.vue';

const routes = [
  { path: '/', component: PlayerPage },
  { path: '/player', component: PlayerPage },
  { path: '/master', component: MasterPage }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
