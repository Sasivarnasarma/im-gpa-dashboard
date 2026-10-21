import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Megaphone } from 'lucide-react';
import MStripeDivider from './MStripeDivider';
import useDialog from '../hooks/useDialog';

function getAnnouncementLink(link) {
  if (!link?.url?.trim() || !link?.text?.trim()) return null;
  try {
    const url = new URL(link.url.trim());
    return ['http:', 'https:'].includes(url.protocol)
      ? { url: url.href, text: link.text.trim() }
      : null;
  } catch {
    return null;
  }
}

export default function AnnouncementModal({ isOpen, announcement, onDismiss }) {
  const link = getAnnouncementLink(announcement.link);
  const { ref, props } = useDialog({
    isOpen,
    onClose: onDismiss,
    labelledBy: 'announcement-heading',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4"
        >
          <motion.div
            ref={ref}
            {...props}
            aria-describedby="announcement-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-card border border-hairline w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-none shadow-2xl relative"
          >
            <MStripeDivider />
            <div className="p-6 sm:p-8">
              <Megaphone className="w-6 h-6 text-m-blue-light mb-5" aria-hidden="true" />
              <h2
                id="announcement-heading"
                className="font-bmw-display font-bold text-lg text-white uppercase tracking-wider mb-4 wrap-break-word text-center"
              >
                {announcement.title}
              </h2>
              <p
                id="announcement-message"
                className="text-sm text-body-text leading-relaxed mb-6 whitespace-pre-line wrap-break-word text-justify"
              >
                {announcement.message}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="flex-1 min-w-0 py-3 px-4 bg-m-red hover:bg-m-red/80 text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none border border-m-red transition-colors cursor-pointer wrap-break-word"
                >
                  {announcement.buttonText.trim() || 'Got it'}
                </button>
                {link && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-4 bg-surface-card border border-hairline hover:border-white text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors cursor-pointer"
                  >
                    <span className="min-w-0 wrap-break-word">{link.text}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
