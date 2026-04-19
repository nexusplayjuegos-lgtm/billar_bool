'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Music,
  Music2,
  Vibrate,
  Bell,
  BellOff,
  Globe,
  Trash2,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const t = useTranslations('settings');
  const { profile } = useUserStore() as any;

  const [sound, setSound] = useState(profile?.settings?.sound ?? true);
  const [music, setMusic] = useState(profile?.settings?.music ?? true);
  const [vibration, setVibration] = useState(profile?.settings?.vibration ?? true);
  const [notifications, setNotifications] = useState(profile?.settings?.notifications ?? true);
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>((profile?.settings?.language as 'pt' | 'en' | 'es') || 'pt');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLanguageChange = (lang: 'pt' | 'en' | 'es') => {
    setLanguage(lang);
    setShowLangMenu(false);
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/(pt|en|es)/, `/${lang}`);
    window.location.href = newPath;
  };

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const SettingRow = ({
    icon: Icon,
    label,
    value,
    onToggle,
    activeColor = 'bg-blue-500',
  }: {
    icon: any;
    label: string;
    value: boolean;
    onToggle: () => void;
    activeColor?: string;
  }) => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', value ? 'bg-slate-700' : 'bg-slate-800')}>
          <Icon className={cn('w-5 h-5', value ? 'text-white' : 'text-slate-500')} />
        </div>
        <span className="text-white font-medium">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'w-12 h-7 rounded-full transition-all relative',
          value ? activeColor : 'bg-slate-700'
        )}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-4 flex items-center gap-3"
      >
        <button
          onClick={onClose}
          className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">{t('title')}</h1>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {/* Audio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Audio</h2>
          <div className="space-y-2">
            <SettingRow
              icon={sound ? Volume2 : VolumeX}
              label={t('sound')}
              value={sound}
              onToggle={() => setSound(!sound)}
              activeColor="bg-blue-500"
            />
            <SettingRow
              icon={music ? Music2 : Music}
              label={t('music')}
              value={music}
              onToggle={() => setMusic(!music)}
              activeColor="bg-purple-500"
            />
          </div>
        </motion.div>

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Feedback</h2>
          <div className="space-y-2">
            <SettingRow
              icon={Vibrate}
              label={t('vibration')}
              value={vibration}
              onToggle={() => setVibration(!vibration)}
              activeColor="bg-green-500"
            />
            <SettingRow
              icon={notifications ? Bell : BellOff}
              label={t('notifications')}
              value={notifications}
              onToggle={() => setNotifications(!notifications)}
              activeColor="bg-amber-500"
            />
          </div>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">{t('language')}</h2>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-full flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium">
                {language === 'pt' ? t('languagePt') : language === 'en' ? t('languageEn') : t('languageEs')}
              </span>
            </div>
            <ChevronRight className={cn('w-5 h-5 text-slate-400 transition-transform', showLangMenu && 'rotate-90')} />
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1">
                  {([
                    { code: 'pt' as const, label: t('languagePt') },
                    { code: 'en' as const, label: t('languageEn') },
                    { code: 'es' as const, label: t('languageEs') },
                  ]).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                        language === lang.code
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-slate-800/30 hover:bg-slate-800/50'
                      )}
                    >
                      <span className={cn('font-medium', language === lang.code ? 'text-blue-400' : 'text-slate-300')}>
                        {lang.label}
                      </span>
                      {language === lang.code && (
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xs font-bold text-red-500/60 uppercase tracking-wider mb-2 px-1">Danger Zone</h2>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-3 p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-red-400 font-medium">{t('resetData')}</span>
          </button>
        </motion.div>

        {/* Version */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-600">{t('version')} 1.0.0</p>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-red-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{t('resetData')}</h3>
              </div>
              <p className="text-slate-400 mb-6">{t('resetConfirm')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-400 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
