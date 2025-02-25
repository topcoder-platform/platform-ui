// src/apps/admin/src/user-management/dialogs/EditTermsDialog.tsx
import React, { useEffect, useState } from 'react'
import styles from './Dialog.module.scss'

/** Example Term interface */
interface Term {
  id: string
  title: string
}

interface EditTermsDialogProps {
  userId: number
  addedTerms: Term[]      // Terms the user already signed
  notAddedTerms: Term[]   // Terms the user has not signed
  onClose: () => void
  onSave: (updatedAdded: Term[], updatedNotAdded: Term[]) => void
}

const EditTermsDialog: React.FC<EditTermsDialogProps> = ({
  userId,
  addedTerms,
  notAddedTerms,
  onClose,
  onSave,
}) => {
  const [currentAdded, setCurrentAdded] = useState<Term[]>([])
  const [currentNotAdded, setCurrentNotAdded] = useState<Term[]>([])
  const [filterAdded, setFilterAdded] = useState<string>('')
  const [filterNotAdded, setFilterNotAdded] = useState<string>('')

  useEffect(() => {
    // Initialize from props
    setCurrentAdded(addedTerms)
    setCurrentNotAdded(notAddedTerms)
  }, [addedTerms, notAddedTerms])

  /** Filter logic for added/not added */
  const filteredAdded = currentAdded.filter((t) =>
    t.title.toLowerCase().includes(filterAdded.toLowerCase())
  )
  const filteredNotAdded = currentNotAdded.filter((t) =>
    t.title.toLowerCase().includes(filterNotAdded.toLowerCase())
  )

  /** Unsign term */
  const unsignTerm = (termId: string) => {
    const term = currentAdded.find((t) => t.id === termId)
    if (!term) return
    // Move from added -> not added
    setCurrentAdded((prev) => prev.filter((t) => t.id !== termId))
    setCurrentNotAdded((prev) => [...prev, term])
  }

  /** Sign term */
  const signTerm = (termId: string) => {
    const term = currentNotAdded.find((t) => t.id === termId)
    if (!term) return
    // Move from not added -> added
    setCurrentNotAdded((prev) => prev.filter((t) => t.id !== termId))
    setCurrentAdded((prev) => [...prev, term])
  }

  /** Handle Save */
  const handleSave = () => {
    // Real code: POST /v5/terms/{Term ID}/users for newly added
    //           DELETE /v5/terms/{Term ID}/users/{User ID} for removed
    onSave(currentAdded, currentNotAdded)
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.dialogHeader}>
          <h2>Terms of guest{userId}</h2>
        </div>
        <div className={styles.dialogBody}>
          <div style={{ marginBottom: '1rem' }}>
            <h3>Added Terms</h3>
            <label>Title</label>
            <input
              type="text"
              value={filterAdded}
              onChange={(e) => setFilterAdded(e.target.value)}
              placeholder="Filter by title..."
            />
            {filteredAdded.length === 0 && <p>No terms</p>}
            {filteredAdded.map((term) => (
              <div key={term.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{term.title}</span>
                <button onClick={() => unsignTerm(term.id)}>Unsign</button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3>Not Added Terms</h3>
            <label>Title</label>
            <input
              type="text"
              value={filterNotAdded}
              onChange={(e) => setFilterNotAdded(e.target.value)}
              placeholder="Filter by title..."
            />
            {filteredNotAdded.map((term) => (
              <div key={term.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{term.title}</span>
                <button onClick={() => signTerm(term.id)}>Sign Terms</button>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.dialogFooter}>
          <button className="cancelBtn" onClick={onClose}>Close</button>
          <button className="saveBtn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default EditTermsDialog
