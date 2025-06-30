<template>
  <node-view-wrapper
    ref="container"
    :as="node.type.name === 'paragraph' ? 'p' : `h${node.attrs.level}`"
    :style="{ minHeight: estimatedHeight + 'px' }"
  >
    <div v-if="isIntersecting" ref="content">
      <node-view-content />
    </div>
  </node-view-wrapper>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from "@tiptap/vue-3";

const props = defineProps(nodeViewProps);

const container = ref(null);
const content = ref(null);
const isIntersecting = ref(false); // 默认不渲染内容
const estimatedHeight = ref(20);

let observer = null;

const estimateNodeHeight = (node) => {
  if (node.type.name === "heading") {
    return 40 + (4 - node.attrs.level) * 8;
  }
  const textLength = node.textContent?.length || 0;
  return 20 + Math.floor(textLength / 80) * 18; // 根据内容长度进行更精细的估算
};

onMounted(() => {
  estimatedHeight.value = estimateNodeHeight(props.node);
  const domNode = container.value?.$el;

  if (!domNode) return;

  // **关键修复**：
  // 1. 同步检查初始状态，如果已经在视口内，则立即渲染。
  const rect = domNode.getBoundingClientRect();
  if (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  ) {
    isIntersecting.value = true;
  }

  // 2. 创建 IntersectionObserver 以处理后续的滚动事件。
  observer = new IntersectionObserver(
    ([entry]) => {
      // 只有当交叉状态从未渲染变为渲染时才更新
      if (entry.isIntersecting && !isIntersecting.value) {
        isIntersecting.value = true;
        // 渲染后可以取消观察，因为我们不再需要将其切换回未渲染状态
        // 这可以提高性能
        if (observer) {
          observer.unobserve(domNode);
        }
      }
      // 注意：为了简化和性能，我们不处理离开视口的情况（即不将 isIntersecting 设回 false）
      // 这样做避免了滚动时内容的重复销毁和创建。
    },
    {
      // 扩大观察范围，提前渲染视口上下的内容，使滚动更流畅
      rootMargin: "400px 0px 400px 0px",
    }
  );

  observer.observe(domNode);
});

onBeforeUnmount(() => {
  if (observer && container.value?.$el) {
    observer.unobserve(container.value.$el);
  }
  observer = null;
});
</script>
