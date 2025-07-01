import { Mark } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const CommentPluginKey = new PluginKey("comment");

export const Comment = Mark.create({
  name: "comment",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {};
          }

          return {
            "data-comment-id": attributes.commentId,
          };
        },
      },
      commentData: {
        default: null,
        parseHTML: (element) => {
          const data = element.getAttribute("data-comment");
          if (!data) return null;
          try {
            return JSON.parse(data);
          } catch (error) {
            console.error("Failed to parse comment data:", error);
            return null;
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.commentData) {
            return {};
          }

          return {
            "data-comment": JSON.stringify(attributes.commentData),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        class: "comment-marked-text",
        style:
          "background-color: rgba(255, 230, 0, 0.15); border-bottom: 1px bold #f59e0b; cursor: pointer;",
      },
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CommentPluginKey,
        props: {
          handleClick(view, pos, event) {
            // 获取点击位置的标记
            const { state } = view;
            const { doc, selection } = state;
            const $pos = doc.resolve(pos);

            // 检查点击位置是否有评论标记
            const marks = $pos
              .marks()
              .filter((mark) => mark.type.name === "comment");

            if (marks.length > 0) {
              // 找到评论标记
              const commentMark = marks[0];
              const commentData = commentMark.attrs.commentData;

              if (commentData) {
                // 创建自定义事件，传递评论数据
                const customEvent = new CustomEvent("comment-clicked", {
                  detail: { comment: commentData },
                  bubbles: true,
                });

                // 触发事件
                view.dom.dispatchEvent(customEvent);

                // 返回true表示事件已处理
                return true;
              }
            }

            // 返回false表示事件未处理，继续正常处理
            return false;
          },
        },
      }),
    ];
  },
});
