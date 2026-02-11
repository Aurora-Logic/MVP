// ════════════════════════════════════════
// Tiptap Bundle Entry — esbuild compiles this into tiptap.bundle.js
// Run: npm run build:tiptap
// DO NOT load this file directly in the browser.
// ════════════════════════════════════════

import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import BubbleMenu from '@tiptap/extension-bubble-menu'

window.TiptapEditor = Editor
window.TiptapStarterKit = StarterKit
window.TiptapUnderline = Underline
window.TiptapHighlight = Highlight
window.TiptapTable = Table
window.TiptapTableRow = TableRow
window.TiptapTableCell = TableCell
window.TiptapTableHeader = TableHeader
window.TiptapTaskList = TaskList
window.TiptapTaskItem = TaskItem
window.TiptapPlaceholder = Placeholder
window.TiptapLink = Link
window.TiptapBubbleMenu = BubbleMenu
window.tiptapReady = true
window.dispatchEvent(new Event('tiptap-ready'))
