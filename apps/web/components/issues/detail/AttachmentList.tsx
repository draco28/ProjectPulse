/**
 * Attachment List Component
 *
 * Displays file attachments with icons, metadata, and download buttons
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html (lines 472-514)
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import type { AttachmentProps } from '@/types/issue';

interface AttachmentListProps {
  attachments: AttachmentProps[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {attachments.map((attachment) => (
        <AttachmentItem key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}

/**
 * Individual Attachment Item
 * Displays file icon, name, metadata, and download button
 */
function AttachmentItem({ attachment }: { attachment: AttachmentProps }) {
  const { icon, color } = getFileTypeIcon(attachment.mimetype);
  const formattedSize = formatFileSize(attachment.size);
  const uploadedAgo = formatDistanceToNow(new Date(attachment.uploadedAt), {
    addSuffix: true,
  });

  return (
    <div className="attachment-item smooth-transition neu-pressed cursor-pointer rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <i className={`${icon} text-xl`}></i>
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white" title={attachment.filename}>
            {attachment.filename}
          </p>
          <p className="text-xs text-slate">
            {formattedSize} • {getFileType(attachment.mimetype)}
          </p>
          <p className="text-xs text-slate">Uploaded {uploadedAgo}</p>
        </div>

        {/* Download Button */}
        <button
          className="smooth-transition text-slate hover:text-coral"
          onClick={() => handleDownload(attachment)}
          aria-label={`Download ${attachment.filename}`}
        >
          <i className="fas fa-download"></i>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get icon and color based on MIME type
 */
function getFileTypeIcon(mimetype: string): { icon: string; color: string } {
  if (mimetype.startsWith('image/')) {
    return { icon: 'fas fa-file-image', color: 'bg-purple-500/20 text-purple-400' };
  }

  if (mimetype.startsWith('video/')) {
    return { icon: 'fas fa-file-video', color: 'bg-blue-500/20 text-blue-400' };
  }

  if (mimetype.startsWith('audio/')) {
    return { icon: 'fas fa-file-audio', color: 'bg-green-500/20 text-green-400' };
  }

  if (mimetype === 'application/pdf') {
    return { icon: 'fas fa-file-pdf', color: 'bg-red-500/20 text-red-400' };
  }

  if (
    mimetype === 'application/zip' ||
    mimetype === 'application/x-zip-compressed' ||
    mimetype === 'application/x-rar-compressed'
  ) {
    return { icon: 'fas fa-file-archive', color: 'bg-yellow-500/20 text-yellow-400' };
  }

  if (
    mimetype.includes('word') ||
    mimetype.includes('document') ||
    mimetype === 'application/msword'
  ) {
    return { icon: 'fas fa-file-word', color: 'bg-blue-600/20 text-blue-500' };
  }

  if (
    mimetype.includes('excel') ||
    mimetype.includes('spreadsheet') ||
    mimetype === 'application/vnd.ms-excel'
  ) {
    return { icon: 'fas fa-file-excel', color: 'bg-green-600/20 text-green-500' };
  }

  if (
    mimetype.includes('powerpoint') ||
    mimetype.includes('presentation') ||
    mimetype === 'application/vnd.ms-powerpoint'
  ) {
    return { icon: 'fas fa-file-powerpoint', color: 'bg-orange-500/20 text-orange-400' };
  }

  if (mimetype.startsWith('text/') || mimetype === 'application/json') {
    return { icon: 'fas fa-file-code', color: 'bg-cyan-500/20 text-cyan-400' };
  }

  // Default for unknown types
  return { icon: 'fas fa-file', color: 'bg-slate/20 text-slate' };
}

/**
 * Get friendly file type name from MIME type
 */
function getFileType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'Image';
  if (mimetype.startsWith('video/')) return 'Video';
  if (mimetype.startsWith('audio/')) return 'Audio';
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return 'Archive';
  if (mimetype.includes('word')) return 'Document';
  if (mimetype.includes('excel')) return 'Spreadsheet';
  if (mimetype.includes('powerpoint')) return 'Presentation';
  if (mimetype.startsWith('text/')) return 'Text';
  return 'File';
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Handle file download
 * TODO: Implement actual file download from server
 */
function handleDownload(attachment: AttachmentProps) {
  console.log('Downloading:', attachment.filename);
  // TODO: Implement download logic
  // fetch(attachment.filepath)
  //   .then(res => res.blob())
  //   .then(blob => {
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = attachment.filename;
  //     a.click();
  //   });
}
