// apps/api/src/modules/inventory/inventory.module.ts
import router from './inventory.routes.js';
import * as controller from './inventory.controller.js';
import { inventoryService } from './inventory.service.js';

export const inventoryModule = {
  router,
  controller,
  service: inventoryService,
};