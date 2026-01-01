import { create } from 'zustand';
import { getStoredFlags, saveFlags, resetFlags } from './featureFlags';

const useFeatureFlagStore = create((set, get) => ({
  flags: getStoredFlags(),

  isEnabled: (feature) => {
    return get().flags[feature] ?? false;
  },

  toggleFeature: (feature) => {
    set((state) => {
      const newFlags = {
        ...state.flags,
        [feature]: !state.flags[feature],
      };
      saveFlags(newFlags);
      return { flags: newFlags };
    });
  },

  setFeature: (feature, enabled) => {
    set((state) => {
      const newFlags = {
        ...state.flags,
        [feature]: enabled,
      };
      saveFlags(newFlags);
      return { flags: newFlags };
    });
  },

  resetAllFlags: () => {
    const defaultFlags = resetFlags();
    set({ flags: defaultFlags });
  },

  getAllFlags: () => {
    return get().flags;
  },
}));

export default useFeatureFlagStore;

