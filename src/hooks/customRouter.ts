import { useRouter as useVueRouter, RouteLocationRaw } from 'vue-router';
import { ref, Ref } from 'vue';
class History {
  private history: RouteLocationRaw[];
  canBack: Ref<boolean>;
  constructor() {
    this.history = [];
    this.canBack = ref(false);
  }
  push(to: RouteLocationRaw) {
    this.history.push(to);
    this.updateCanBack();
  }
  pop() {
    this.history.pop();
    this.updateCanBack();
  }
  clear() {
    this.history.length = 0;
    this.updateCanBack();
  }
  private updateCanBack() {
    if (this.history.length) {
      this.canBack.value = true;
    } else {
      this.canBack.value = false;
    }
  }
}
const history = new History();
export function useRouter() {
  const router = useVueRouter();
  return {
    push(to: RouteLocationRaw) {
      history.push(to);
      return router.push(to);
    },
    back() {
      history.pop();
      return router.back();
    },
  };
}
export function useHistory() {
  return {
    clear() {
      history.clear();
    },
    canBack: history.canBack,
  };
}
