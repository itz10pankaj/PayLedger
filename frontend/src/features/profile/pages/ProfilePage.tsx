import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useToast } from '../../../components/Toast/ToastProvider';
import { profileService } from '../services/profile.service';
import type { Profile } from '../types/profile.types';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    return profileService.getMe().then((p) => {
      setProfile(p);
      setName(p.name);
      setEmail(p.email);
    });
  }

  useEffect(() => {
    load()
      .catch(() => showToast('Could not load profile', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileService.updateMe({ name, email });
      setProfile(updated);
      setEditing(false);
      showToast('Profile updated', 'success');
    } catch {
      showToast('Could not update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className={`container ${styles.wrapper}`}>
      <div className={styles.headerCard}>
        <span className={styles.avatar}>{profile.name.charAt(0).toUpperCase()}</span>
        <div>
          <div className={styles.name}>{profile.name}</div>
          <span className={styles.rolePill}>{profile.role}</span>
        </div>
      </div>

      <div className="card">
        <h2>Account details</h2>
        {editing ? (
          <form className="form" onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.editActions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Name</span>
              <span className={styles.detailValue}>{profile.name}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <span className={styles.detailValue}>{profile.email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Mobile number</span>
              <span className={styles.detailValue}>+91 {profile.phone}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Member since</span>
              <span className={styles.detailValue}>
                {new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className={styles.editActions}>
              <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
