import {
  defineComponent,
  cloneVNode,
  VNode,
  Fragment,
  createElementVNode,
} from 'vue';

export default defineComponent({
  name: 'Trigger',
  // setup(props, { slots, attrs }) {
  //   console.log(attrs);
  //   // console.log(attrs);

  //   const defaultSlot = slots.default?.(attrs);
  //   const node = getFirstNode(defaultSlot);
  //   if (!node) {
  //     return;
  //   }

  //   // return () => node;
  // },

  render() {
    const defaultSlot = this.$slots.default?.(this.$attrs);
    const node = getFirstNode(defaultSlot);
    if (node) {
      return cloneVNode(node, { class: 'f-popover-trigger', ...this.$attrs });
    }
  },
});

function getFirstNode(vnode?: VNode[]): VNode | null {
  if (!vnode) {
    return null;
  }

  for (const child of vnode) {
    if (typeof child === 'object') {
      switch (child.type) {
        case Comment:
          continue;
        case Text:
        case Fragment:
          return getFirstNode(child.children as VNode[]);
        default:
          return child;
      }
    }
  }
  return null;
}
