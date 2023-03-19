import { render, createElementVNode } from 'vue';
import Message from '@/components/message/Message.vue';
interface HTMLBody extends HTMLElement {
  $messageRoot?: HTMLDivElement;
}

const root = (function getMessageRoot() {
  const EL: HTMLBody = document.body;
  if (EL.$messageRoot) {
    return EL.$messageRoot;
  }
  const messageRoot = document.createElement('div');
  messageRoot.className = 'f-message';
  EL.$messageRoot = messageRoot;
  EL.appendChild(messageRoot);
  return messageRoot;
})();

export function message(timeout = 2000) {
  render(createElementVNode('div'), root);
}
