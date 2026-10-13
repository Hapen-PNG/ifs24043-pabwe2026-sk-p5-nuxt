import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
} from "vue-router";
import type { Component } from "vue";

export function createMockPinia(initialState?: Record<string, unknown>): Pinia {
  const pinia = createPinia();
  if (initialState) {
    pinia.state.value = initialState;
  }
  setActivePinia(pinia);
  return pinia;
}

export const StubPage: Component = { render: () => null };

export interface RenderOptions {
  props?: Record<string, unknown>;
  route?: string;
  routes?: RouteRecordRaw[];
  pinia?: Pinia;
  slots?: Record<string, string>;
  stubs?: Record<string, boolean | Component>;
}

/**
 * Merender komponen lengkap dengan Pinia dan Vue Router (memory history).
 */
export async function renderWithProviders(
  component: Component,
  options: RenderOptions = {}
) {
  const pinia = options.pinia ?? createMockPinia();
  const routes = options.routes ?? [
    { path: "/:pathMatch(.*)*", component: StubPage },
  ];

  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(options.route ?? "/");
  await router.isReady();

  const wrapper = mount(component, {
    props: options.props,
    slots: options.slots,
    global: {
      plugins: [pinia, router],
      stubs: options.stubs,
    },
  });

  return { wrapper, router, pinia };
}
