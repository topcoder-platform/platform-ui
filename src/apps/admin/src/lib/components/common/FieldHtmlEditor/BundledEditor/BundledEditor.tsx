/**
 * Bundled Editor.
 */
import { FC } from 'react'
import classNames from 'classnames'
import 'tinymce/tinymce' // TinyMCE so the global var exists
import 'tinymce/models/dom/model.min.js' // DOM model
import 'tinymce/themes/silver/theme.min.js' // Theme
import 'tinymce/icons/default/icons.min.js' // Toolbar icons
import 'tinymce/skins/ui/oxide/skin' // Editor styles
import 'tinymce/skins/content/default/content' // Content styles, including inline UI like fake cursors
import 'tinymce/skins/ui/oxide/content'
import 'tinymce/plugins/table/plugin.min.js'
import 'tinymce/plugins/link/plugin.min.js'
// import 'tinymce/plugins/advlist/plugin.min.js' // importing the plugin js.
// import 'tinymce/plugins/anchor/plugin.min.js'
// import 'tinymce/plugins/autolink/plugin.min.js'
// import 'tinymce/plugins/autoresize/plugin.min.js'
// import 'tinymce/plugins/autosave/plugin.min.js'
// import 'tinymce/plugins/charmap/plugin.min.js'
// import 'tinymce/plugins/code/plugin.min.js'
// import 'tinymce/plugins/codesample/plugin.min.js'
// import 'tinymce/plugins/directionality/plugin.min.js'
// import 'tinymce/plugins/emoticons/plugin.min.js'
// import 'tinymce/plugins/fullscreen/plugin.min.js'
// import 'tinymce/plugins/help/plugin.min.js'
// import 'tinymce/plugins/image/plugin.min.js'
// import 'tinymce/plugins/importcss/plugin.min.js'
// import 'tinymce/plugins/insertdatetime/plugin.min.js'
// import 'tinymce/plugins/lists/plugin.min.js'
// import 'tinymce/plugins/media/plugin.min.js'
// import 'tinymce/plugins/nonbreaking/plugin.min.js'
// import 'tinymce/plugins/pagebreak/plugin.min.js'
// import 'tinymce/plugins/preview/plugin.min.js'
// import 'tinymce/plugins/quickbars/plugin.min.js'
// import 'tinymce/plugins/save/plugin.min.js'
// import 'tinymce/plugins/searchreplace/plugin.min.js'
// import 'tinymce/plugins/visualblocks/plugin.min.js'
// import 'tinymce/plugins/visualchars/plugin.min.js'
// import 'tinymce/plugins/wordcount/plugin.min.js'
// import 'tinymce/plugins/emoticons/js/emojis' // importing plugin resources
/** if you use a plugin that is not listed here the editor will fail to load */

import { Editor } from '@tinymce/tinymce-react'

import styles from './BundledEditor.module.scss'

export const BundledEditor: FC<any> = (props: any) => (
    <div className={classNames(styles.container, props.className)}>
        <Editor {...props} />
    </div>
)

export default BundledEditor
