import { Mark } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const CommentPluginKey = new PluginKey('comment')

export const Comment = Mark.create({
  name: 'comment',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {}
          }

          return {
            'data-comment-id': attributes.commentId,
          }
        },
      },
      commentData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-comment')
          if (!data) return null
          try {
            return JSON.parse(data)
          } catch (error) {
            console.error('Failed to parse comment data:', error)
            return null
          }
        },
        renderHTML: attributes => {
          if (!attributes.commentData) {
            return {}
          }

          return {
            'data-comment': JSON.stringify(attributes.commentData),
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...this.options.HTMLAttributes, ...HTMLAttributes }, 0]
  },

  addCommands() {
    return {
      setComment: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes)
      },
      unsetComment: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CommentPluginKey,
      }),
    ]
  },
})