"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./assets/main.css");
const vue_1 = require("vue");
const pinia_1 = require("pinia");
const element_plus_1 = __importDefault(require("element-plus"));
require("element-plus/dist/index.css");
const App_vue_1 = __importDefault(require("./App.vue"));
const router_1 = __importDefault(require("./router"));
const app = (0, vue_1.createApp)(App_vue_1.default);
app.use((0, pinia_1.createPinia)());
app.use(router_1.default);
app.use(element_plus_1.default);
app.mount('#app');
