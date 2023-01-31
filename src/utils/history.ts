import { ref } from 'vue';
import { useRouter, RouteLocationRaw } from 'vue-router';
const router = useRouter();
class FHistory {
  forwardLen = ref(0);
  backLen = ref(0);
  push(to: RouteLocationRaw) {
    console.log(this);
    // this.backLen.value++;
    // router.push(to);
  }
  back() {
    if (this.backLen.value > 0) {
      this.backLen.value--;
    }
    this.forwardLen.value++;
    router.back();
  }
  forward() {
    if (this.forwardLen.value > 0) {
      this.forwardLen.value--;
    }
    this.backLen.value++;
    router.forward();
  }
}

export const fHistory = new FHistory();
