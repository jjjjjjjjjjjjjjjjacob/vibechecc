import '@testing-library/jest-dom/vitest';
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register(); 

/// <reference types="vite/client" />
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");