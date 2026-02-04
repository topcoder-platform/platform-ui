/**
 * Bundled Editor.
 */
import { FC } from 'react'
import classNames from 'classnames'
import 'tinymce/tinymce'
import 'tinymce/models/dom/model.min.js'
import 'tinymce/themes/silver/theme.min.js'
import 'tinymce/icons/default/icons.min.js'
import 'tinymce/skins/ui/oxide/skin'
import 'tinymce/skins/content/default/content'
import 'tinymce/skins/ui/oxide/content'
import 'tinymce/plugins/table/plugin.min.js'
import 'tinymce/plugins/link/plugin.min.js'

import { Editor } from '@tinymce/tinymce-react'

import styles from './BundledEditor.module.scss'

export const BundledEditor: FC<any> = (props: any) => (
    <div className={classNames(styles.container, props.className)}>
        <Editor {...props} />
    </div>
)

export default BundledEditor
