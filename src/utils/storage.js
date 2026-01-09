import { db } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, query, getDocs } from 'firebase/firestore';

const storage = {
  async get(key, userId = 'default_user') {
    try {
      const docRef = doc(db, 'users', userId, 'data', key);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { key, value: docSnap.data().value };
      }
      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      throw error;
    }
  },

  async set(key, value, userId = 'default_user') {
    try {
      const docRef = doc(db, 'users', userId, 'data', key);
      await setDoc(docRef, { value, updatedAt: new Date() });
      return { key, value };
    } catch (error) {
      console.error('Storage set error:', error);
      return null;
    }
  },

  async delete(key, userId = 'default_user') {
    try {
      const docRef = doc(db, 'users', userId, 'data', key);
      await deleteDoc(docRef);
      return { key, deleted: true };
    } catch (error) {
      console.error('Storage delete error:', error);
      return null;
    }
  },

  async list(prefix = '', userId = 'default_user') {
    try {
      const q = query(collection(db, 'users', userId, 'data'));
      const querySnapshot = await getDocs(q);
      const keys = [];
      querySnapshot.forEach((doc) => {
        if (!prefix || doc.id.startsWith(prefix)) {
          keys.push(doc.id);
        }
      });
      return { keys };
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [] };
    }
  }
};

export default storage;