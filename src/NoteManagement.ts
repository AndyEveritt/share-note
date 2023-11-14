import { Setting } from 'obsidian'
import SharePlugin from './main'
import { parseExistingShareUrl } from './api'
import { YamlField } from './settings'

interface NoteItem {
  id: string; // Shared note ID
  updated: string;
  path?: string; // Vault path to the local note
}

export default class NoteManagement {
  plugin: SharePlugin
  containerEl: HTMLDivElement

  constructor (plugin: SharePlugin) {
    this.plugin = plugin
    this.containerEl = document.createElement('div')

    new Setting(this.containerEl)
      .setName('Test')
      .setDesc('Test description')

    const calloutEl = document.createElement('div')
    calloutEl.classList.add('callout', 'is-collapsible')
    const titleEl = document.createElement('div')
    titleEl.classList.add('callout-title')
    titleEl.innerText = 'Test title'
    calloutEl.append(titleEl)

    const contents = document.createElement('div')
    contents.innerHTML = '<p>asdf asdf asdf</p>'
  }

  async getNotes () {
    let sharedNotes: NoteItem[] = []
    try {
      // Get the notes from the server
      sharedNotes = await this.plugin.api.get('/v1/account/notes')
      // Get the local list of shared vault notes
      const app = this.plugin.app
      app.vault.getMarkdownFiles().forEach(file => {
        const metadata = app.metadataCache.getFileCache(file)
        // Check for a frontmatter property
        const shareLink = metadata?.frontmatter?.[this.plugin.field(YamlField.link)]
        if (shareLink) {
          const parsed = parseExistingShareUrl(shareLink)
          if (parsed) {
            const row = sharedNotes.find(x => x.id === parsed.filename)
            if (row) {
              // Found a local note which maps to this shared ID
              row.path = file.path
            }
          }
        }
      })
    } catch (e) {
      console.log(e)
    }
    return sharedNotes
  }
}