import React, { useEffect, useState, ChangeEvent } from 'react';
import { axiosV5 } from '~/libs/useAxiosInstance';
import styles from './Dialog.module.scss';
import { Term } from '../types';

interface EditTermsDialogProps {
  userId: string;
  userTerms: Term[];
  onClose: () => void;
  onSave: (updatedTerms: Term[]) => void;
}

const EditTermsDialog: React.FC<EditTermsDialogProps> = ({
  userId,
  userTerms,
  onClose,
  onSave,
}) => {
  const [currentTerms, setCurrentTerms] = useState<Term[]>([]);
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    // Initialize current terms from props
    setCurrentTerms(userTerms);

    // Fetch terms from real API GET /v5/terms
    axiosV5.get('/terms')
      .then((response) => {
        console.log('Fetched terms:', response.data);
        // The API may return an array directly or wrapped in an object.
        if (Array.isArray(response.data)) {
          setAllTerms(response.data);
        } else if (
          response.data &&
          response.data.result &&
          Array.isArray(response.data.result)
        ) {
          setAllTerms(response.data.result);
        }
      })
      .catch((error) => {
        console.error('Error fetching terms', error);
      });
  }, [userTerms]);

  // API functions
  const signTermForUser = (termId: string) => {
    return axiosV5.post(`/terms/${termId}/users`, { memberId: userId });
  };

  const unsignTermForUser = (termId: string) => {
    return axiosV5.delete(`/terms/${termId}/users/${userId}`);
  };

  const removeTerm = (termId: string) => {
    // Call DELETE API then update state if successful
    unsignTermForUser(termId)
      .then(() => {
        setCurrentTerms((prev) => prev.filter((t) => t.id !== termId));
      })
      .catch((err) => {
        console.error(`Error unsigning term ${termId} for user ${userId}`, err);
      });
  };

  const addTerm = () => {
    if (!selectedTermId) return;
    const termToAdd = allTerms.find((t) => t.id === selectedTermId);
    if (!termToAdd) return;
    // Avoid duplicates
    if (currentTerms.some((t) => t.id === termToAdd.id)) return;

    // Call POST API to sign the term
    signTermForUser(selectedTermId)
      .then(() => {
        setCurrentTerms((prev) => [...prev, termToAdd]);
      })
      .catch((err) => {
        console.error(`Error signing term ${selectedTermId} for user ${userId}`, err);
      });
  };

  const handleSave = () => {
    onSave(currentTerms);
  };

  // Filter available terms by title (not already signed)
  const availableTerms = allTerms.filter(
    (term) =>
      !currentTerms.some((t) => t.id === term.id) &&
      term.title.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.dialogHeader}>
          <h2>Terms for User {userId}</h2>
        </div>

        {/* Body */}
        <div className={styles.dialogBody}>
          <h3>Signed Terms</h3>
          {currentTerms.length ? (
            <table>
              <thead>
                <tr>
                  <th>Term ID</th>
                  <th>Title</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentTerms.map((term) => (
                  <tr key={term.id}>
                    <td>{term.id}</td>
                    <td>{term.title}</td>
                    <td>
                      <button onClick={() => removeTerm(term.id)}>
                        Unsign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No terms signed yet.</p>
          )}

          <h3>Add Term</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Filter terms by title..."
              value={filterText}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFilterText(e.target.value)
              }
              style={{ width: '100%', padding: '0.4rem', marginBottom: '0.5rem' }}
            />
          </div>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">-- Select Term --</option>
            {availableTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.title}
              </option>
            ))}
          </select>
          <button className={styles.addButton} onClick={addTerm}>
            Sign Term
          </button>
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTermsDialog;
